create or replace function public.remove_workspace_member(
  p_workspace_id uuid,
  p_member_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace public.workspaces%rowtype;
begin
  if auth.uid() is null then
    raise exception 'workspace_requires_authentication';
  end if;

  select w.*
  into target_workspace
  from public.workspaces as w
  where w.id = p_workspace_id;

  if not found then
    raise exception 'workspace_not_found';
  end if;

  if target_workspace.personal_for_user_id is not null then
    raise exception 'workspace_members_personal_workspace_forbidden';
  end if;

  if target_workspace.owner_user_id <> auth.uid() then
    raise exception 'workspace_forbidden';
  end if;

  if p_member_user_id = target_workspace.owner_user_id then
    raise exception 'workspace_owner_removal_forbidden';
  end if;

  delete from public.workspace_members as wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = p_member_user_id;

  if not found then
    raise exception 'workspace_member_not_found';
  end if;
end;
$$;

revoke all on function public.remove_workspace_member(uuid, uuid) from public;
revoke all on function public.remove_workspace_member(uuid, uuid) from anon;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;

create or replace function public.leave_shared_workspace(
  p_workspace_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace public.workspaces%rowtype;
begin
  if auth.uid() is null then
    raise exception 'workspace_requires_authentication';
  end if;

  select w.*
  into target_workspace
  from public.workspaces as w
  where w.id = p_workspace_id;

  if not found then
    raise exception 'workspace_not_found';
  end if;

  if target_workspace.personal_for_user_id is not null then
    raise exception 'workspace_members_personal_workspace_forbidden';
  end if;

  if target_workspace.owner_user_id = auth.uid() then
    raise exception 'workspace_owner_leave_forbidden';
  end if;

  delete from public.workspace_members as wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = auth.uid();

  if not found then
    raise exception 'workspace_forbidden';
  end if;
end;
$$;

revoke all on function public.leave_shared_workspace(uuid) from public;
revoke all on function public.leave_shared_workspace(uuid) from anon;
grant execute on function public.leave_shared_workspace(uuid) to authenticated;
