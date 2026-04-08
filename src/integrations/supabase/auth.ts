import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

const AUTH_PENDING_FLOW_STORAGE_KEY = "kanban.pending-auth-flow";
const PENDING_FLOW_MAX_AGE_MS = 1000 * 60 * 60 * 24;

export type PendingAuthFlowKind = "guest-upgrade-google" | "guest-upgrade-email";

export interface PendingAuthFlow {
  kind: PendingAuthFlowKind;
  startedAt: number;
  returnToBoard: boolean;
  email?: string;
}

export interface RedirectAuthError {
  code?: string;
  description?: string;
  error?: string;
}

const getAuthRedirectUrl = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}${window.location.pathname}`;
};

const canUseSessionStorage = () =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const persistPendingAuthFlow = (flow: PendingAuthFlow) => {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(AUTH_PENDING_FLOW_STORAGE_KEY, JSON.stringify(flow));
};

export const getPendingAuthFlow = (): PendingAuthFlow | null => {
  if (!canUseSessionStorage()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(AUTH_PENDING_FLOW_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as PendingAuthFlow;

    if (
      !parsed ||
      (parsed.kind !== "guest-upgrade-google" && parsed.kind !== "guest-upgrade-email") ||
      typeof parsed.startedAt !== "number"
    ) {
      window.sessionStorage.removeItem(AUTH_PENDING_FLOW_STORAGE_KEY);
      return null;
    }

    if (Date.now() - parsed.startedAt > PENDING_FLOW_MAX_AGE_MS) {
      window.sessionStorage.removeItem(AUTH_PENDING_FLOW_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.sessionStorage.removeItem(AUTH_PENDING_FLOW_STORAGE_KEY);
    return null;
  }
};

export const clearPendingAuthFlow = () => {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(AUTH_PENDING_FLOW_STORAGE_KEY);
};

const parseRedirectParams = () => {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.search);
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const mergedParams = new URLSearchParams();

  searchParams.forEach((value, key) => mergedParams.set(key, value));
  hashParams.forEach((value, key) => mergedParams.set(key, value));

  return mergedParams;
};

export const readRedirectAuthError = (): RedirectAuthError | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const params = parseRedirectParams();
  const code = params.get("error_code") ?? undefined;
  const description = params.get("error_description") ?? undefined;
  const error = params.get("error") ?? undefined;

  if (!code && !description && !error) {
    return null;
  }

  const url = new URL(window.location.href);

  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");

  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  hashParams.delete("error");
  hashParams.delete("error_code");
  hashParams.delete("error_description");
  url.hash = hashParams.toString() ? `#${hashParams.toString()}` : "";

  window.history.replaceState(window.history.state, "", url.toString());

  return {
    code,
    description,
    error,
  };
};

const resolveAuthErrorCode = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const candidate = error as { code?: unknown };

  return typeof candidate.code === "string" ? candidate.code : undefined;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  return session;
};

export const continueAsGuest = async (): Promise<Session | null> => {
  if (!supabase) {
    return null;
  }

  const session = await getCurrentSession();

  if (session) {
    return session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  return data.session;
};

const getAnonymousSession = async () => {
  const session = await getCurrentSession();

  if (!session?.user?.is_anonymous) {
    return null;
  }

  return session;
};

export const signInWithGoogle = async () => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    throw error;
  }
};

export const upgradeGuestToGoogle = async () => {
  if (!supabase) {
    return false;
  }

  const session = await getAnonymousSession();

  if (!session) {
    return false;
  }

  persistPendingAuthFlow({
    kind: "guest-upgrade-google",
    startedAt: Date.now(),
    returnToBoard: true,
  });

  const { error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    clearPendingAuthFlow();
    throw error;
  }

  return true;
};

export const sendMagicLink = async (email: string) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    throw error;
  }
};

export const upgradeGuestToEmail = async (email: string) => {
  if (!supabase) {
    return false;
  }

  const session = await getAnonymousSession();

  if (!session) {
    return false;
  }

  const { error } = await supabase.auth.updateUser(
    { email },
    {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  );

  if (error) {
    throw error;
  }

  persistPendingAuthFlow({
    kind: "guest-upgrade-email",
    startedAt: Date.now(),
    returnToBoard: true,
    email,
  });

  return true;
};

export const getGuestUpgradePendingMessage = (flow: PendingAuthFlow) => {
  if (flow.kind === "guest-upgrade-email") {
    return "Check your email to finish upgrade";
  }

  return "Completing upgrade";
};

export const getGuestUpgradeSuccessMessage = (flow: PendingAuthFlow) => {
  if (flow.kind === "guest-upgrade-email") {
    return "Email confirmed";
  }

  return "Google account linked";
};

export const getGuestUpgradeErrorMessage = (
  error: RedirectAuthError | unknown,
  flowKind?: PendingAuthFlowKind,
) => {
  const code = resolveAuthErrorCode(error);

  switch (code) {
    case "identity_already_exists":
    case "email_exists":
    case "email_conflict_identity_not_deletable":
    case "user_already_exists":
      return flowKind === "guest-upgrade-email"
        ? "That email is already linked to another account"
        : "That Google account is already linked to another account";
    case "manual_linking_disabled":
    case "provider_disabled":
    case "oauth_provider_not_supported":
      return "Google upgrade is unavailable";
    case "email_provider_disabled":
      return "Email upgrade is unavailable";
    case "email_address_invalid":
      return "Enter a valid email address";
    case "bad_oauth_state":
    case "bad_oauth_callback":
    case "flow_state_not_found":
    case "flow_state_expired":
    case "bad_code_verifier":
      return "Upgrade did not complete. Try again";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return flowKind === "guest-upgrade-email"
        ? "Too many email attempts. Try again soon"
        : "Too many attempts. Try again soon";
    case "request_timeout":
      return "Upgrade timed out. Try again";
    default:
      return flowKind === "guest-upgrade-email"
        ? "Email upgrade unavailable"
        : "Google upgrade unavailable";
  }
};

export const signOutSession = async () => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};
