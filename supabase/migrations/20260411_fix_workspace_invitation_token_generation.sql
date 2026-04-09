create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

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

  next_raw_token := encode(extensions.gen_random_bytes(24), 'hex');
  next_token_hash := encode(extensions.digest(next_raw_token, 'sha256'), 'hex');
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

  resolved_token_hash := encode(extensions.digest(p_raw_token, 'sha256'), 'hex');

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

revoke all on function public.create_workspace_invitation(uuid, text) from public;
revoke all on function public.create_workspace_invitation(uuid, text) from anon;
grant execute on function public.create_workspace_invitation(uuid, text) to authenticated;

revoke all on function public.accept_workspace_invitation(text) from public;
revoke all on function public.accept_workspace_invitation(text) from anon;
grant execute on function public.accept_workspace_invitation(text) to authenticated;
