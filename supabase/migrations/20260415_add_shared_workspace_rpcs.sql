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
  created_workspace public.workspaces%rowtype;
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
  returning *
  into created_workspace;

  insert into public.workspace_members (
    workspace_id,
    user_id
  )
  values (
    created_workspace.id,
    auth.uid()
  )
  on conflict (workspace_id, user_id) do nothing;

  return query
  select
    created_workspace.id,
    created_workspace.name;
end;
$$;

revoke all on function public.create_shared_workspace(text) from public;
revoke all on function public.create_shared_workspace(text) from anon;
grant execute on function public.create_shared_workspace(text) to authenticated;

create or replace function public.list_workspace_members(
  p_workspace_id uuid
)
returns table (
  user_id uuid,
  display_name text,
  email text,
  avatar_url text,
  joined_at timestamptz,
  is_owner boolean
)
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

  select *
  into target_workspace
  from public.workspaces
  where workspaces.id = p_workspace_id;

  if not found then
    raise exception 'workspace_not_found';
  end if;

  if target_workspace.personal_for_user_id is not null then
    raise exception 'workspace_members_personal_workspace_forbidden';
  end if;

  if not exists (
    select 1
    from public.workspace_members
    where workspace_members.workspace_id = p_workspace_id
      and workspace_members.user_id = auth.uid()
  ) then
    raise exception 'workspace_forbidden';
  end if;

  return query
  select
    wm.user_id,
    p.display_name,
    p.email,
    p.avatar_url,
    wm.created_at,
    wm.user_id = target_workspace.owner_user_id as is_owner
  from public.workspace_members as wm
  left join public.profiles as p
    on p.id = wm.user_id
  where wm.workspace_id = p_workspace_id
  order by
    case when wm.user_id = target_workspace.owner_user_id then 0 else 1 end,
    coalesce(nullif(p.display_name, ''), nullif(p.email, ''), wm.user_id::text);
end;
$$;

revoke all on function public.list_workspace_members(uuid) from public;
revoke all on function public.list_workspace_members(uuid) from anon;
grant execute on function public.list_workspace_members(uuid) to authenticated;
