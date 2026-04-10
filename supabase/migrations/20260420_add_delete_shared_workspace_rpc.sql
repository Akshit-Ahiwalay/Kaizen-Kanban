create or replace function public.delete_shared_workspace(
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
  where w.id = p_workspace_id
  for update;

  if not found then
    raise exception 'workspace_not_found';
  end if;

  if target_workspace.personal_for_user_id is not null then
    raise exception 'workspace_delete_personal_workspace_forbidden';
  end if;

  if target_workspace.owner_user_id <> auth.uid() then
    raise exception 'workspace_delete_forbidden';
  end if;

  delete from public.workspaces as w
  where w.id = p_workspace_id;

  if not found then
    raise exception 'workspace_not_found';
  end if;
end;
$$;

revoke all on function public.delete_shared_workspace(uuid) from public;
revoke all on function public.delete_shared_workspace(uuid) from anon;
grant execute on function public.delete_shared_workspace(uuid) to authenticated;
