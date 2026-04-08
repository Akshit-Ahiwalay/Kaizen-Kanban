import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { AppProfile } from "./types";

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const selectProfileFields = "id, email, display_name, avatar_url, created_at";

const resolveDisplayName = (user: User) => {
  const metadata = user.user_metadata ?? {};

  return (
    metadata.full_name ??
    metadata.name ??
    metadata.user_name ??
    user.email?.split("@")[0] ??
    null
  );
};

export const resolveUserAvatarUrl = (user?: User | null) => {
  if (!user) {
    return null;
  }

  const metadata = user.user_metadata ?? {};
  const identityAvatarUrl =
    user.identities
      ?.map((identity) => identity.identity_data?.avatar_url ?? identity.identity_data?.picture ?? null)
      .find((value): value is string => Boolean(value)) ?? null;

  return metadata.avatar_url ?? metadata.picture ?? identityAvatarUrl ?? null;
};

const buildProfileInsert = (user: User, existingProfile?: ProfileRow | null): ProfileInsert => ({
  id: user.id,
  email: user.email ?? existingProfile?.email ?? null,
  display_name: resolveDisplayName(user) ?? existingProfile?.display_name ?? null,
  avatar_url: resolveUserAvatarUrl(user) ?? existingProfile?.avatar_url ?? null,
});

const mapProfileRow = (row: ProfileRow): AppProfile => ({
  id: row.id,
  email: row.email ?? undefined,
  displayName: row.display_name ?? undefined,
  avatarUrl: row.avatar_url ?? undefined,
  createdAt: row.created_at,
});

export const ensureProfileForUser = async (user: User): Promise<AppProfile> => {
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select(selectProfileFields)
    .eq("id", user.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("profiles")
    .upsert(buildProfileInsert(user, existingProfile), { onConflict: "id" })
    .select(selectProfileFields)
    .single();

  if (error) {
    throw error;
  }

  return mapProfileRow(data);
};
