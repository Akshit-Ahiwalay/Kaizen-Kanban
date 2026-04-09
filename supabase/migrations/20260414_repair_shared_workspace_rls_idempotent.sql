alter table public.tasks enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "Users can view their own tasks" on public.tasks;
drop policy if exists "Users can insert their own tasks" on public.tasks;
drop policy if exists "Users can update their own tasks" on public.tasks;
drop policy if exists "Users can delete their own tasks" on public.tasks;
drop policy if exists "Users must insert their own tasks" on public.tasks;
drop policy if exists "Tasks assignee must belong to owner on insert" on public.tasks;
drop policy if exists "Tasks assignee must belong to owner on update" on public.tasks;
drop policy if exists "Tasks must match workspace or legacy owner on select" on public.tasks;
drop policy if exists "Tasks must match workspace or legacy owner on insert" on public.tasks;
drop policy if exists "Tasks must match workspace or legacy owner on update" on public.tasks;
drop policy if exists "Tasks must match workspace or legacy owner on delete" on public.tasks;
drop policy if exists "Tasks must match workspace membership or legacy owner on select" on public.tasks;
drop policy if exists "Tasks must match workspace membership or legacy owner on insert" on public.tasks;
drop policy if exists "Tasks must match workspace membership or legacy owner on update" on public.tasks;
drop policy if exists "Tasks must match workspace membership or legacy owner on delete" on public.tasks;
drop policy if exists "Tasks are accessible by workspace member or legacy owner" on public.tasks;
drop policy if exists "Tasks are accessible by workspace member or legacy owner on select" on public.tasks;
drop policy if exists "Tasks are accessible by workspace member or legacy owner on insert" on public.tasks;
drop policy if exists "Tasks are accessible by workspace member or legacy owner on update" on public.tasks;
drop policy if exists "Tasks are accessible by workspace member or legacy owner on delete" on public.tasks;

create policy "Tasks are accessible by workspace member or legacy owner on select"
on public.tasks
for select
to authenticated
using (
  (
    tasks.workspace_id is null
    and auth.uid() = tasks.user_id
  )
  or (
    tasks.workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

create policy "Tasks are accessible by workspace member or legacy owner on insert"
on public.tasks
for insert
to authenticated
with check (
  (
    (
      tasks.workspace_id is null
      and auth.uid() = tasks.user_id
    )
    or (
      tasks.workspace_id is not null
      and exists (
        select 1
        from public.workspace_members
        where workspace_members.workspace_id = tasks.workspace_id
          and workspace_members.user_id = auth.uid()
      )
    )
  )
  and (
    tasks.assignee_id is null
    or exists (
      select 1
      from public.team_members
      where team_members.id = tasks.assignee_id
        and (
          (
            tasks.workspace_id is null
            and team_members.workspace_id is null
            and team_members.user_id = auth.uid()
          )
          or (
            tasks.workspace_id is not null
            and team_members.workspace_id = tasks.workspace_id
          )
        )
    )
  )
);

create policy "Tasks are accessible by workspace member or legacy owner on update"
on public.tasks
for update
to authenticated
using (
  (
    tasks.workspace_id is null
    and auth.uid() = tasks.user_id
  )
  or (
    tasks.workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
)
with check (
  (
    (
      tasks.workspace_id is null
      and auth.uid() = tasks.user_id
    )
    or (
      tasks.workspace_id is not null
      and exists (
        select 1
        from public.workspace_members
        where workspace_members.workspace_id = tasks.workspace_id
          and workspace_members.user_id = auth.uid()
      )
    )
  )
  and (
    tasks.assignee_id is null
    or exists (
      select 1
      from public.team_members
      where team_members.id = tasks.assignee_id
        and (
          (
            tasks.workspace_id is null
            and team_members.workspace_id is null
            and team_members.user_id = auth.uid()
          )
          or (
            tasks.workspace_id is not null
            and team_members.workspace_id = tasks.workspace_id
          )
        )
    )
  )
);

create policy "Tasks are accessible by workspace member or legacy owner on delete"
on public.tasks
for delete
to authenticated
using (
  (
    tasks.workspace_id is null
    and auth.uid() = tasks.user_id
  )
  or (
    tasks.workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Team members are viewable by owner" on public.team_members;
drop policy if exists "Team members are insertable by owner" on public.team_members;
drop policy if exists "Team members are updatable by owner" on public.team_members;
drop policy if exists "Team members are deletable by owner" on public.team_members;
drop policy if exists "Team members must match workspace or legacy owner on select" on public.team_members;
drop policy if exists "Team members must match workspace or legacy owner on insert" on public.team_members;
drop policy if exists "Team members must match workspace or legacy owner on update" on public.team_members;
drop policy if exists "Team members must match workspace or legacy owner on delete" on public.team_members;
drop policy if exists "Team members must match workspace membership or legacy owner on select" on public.team_members;
drop policy if exists "Team members must match workspace membership or legacy owner on insert" on public.team_members;
drop policy if exists "Team members must match workspace membership or legacy owner on update" on public.team_members;
drop policy if exists "Team members must match workspace membership or legacy owner on delete" on public.team_members;
drop policy if exists "Team members are accessible by workspace member or legacy owner" on public.team_members;
drop policy if exists "Team members are accessible by workspace member or legacy owner on select" on public.team_members;
drop policy if exists "Team members are accessible by workspace member or legacy owner on insert" on public.team_members;
drop policy if exists "Team members are accessible by workspace member or legacy owner on update" on public.team_members;
drop policy if exists "Team members are accessible by workspace member or legacy owner on delete" on public.team_members;

create policy "Team members are accessible by workspace member or legacy owner on select"
on public.team_members
for select
to authenticated
using (
  (
    team_members.workspace_id is null
    and auth.uid() = team_members.user_id
  )
  or (
    team_members.workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

create policy "Team members are accessible by workspace member or legacy owner on insert"
on public.team_members
for insert
to authenticated
with check (
  (
    team_members.workspace_id is null
    and auth.uid() = team_members.user_id
  )
  or (
    team_members.workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

create policy "Team members are accessible by workspace member or legacy owner on update"
on public.team_members
for update
to authenticated
using (
  (
    team_members.workspace_id is null
    and auth.uid() = team_members.user_id
  )
  or (
    team_members.workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
)
with check (
  (
    team_members.workspace_id is null
    and auth.uid() = team_members.user_id
  )
  or (
    team_members.workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

create policy "Team members are accessible by workspace member or legacy owner on delete"
on public.team_members
for delete
to authenticated
using (
  (
    team_members.workspace_id is null
    and auth.uid() = team_members.user_id
  )
  or (
    team_members.workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);
