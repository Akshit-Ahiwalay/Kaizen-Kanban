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
    from auth.users as u
    where u.id = auth.uid()
      and u.is_anonymous
  ) then
    raise exception 'invite_requires_permanent_account';
  end if;

  select lower(btrim(u.email))
  into normalized_user_email
  from auth.users as u
  where u.id = auth.uid();

  if normalized_user_email is null or normalized_user_email = '' then
    raise exception 'invite_requires_matching_email';
  end if;

  if btrim(coalesce(p_raw_token, '')) = '' then
    raise exception 'invite_invalid';
  end if;

  resolved_token_hash := encode(extensions.digest(p_raw_token, 'sha256'), 'hex');

  select wi.*
  into invitation_row
  from public.workspace_invitations as wi
  where wi.token_hash = resolved_token_hash
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

  select w.*
  into resolved_workspace
  from public.workspaces as w
  where w.id = invitation_row.workspace_id;

  if not found then
    raise exception 'invite_invalid';
  end if;

  if invitation_row.accepted_at is not null then
    if invitation_row.accepted_by_user_id = auth.uid() then
      insert into public.workspace_members as wm (
        workspace_id,
        user_id
      )
      values (
        invitation_row.workspace_id,
        auth.uid()
      )
      on conflict on constraint workspace_members_pkey do nothing;

      return query
      select
        resolved_workspace.id as workspace_id,
        resolved_workspace.name as workspace_name;
      return;
    end if;

    raise exception 'invite_already_accepted';
  end if;

  insert into public.workspace_members as wm (
    workspace_id,
    user_id
  )
  values (
    invitation_row.workspace_id,
    auth.uid()
  )
  on conflict on constraint workspace_members_pkey do nothing;

  update public.workspace_invitations as wi
  set accepted_at = now(),
      accepted_by_user_id = auth.uid()
  where wi.id = invitation_row.id
    and wi.accepted_at is null;

  return query
  select
    resolved_workspace.id as workspace_id,
    resolved_workspace.name as workspace_name;
end;
$$;

revoke all on function public.accept_workspace_invitation(text) from public;
revoke all on function public.accept_workspace_invitation(text) from anon;
grant execute on function public.accept_workspace_invitation(text) to authenticated;
