import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

const getAuthRedirectUrl = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}${window.location.pathname}`;
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

  const { error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
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

  return true;
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
