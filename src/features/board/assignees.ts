import type { Column, TeamMember } from "./types";

export const attachAssigneesToColumns = (
  columns: Column[],
  teamMembers: TeamMember[],
): Column[] => {
  const membersById = new Map(teamMembers.map((member) => [member.id, member]));

  return columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => ({
      ...card,
      assignee: card.assigneeId ? membersById.get(card.assigneeId) : undefined,
    })),
  }));
};
