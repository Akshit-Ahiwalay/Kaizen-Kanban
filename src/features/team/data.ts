import type { TeamMember } from "@/features/board/types";

export const demoTeamMembers: TeamMember[] = [
  { id: "tm-1", name: "Aki", color: "#58644b" },
  { id: "tm-2", name: "Ren", color: "#7f5347" },
];

export const createInitialTeamMembers = (): TeamMember[] =>
  demoTeamMembers.map((member) => ({ ...member }));
