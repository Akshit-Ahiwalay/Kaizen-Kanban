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
  target_workspace public.workspaces%rowtype;
begin
  if auth.uid() is null then
    raise exception 'invite_requires_authentication';
  end if;

  normalized_email := lower(btrim(coalesce(p_invited_email, '')));

  if normalized_email = '' then
    raise exception 'invite_email_required';
  end if;

  select *
  into target_workspace
  from public.workspaces
  where workspaces.id = p_workspace_id
    and workspaces.owner_user_id = auth.uid();

  if not found then
    raise exception 'invite_forbidden';
  end if;

  if target_workspace.personal_for_user_id is not null then
    raise exception 'invite_personal_workspace_forbidden';
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

revoke all on function public.create_workspace_invitation(uuid, text) from public;
revoke all on function public.create_workspace_invitation(uuid, text) from anon;
grant execute on function public.create_workspace_invitation(uuid, text) to authenticated;
