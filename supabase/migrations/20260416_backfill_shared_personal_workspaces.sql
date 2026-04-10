do $$
declare
  legacy_workspace record;
  shared_workspace_id uuid;
  shared_workspace_name text;
begin
  for legacy_workspace in
    select
      w.id,
      w.name,
      w.owner_user_id
    from public.workspaces as w
    where w.personal_for_user_id is not null
      and (
        exists (
          select 1
          from public.workspace_members as wm
          where wm.workspace_id = w.id
            and wm.user_id <> w.owner_user_id
        )
        or exists (
          select 1
          from public.workspace_invitations as wi
          where wi.workspace_id = w.id
            and wi.accepted_at is null
            and wi.revoked_at is null
            and wi.expires_at > now()
        )
      )
    order by w.created_at, w.id
  loop
    shared_workspace_name := btrim(coalesce(legacy_workspace.name, ''));

    if shared_workspace_name = ''
      or lower(shared_workspace_name) = 'personal workspace' then
      shared_workspace_name := 'Shared workspace';
    end if;

    insert into public.workspaces (
      name,
      owner_user_id,
      personal_for_user_id
    )
    values (
      shared_workspace_name,
      legacy_workspace.owner_user_id,
      null
    )
    returning id
    into shared_workspace_id;

    insert into public.workspace_members (
      workspace_id,
      user_id
    )
    values (
      shared_workspace_id,
      legacy_workspace.owner_user_id
    )
    on conflict (workspace_id, user_id) do nothing;

    insert into public.workspace_members (
      workspace_id,
      user_id
    )
    select
      shared_workspace_id,
      wm.user_id
    from public.workspace_members as wm
    where wm.workspace_id = legacy_workspace.id
    on conflict (workspace_id, user_id) do nothing;

    update public.tasks
    set workspace_id = shared_workspace_id
    where tasks.workspace_id = legacy_workspace.id;

    update public.team_members
    set workspace_id = shared_workspace_id
    where team_members.workspace_id = legacy_workspace.id;

    update public.workspace_invitations
    set workspace_id = shared_workspace_id
    where workspace_invitations.workspace_id = legacy_workspace.id;

    delete from public.workspace_members
    where workspace_members.workspace_id = legacy_workspace.id
      and workspace_members.user_id <> legacy_workspace.owner_user_id;
  end loop;
end;
$$;
