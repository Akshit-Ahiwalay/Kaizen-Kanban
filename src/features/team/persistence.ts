import type { TeamMember } from "@/features/board/types";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TeamMemberInsert = Database["public"]["Tables"]["team_members"]["Insert"];

const buildTeamMemberInsert = (userId: string, member: TeamMember): TeamMemberInsert => ({
  id: member.id,
  user_id: userId,
  name: member.name,
  color: member.color,
});

export const fetchTeamMembersForUser = async (userId: string): Promise<TeamMember[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("team_members")
    .select("id, user_id, name, color, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((member) => ({
    id: member.id,
    name: member.name,
    color: member.color,
  }));
};

export const createTeamMemberForUser = async (userId: string, member: TeamMember) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("team_members")
    .insert(buildTeamMemberInsert(userId, member));

  if (error) {
    throw error;
  }
};
