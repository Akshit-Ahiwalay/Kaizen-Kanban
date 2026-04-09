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

export interface WorkspaceInvitationSummary {
  id: string;
  invitedEmail: string;
  expiresAt: string;
  createdAt: string;
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
