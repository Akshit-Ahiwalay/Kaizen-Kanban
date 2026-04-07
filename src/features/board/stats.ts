import { getDueDateState } from "./due-dates";
import type { Column } from "./types";

export interface BoardStats {
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
}

export const getBoardStats = (columns: Column[]): BoardStats => {
  const cards = columns.flatMap((column) => column.cards);

  return {
    totalTasks: cards.length,
    doneTasks: cards.filter((card) => card.done).length,
    overdueTasks: cards.filter((card) => getDueDateState(card.dueDateValue) === "overdue").length,
    inProgressTasks:
      columns.find((column) => column.id === "in-progress")?.cards.length ?? 0,
  };
};
