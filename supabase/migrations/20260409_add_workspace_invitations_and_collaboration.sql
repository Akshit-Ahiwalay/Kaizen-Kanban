create extension if not exists pgcrypto;

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_email text not null,
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  revoked_at timestamptz
);

create index if not exists workspace_invitations_workspace_id_idx
on public.workspace_invitations (workspace_id);

create index if not exists workspace_invitations_invited_email_idx
on public.workspace_invitations (invited_email);

create index if not exists workspace_invitations_pending_workspace_idx
on public.workspace_invitations (workspace_id, created_at desc)
where accepted_at is null and revoked_at is null;

alter table public.workspace_invitations enable row level security;

drop policy if exists "Workspace invitations are viewable by owner" on public.workspace_invitations;
create policy "Workspace invitations are viewable by owner"
on public.workspace_invitations
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_invitations.workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

create or replace function public.create_workspace_invitation(
  p_workspace_id uuid,
  p_invited_email text
)
returns table (
  invitation_id uuid,
  raw_token text,
  invited_email text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  next_raw_token text;
  next_token_hash text;
  next_expires_at timestamptz;
  next_invitation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'invite_requires_authentication';
  end if;

  normalized_email := lower(btrim(coalesce(p_invited_email, '')));

  if normalized_email = '' then
    raise exception 'invite_email_required';
  end if;

  if not exists (
    select 1
    from public.workspaces
    where workspaces.id = p_workspace_id
      and workspaces.owner_user_id = auth.uid()
  ) then
    raise exception 'invite_forbidden';
  end if;

  update public.workspace_invitations
  set revoked_at = now()
  where workspace_invitations.workspace_id = p_workspace_id
    and workspace_invitations.invited_email = normalized_email
    and workspace_invitations.accepted_at is null
    and workspace_invitations.revoked_at is null
    and workspace_invitations.expires_at > now();

  next_raw_token := encode(gen_random_bytes(24), 'hex');
  next_token_hash := encode(digest(next_raw_token, 'sha256'), 'hex');
  next_expires_at := now() + interval '7 days';

  insert into public.workspace_invitations (
    workspace_id,
    invited_email,
    invited_by_user_id,
    token_hash,
    expires_at
  )
  values (
    p_workspace_id,
    normalized_email,
    auth.uid(),
    next_token_hash,
    next_expires_at
  )
  returning id into next_invitation_id;

  return query
  select
    next_invitation_id,
    next_raw_token,
    normalized_email,
    next_expires_at;
end;
$$;

create or replace function public.accept_workspace_invitation(
  p_raw_token text
)
returns table (
  workspace_id uuid,
  workspace_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_user_email text;
  resolved_token_hash text;
  invitation_row public.workspace_invitations%rowtype;
  resolved_workspace public.workspaces%rowtype;
begin
  if auth.uid() is null then
    raise exception 'invite_requires_authentication';
  end if;

  if exists (
    select 1
    from auth.users
    where users.id = auth.uid()
      and users.is_anonymous
  ) then
    raise exception 'invite_requires_permanent_account';
  end if;

  select lower(btrim(users.email))
  into normalized_user_email
  from auth.users as users
  where users.id = auth.uid();

  if normalized_user_email is null or normalized_user_email = '' then
    raise exception 'invite_requires_matching_email';
  end if;

  if btrim(coalesce(p_raw_token, '')) = '' then
    raise exception 'invite_invalid';
  end if;

  resolved_token_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

  select *
  into invitation_row
  from public.workspace_invitations
  where workspace_invitations.token_hash = resolved_token_hash
  for update;

  if not found then
    raise exception 'invite_invalid';
  end if;

  if invitation_row.revoked_at is not null then
    raise exception 'invite_revoked';
  end if;

  if invitation_row.expires_at <= now() then
    raise exception 'invite_expired';
  end if;

  if invitation_row.invited_email <> normalized_user_email then
    raise exception 'invite_wrong_email';
  end if;

  select *
  into resolved_workspace
  from public.workspaces
  where workspaces.id = invitation_row.workspace_id;

  if not found then
    raise exception 'invite_invalid';
  end if;

  if invitation_row.accepted_at is not null then
    if invitation_row.accepted_by_user_id = auth.uid() then
      insert into public.workspace_members (
        workspace_id,
        user_id
      )
      values (
        invitation_row.workspace_id,
        auth.uid()
      )
      on conflict (workspace_id, user_id) do nothing;

      return query
      select
        resolved_workspace.id,
        resolved_workspace.name;
      return;
    end if;

    raise exception 'invite_already_accepted';
  end if;

  insert into public.workspace_members (
    workspace_id,
    user_id
  )
  values (
    invitation_row.workspace_id,
    auth.uid()
  )
  on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invitations
  set accepted_at = now(),
      accepted_by_user_id = auth.uid()
  where workspace_invitations.id = invitation_row.id
    and workspace_invitations.accepted_at is null;

  return query
  select
    resolved_workspace.id,
    resolved_workspace.name;
end;
$$;

create or replace function public.revoke_workspace_invitation(
  p_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invitation public.workspace_invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'invite_requires_authentication';
  end if;

  select *
  into target_invitation
  from public.workspace_invitations
  where workspace_invitations.id = p_invitation_id
  for update;

  if not found then
    raise exception 'invite_not_found';
  end if;

  if not exists (
    select 1
    from public.workspaces
    where workspaces.id = target_invitation.workspace_id
      and workspaces.owner_user_id = auth.uid()
  ) then
    raise exception 'invite_forbidden';
  end if;

  if target_invitation.accepted_at is not null then
    raise exception 'invite_already_accepted';
  end if;

  if target_invitation.revoked_at is not null then
    return;
  end if;

  update public.workspace_invitations
  set revoked_at = now()
  where workspace_invitations.id = p_invitation_id
    and workspace_invitations.revoked_at is null;
end;
$$;

revoke all on function public.create_workspace_invitation(uuid, text) from public;
revoke all on function public.create_workspace_invitation(uuid, text) from anon;
grant execute on function public.create_workspace_invitation(uuid, text) to authenticated;

revoke all on function public.accept_workspace_invitation(text) from public;
revoke all on function public.accept_workspace_invitation(text) from anon;
grant execute on function public.accept_workspace_invitation(text) to authenticated;

revoke all on function public.revoke_workspace_invitation(uuid) from public;
revoke all on function public.revoke_workspace_invitation(uuid) from anon;
grant execute on function public.revoke_workspace_invitation(uuid) to authenticated;

drop policy if exists "Team members must match workspace or legacy owner on select" on public.team_members;
create policy "Team members must match workspace membership or legacy owner on select"
on public.team_members
as restrictive
for select
to authenticated
using (
  (
    workspace_id is null
    and auth.uid() = user_id
  )
  or (
    workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Team members must match workspace or legacy owner on insert" on public.team_members;
create policy "Team members must match workspace membership or legacy owner on insert"
on public.team_members
as restrictive
for insert
to authenticated
with check (
  (
    workspace_id is null
    and auth.uid() = user_id
  )
  or (
    workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Team members must match workspace or legacy owner on update" on public.team_members;
create policy "Team members must match workspace membership or legacy owner on update"
on public.team_members
as restrictive
for update
to authenticated
using (
  (
    workspace_id is null
    and auth.uid() = user_id
  )
  or (
    workspace_id is not null
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
    workspace_id is null
    and auth.uid() = user_id
  )
  or (
    workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Team members must match workspace or legacy owner on delete" on public.team_members;
create policy "Team members must match workspace membership or legacy owner on delete"
on public.team_members
as restrictive
for delete
to authenticated
using (
  (
    workspace_id is null
    and auth.uid() = user_id
  )
  or (
    workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = team_members.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Tasks must match workspace or legacy owner on select" on public.tasks;
create policy "Tasks must match workspace membership or legacy owner on select"
on public.tasks
as restrictive
for select
to authenticated
using (
  (
    workspace_id is null
    and auth.uid() = user_id
  )
  or (
    workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Tasks must match workspace or legacy owner on insert" on public.tasks;
create policy "Tasks must match workspace membership or legacy owner on insert"
on public.tasks
as restrictive
for insert
to authenticated
with check (
  (
    (
      workspace_id is null
      and auth.uid() = user_id
    )
    or (
      workspace_id is not null
      and exists (
        select 1
        from public.workspace_members
        where workspace_members.workspace_id = tasks.workspace_id
          and workspace_members.user_id = auth.uid()
      )
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
create policy "Tasks must match workspace membership or legacy owner on update"
on public.tasks
as restrictive
for update
to authenticated
using (
  (
    workspace_id is null
    and auth.uid() = user_id
  )
  or (
    workspace_id is not null
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
      workspace_id is null
      and auth.uid() = user_id
    )
    or (
      workspace_id is not null
      and exists (
        select 1
        from public.workspace_members
        where workspace_members.workspace_id = tasks.workspace_id
          and workspace_members.user_id = auth.uid()
      )
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
create policy "Tasks must match workspace membership or legacy owner on delete"
on public.tasks
as restrictive
for delete
to authenticated
using (
  (
    workspace_id is null
    and auth.uid() = user_id
  )
  or (
    workspace_id is not null
    and exists (
      select 1
      from public.workspace_members
      where workspace_members.workspace_id = tasks.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  )
);
