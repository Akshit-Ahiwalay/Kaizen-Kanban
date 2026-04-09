import type { TeamMember } from "@/features/board/types";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TeamMemberInsert = Database["public"]["Tables"]["team_members"]["Insert"];

const buildTeamMemberInsert = (
  userId: string,
  workspaceId: string,
  member: TeamMember,
): TeamMemberInsert => ({
  id: member.id,
  workspace_id: workspaceId,
  user_id: userId,
  name: member.name,
  color: member.color,
});

export const fetchTeamMembersForWorkspace = async (workspaceId: string): Promise<TeamMember[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("team_members")
    .select("id, workspace_id, user_id, name, color, created_at")
    .eq("workspace_id", workspaceId)
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

export const createTeamMemberForWorkspace = async (
  userId: string,
  workspaceId: string,
  member: TeamMember,
) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("team_members")
    .insert(buildTeamMemberInsert(userId, workspaceId, member));

  if (error) {
    throw error;
  }
};
