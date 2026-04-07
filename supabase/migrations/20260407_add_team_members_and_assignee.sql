create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create index if not exists team_members_user_id_idx on public.team_members (user_id);

alter table public.team_members enable row level security;

drop policy if exists "Team members are viewable by owner" on public.team_members;
create policy "Team members are viewable by owner"
on public.team_members
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Team members are insertable by owner" on public.team_members;
create policy "Team members are insertable by owner"
on public.team_members
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Team members are updatable by owner" on public.team_members;
create policy "Team members are updatable by owner"
on public.team_members
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Team members are deletable by owner" on public.team_members;
create policy "Team members are deletable by owner"
on public.team_members
for delete
to authenticated
using (auth.uid() = user_id);

alter table public.tasks
  add column if not exists assignee_id uuid references public.team_members(id) on delete set null;

create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);

drop policy if exists "Tasks assignee must belong to owner on insert" on public.tasks;
create policy "Tasks assignee must belong to owner on insert"
on public.tasks
as restrictive
for insert
to authenticated
with check (
  assignee_id is null
  or exists (
    select 1
    from public.team_members
    where team_members.id = tasks.assignee_id
      and team_members.user_id = auth.uid()
  )
);

drop policy if exists "Tasks assignee must belong to owner on update" on public.tasks;
create policy "Tasks assignee must belong to owner on update"
on public.tasks
as restrictive
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    assignee_id is null
    or exists (
      select 1
      from public.team_members
      where team_members.id = tasks.assignee_id
        and team_members.user_id = auth.uid()
    )
  )
);
