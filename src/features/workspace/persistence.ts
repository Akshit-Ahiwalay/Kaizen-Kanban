import { supabase } from "@/integrations/supabase/client";

const ACTIVE_WORKSPACE_STORAGE_KEY = "kanban.active-workspace-id";

export interface PersonalWorkspace {
  id: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  ownerUserId: string;
  personalForUserId?: string;
}

export interface CreatedSharedWorkspace {
  workspaceId: string;
  workspaceName: string;
}

export interface WorkspaceInvitationSummary {
  id: string;
  invitedEmail: string;
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceMemberSummary {
  userId: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  isOwner: boolean;
}

export interface CreatedWorkspaceInvitation {
  invitationId: string;
  invitedEmail: string;
  expiresAt: string;
  rawToken: string;
}

export interface AcceptedWorkspaceInvitation {
  workspaceId: string;
  workspaceName: string;
}

const getFirstRpcRow = <TRow>(data: TRow[] | TRow | null | undefined): TRow | null => {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
};

export const ensurePersonalWorkspaceForCurrentUser = async (): Promise<PersonalWorkspace> => {
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const { data, error } = await supabase.rpc("ensure_personal_workspace");

  if (error) {
    throw error;
  }

  if (typeof data !== "string" || data.length === 0) {
    throw new Error("Workspace unavailable");
  }

  return { id: data };
};

export const fetchWorkspacesForCurrentUser = async (): Promise<WorkspaceSummary[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, owner_user_id, personal_for_user_id, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    ownerUserId: workspace.owner_user_id,
    personalForUserId: workspace.personal_for_user_id ?? undefined,
  }));
};

export const createSharedWorkspace = async (name: string): Promise<CreatedSharedWorkspace> => {
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const { data, error } = await supabase.rpc("create_shared_workspace", {
    p_name: name,
  });

  if (error) {
    throw error;
  }

  const createdWorkspace = getFirstRpcRow(data);

  if (!createdWorkspace) {
    throw new Error("Workspace unavailable");
  }

  return {
    workspaceId: createdWorkspace.workspace_id,
    workspaceName: createdWorkspace.workspace_name,
  };
};

export const fetchWorkspaceMembers = async (
  workspaceId: string,
): Promise<WorkspaceMemberSummary[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc("list_workspace_members", {
    p_workspace_id: workspaceId,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map((member) => ({
    userId: member.user_id,
    displayName: member.display_name,
    email: member.email,
    avatarUrl: member.avatar_url,
    joinedAt: member.joined_at,
    isOwner: member.is_owner,
  }));
};

export const fetchWorkspaceInvitationsForOwner = async (
  workspaceId: string,
): Promise<WorkspaceInvitationSummary[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("workspace_invitations")
    .select("id, invited_email, expires_at, created_at, accepted_at, revoked_at")
    .eq("workspace_id", workspaceId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((invitation) => ({
    id: invitation.id,
    invitedEmail: invitation.invited_email,
    expiresAt: invitation.expires_at,
    createdAt: invitation.created_at,
  }));
};

export const createWorkspaceInvitation = async (
  workspaceId: string,
  invitedEmail: string,
): Promise<CreatedWorkspaceInvitation> => {
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const { data, error } = await supabase.rpc("create_workspace_invitation", {
    p_workspace_id: workspaceId,
    p_invited_email: invitedEmail,
  });

  if (error) {
    throw error;
  }

  const invitation = data?.[0];

  if (!invitation) {
    throw new Error("Invitation unavailable");
  }

  return {
    invitationId: invitation.invitation_id,
    invitedEmail: invitation.invited_email,
    expiresAt: invitation.expires_at,
    rawToken: invitation.raw_token,
  };
};

export const acceptWorkspaceInvitation = async (
  rawToken: string,
): Promise<AcceptedWorkspaceInvitation | null> => {
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const { data, error } = await supabase.rpc("accept_workspace_invitation", {
    p_raw_token: rawToken,
  });

  if (error) {
    throw error;
  }

  const acceptedWorkspace = data?.[0];

  if (!acceptedWorkspace) {
    return null;
  }

  return {
    workspaceId: acceptedWorkspace.workspace_id,
    workspaceName: acceptedWorkspace.workspace_name,
  };
};

export const revokeWorkspaceInvitation = async (invitationId: string) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc("revoke_workspace_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) {
    throw error;
  }
};

const canUseLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const getStoredActiveWorkspaceId = () => {
  if (!canUseLocalStorage()) {
    return null;
  }

  const value = window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);

  return value && value.trim() ? value : null;
};

export const storeActiveWorkspaceId = (workspaceId: string) => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, workspaceId);
};

export const clearStoredActiveWorkspaceId = () => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
};

const resolveWorkspaceErrorCode = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const candidate = error as { message?: unknown };

  return typeof candidate.message === "string" ? candidate.message : undefined;
};

export const getWorkspaceInvitationErrorMessage = (error: unknown) => {
  switch (resolveWorkspaceErrorCode(error)) {
    case "invite_email_required":
      return "Enter a valid email address";
    case "invite_forbidden":
      return "Only the workspace owner can manage invites";
    case "invite_invalid":
      return "This invite link is invalid";
    case "invite_expired":
      return "This invite link has expired";
    case "invite_revoked":
      return "This invite link has been revoked";
    case "invite_already_accepted":
      return "This invite has already been used";
    case "invite_wrong_email":
      return "Sign in with the invited email address";
    case "invite_requires_authentication":
      return "Sign in to continue";
    case "invite_requires_permanent_account":
      return "Sign in with Google or a magic link to accept this invite";
    case "invite_requires_matching_email":
      return "Your account needs a confirmed email to accept this invite";
    case "invite_not_found":
      return "This invite no longer exists";
    default:
      return "Workspace invite unavailable";
  }
};

export const getWorkspaceErrorMessage = (error: unknown) => {
  const message = resolveWorkspaceErrorCode(error);

  switch (message) {
    case "workspace_requires_authentication":
      return "Sign in to continue";
    case "workspace_not_found":
      return "Workspace unavailable";
    case "workspace_forbidden":
      return "You no longer have access to this workspace";
    case "workspace_members_personal_workspace_forbidden":
      return "Personal workspaces only include you";
    default:
      if (message?.includes("create_shared_workspace")) {
        return "Shared workspace creation unavailable";
      }

      return "Workspace unavailable";
  }
};
