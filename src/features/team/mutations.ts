import type { CreateTeamMemberInput, TeamMember } from "@/features/board/types";
import { DEFAULT_TEAM_MEMBER_COLOR } from "./types";

const createFallbackUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });

const createTeamMemberId = () =>
  globalThis.crypto?.randomUUID?.() ?? createFallbackUuid();

export const createTeamMember = (input: CreateTeamMemberInput): TeamMember => ({
  id: createTeamMemberId(),
  name: input.name.trim(),
  color: input.color || DEFAULT_TEAM_MEMBER_COLOR,
});
