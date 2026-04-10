create or replace function public.create_shared_workspace(
  p_name text
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
  normalized_name text;
  v_workspace_id uuid;
  v_workspace_name text;
begin
  if auth.uid() is null then
    raise exception 'workspace_requires_authentication';
  end if;

  normalized_name := btrim(coalesce(p_name, ''));

  if normalized_name = '' then
    normalized_name := 'Shared workspace';
  end if;

  insert into public.workspaces (
    name,
    owner_user_id,
    personal_for_user_id
  )
  values (
    normalized_name,
    auth.uid(),
    null
  )
  returning id, name
  into v_workspace_id, v_workspace_name;

  insert into public.workspace_members as wm (
    workspace_id,
    user_id
  )
  values (
    v_workspace_id,
    auth.uid()
  )
  on conflict on constraint workspace_members_pkey do nothing;

  return query
  select
    v_workspace_id as workspace_id,
    v_workspace_name as workspace_name;
end;
$$;

revoke all on function public.create_shared_workspace(text) from public;
revoke all on function public.create_shared_workspace(text) from anon;
grant execute on function public.create_shared_workspace(text) to authenticated;
