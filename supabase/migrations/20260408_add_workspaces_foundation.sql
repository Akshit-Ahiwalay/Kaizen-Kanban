create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  personal_for_user_id uuid unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint workspaces_personal_owner_match check (
    personal_for_user_id is null
    or owner_user_id = personal_for_user_id
  )
);

create index if not exists workspaces_owner_user_id_idx
on public.workspaces (owner_user_id);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx
on public.workspace_members (user_id);

alter table public.tasks
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.team_members
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

create index if not exists tasks_workspace_id_idx
on public.tasks (workspace_id);

create index if not exists team_members_workspace_id_idx
on public.team_members (workspace_id);

create index if not exists tasks_workspace_status_sort_order_idx
on public.tasks (workspace_id, status, sort_order);

create or replace function public.ensure_personal_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.workspaces (
    name,
    owner_user_id,
    personal_for_user_id
  )
  values (
    'Personal workspace',
    auth.uid(),
    auth.uid()
  )
  on conflict (personal_for_user_id)
  do update
  set owner_user_id = excluded.owner_user_id
  returning id into target_workspace_id;

  insert into public.workspace_members (
    workspace_id,
    user_id
  )
  values (
    target_workspace_id,
    auth.uid()
  )
  on conflict (workspace_id, user_id) do nothing;

  return target_workspace_id;
end;
$$;

revoke all on function public.ensure_personal_workspace() from public;
revoke all on function public.ensure_personal_workspace() from anon;
grant execute on function public.ensure_personal_workspace() to authenticated;

with existing_user_ids as (
  select id as user_id
  from public.profiles
  union
  select user_id
  from public.tasks
  union
  select user_id
  from public.team_members
)
insert into public.workspaces (
  name,
  owner_user_id,
  personal_for_user_id
)
select
  'Personal workspace',
  existing_user_ids.user_id,
  existing_user_ids.user_id
from existing_user_ids
on conflict (personal_for_user_id) do nothing;

insert into public.workspace_members (
  workspace_id,
  user_id
)
select
  workspaces.id,
  workspaces.personal_for_user_id
from public.workspaces
where workspaces.personal_for_user_id is not null
on conflict (workspace_id, user_id) do nothing;

update public.tasks
set workspace_id = workspaces.id
from public.workspaces
where tasks.workspace_id is null
  and workspaces.personal_for_user_id = tasks.user_id;

update public.team_members
set workspace_id = workspaces.id
from public.workspaces
where team_members.workspace_id is null
  and workspaces.personal_for_user_id = team_members.user_id;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "Workspaces are viewable by member" on public.workspaces;
create policy "Workspaces are viewable by member"
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members
    where workspace_members.workspace_id = workspaces.id
      and workspace_members.user_id = auth.uid()
  )
);

drop policy if exists "Workspace memberships are viewable by member" on public.workspace_members;
create policy "Workspace memberships are viewable by member"
on public.workspace_members
for select
to authenticated
using (workspace_members.user_id = auth.uid());

drop policy if exists "Team members must match workspace or legacy owner on select" on public.team_members;
create policy "Team members must match workspace or legacy owner on select"
on public.team_members
as restrictive
for select
to authenticated
using (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Team members must match workspace or legacy owner on insert" on public.team_members;
create policy "Team members must match workspace or legacy owner on insert"
on public.team_members
as restrictive
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Team members must match workspace or legacy owner on update" on public.team_members;
create policy "Team members must match workspace or legacy owner on update"
on public.team_members
as restrictive
for update
to authenticated
using (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
)
with check (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Team members must match workspace or legacy owner on delete" on public.team_members;
create policy "Team members must match workspace or legacy owner on delete"
on public.team_members
as restrictive
for delete
to authenticated
using (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Tasks assignee must belong to owner on insert" on public.tasks;
drop policy if exists "Tasks assignee must belong to owner on update" on public.tasks;

drop policy if exists "Tasks must match workspace or legacy owner on select" on public.tasks;
create policy "Tasks must match workspace or legacy owner on select"
on public.tasks
as restrictive
for select
to authenticated
using (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Tasks must match workspace or legacy owner on insert" on public.tasks;
create policy "Tasks must match workspace or legacy owner on insert"
on public.tasks
as restrictive
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
  and (
    assignee_id is null
    or exists (
      select 1
      from public.team_members
      where team_members.id = tasks.assignee_id
        and (
          (tasks.workspace_id is not null and team_members.workspace_id = tasks.workspace_id)
          or (tasks.workspace_id is null and team_members.user_id = auth.uid())
        )
    )
  )
);

drop policy if exists "Tasks must match workspace or legacy owner on update" on public.tasks;
create policy "Tasks must match workspace or legacy owner on update"
on public.tasks
as restrictive
for update
to authenticated
using (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
)
with check (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
  and (
    assignee_id is null
    or exists (
      select 1
      from public.team_members
      where team_members.id = tasks.assignee_id
        and (
          (tasks.workspace_id is not null and team_members.workspace_id = tasks.workspace_id)
          or (tasks.workspace_id is null and team_members.user_id = auth.uid())
        )
    )
  )
);

drop policy if exists "Tasks must match workspace or legacy owner on delete" on public.tasks;
create policy "Tasks must match workspace or legacy owner on delete"
on public.tasks
as restrictive
for delete
to authenticated
using (
  auth.uid() = user_id
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);
