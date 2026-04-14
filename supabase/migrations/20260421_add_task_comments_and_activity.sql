create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint task_comments_body_not_blank check (char_length(btrim(body)) > 0)
);

create index if not exists task_comments_task_id_created_at_idx
on public.task_comments (task_id, created_at);

create index if not exists task_comments_workspace_id_created_at_idx
on public.task_comments (workspace_id, created_at);

create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null
    check (event_type in (
      'task_created',
      'task_edited',
      'task_moved',
      'assignee_changed',
      'comment_added'
    )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists task_activity_task_id_created_at_idx
on public.task_activity (task_id, created_at);

create index if not exists task_activity_workspace_id_created_at_idx
on public.task_activity (workspace_id, created_at);

create index if not exists task_activity_workspace_event_created_at_idx
on public.task_activity (workspace_id, event_type, created_at);

alter table public.task_comments enable row level security;
alter table public.task_activity enable row level security;

drop policy if exists "Task comments are readable by workspace members" on public.task_comments;
create policy "Task comments are readable by workspace members"
on public.task_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members
    where workspace_members.workspace_id = task_comments.workspace_id
      and workspace_members.user_id = auth.uid()
  )
);

drop policy if exists "Task comments are insertable by workspace members" on public.task_comments;
create policy "Task comments are insertable by workspace members"
on public.task_comments
for insert
to authenticated
with check (
  task_comments.author_user_id = auth.uid()
  and exists (
    select 1
    from public.workspace_members
    where workspace_members.workspace_id = task_comments.workspace_id
      and workspace_members.user_id = auth.uid()
  )
);

drop policy if exists "Task activity is readable by workspace members" on public.task_activity;
create policy "Task activity is readable by workspace members"
on public.task_activity
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members
    where workspace_members.workspace_id = task_activity.workspace_id
      and workspace_members.user_id = auth.uid()
  )
);

create or replace function public.prepare_task_comment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_actor_user_id uuid;
begin
  v_actor_user_id := auth.uid();

  if v_actor_user_id is null then
    raise exception 'workspace_requires_authentication';
  end if;

  new.body := btrim(coalesce(new.body, ''));

  if new.body = '' then
    raise exception 'task_comment_body_required';
  end if;

  select tasks.workspace_id
  into v_workspace_id
  from public.tasks
  where tasks.id = new.task_id;

  if v_workspace_id is null then
    raise exception 'task_not_found';
  end if;

  new.workspace_id := v_workspace_id;
  new.author_user_id := v_actor_user_id;

  return new;
end;
$$;

create or replace function public.log_task_activity_from_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid;
  v_changed_fields text[] := array[]::text[];
begin
  v_actor_user_id := auth.uid();

  if v_actor_user_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.workspace_id is null then
      return new;
    end if;

    insert into public.task_activity (
      task_id,
      workspace_id,
      actor_user_id,
      event_type
    )
    values (
      new.id,
      new.workspace_id,
      v_actor_user_id,
      'task_created'
    );

    return new;
  end if;

  if new.workspace_id is null then
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.task_activity (
      task_id,
      workspace_id,
      actor_user_id,
      event_type,
      metadata
    )
    values (
      new.id,
      new.workspace_id,
      v_actor_user_id,
      'task_moved',
      jsonb_build_object(
        'from_status', old.status,
        'to_status', new.status
      )
    );
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    insert into public.task_activity (
      task_id,
      workspace_id,
      actor_user_id,
      event_type,
      metadata
    )
    values (
      new.id,
      new.workspace_id,
      v_actor_user_id,
      'assignee_changed',
      jsonb_build_object(
        'from_assignee_id', old.assignee_id,
        'to_assignee_id', new.assignee_id
      )
    );
  end if;

  if new.title is distinct from old.title then
    v_changed_fields := array_append(v_changed_fields, 'title');
  end if;

  if new.description is distinct from old.description then
    v_changed_fields := array_append(v_changed_fields, 'description');
  end if;

  if new.priority is distinct from old.priority then
    v_changed_fields := array_append(v_changed_fields, 'priority');
  end if;

  if new.due_date is distinct from old.due_date then
    v_changed_fields := array_append(v_changed_fields, 'due_date');
  end if;

  if array_length(v_changed_fields, 1) is not null then
    insert into public.task_activity (
      task_id,
      workspace_id,
      actor_user_id,
      event_type,
      metadata
    )
    values (
      new.id,
      new.workspace_id,
      v_actor_user_id,
      'task_edited',
      jsonb_build_object('changed_fields', to_jsonb(v_changed_fields))
    );
  end if;

  return new;
end;
$$;

create or replace function public.log_task_activity_from_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.task_activity (
    task_id,
    workspace_id,
    actor_user_id,
    event_type,
    metadata
  )
  values (
    new.task_id,
    new.workspace_id,
    new.author_user_id,
    'comment_added',
    jsonb_build_object('comment_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists prepare_task_comment_before_insert on public.task_comments;
create trigger prepare_task_comment_before_insert
before insert on public.task_comments
for each row
execute function public.prepare_task_comment();

drop trigger if exists log_task_activity_after_insert on public.tasks;
create trigger log_task_activity_after_insert
after insert on public.tasks
for each row
execute function public.log_task_activity_from_tasks();

drop trigger if exists log_task_activity_after_update on public.tasks;
create trigger log_task_activity_after_update
after update on public.tasks
for each row
execute function public.log_task_activity_from_tasks();

drop trigger if exists log_task_comment_activity_after_insert on public.task_comments;
create trigger log_task_comment_activity_after_insert
after insert on public.task_comments
for each row
execute function public.log_task_activity_from_comments();
