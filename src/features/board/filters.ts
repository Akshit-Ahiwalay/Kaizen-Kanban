import type { BoardColumnId, Column, KanbanPriority } from "./types";

export type BoardPriorityFilter = KanbanPriority | "all";
export type BoardStatusFilter = BoardColumnId | "all";

export interface BoardFilters {
  search: string;
  priority: BoardPriorityFilter;
  status: BoardStatusFilter;
}

export const DEFAULT_BOARD_FILTERS: BoardFilters = {
  search: "",
  priority: "all",
  status: "all",
};

const normalizeSearch = (value: string) => value.trim().toLowerCase();

export const hasActiveBoardFilters = (filters: BoardFilters) =>
  normalizeSearch(filters.search) !== "" ||
  filters.priority !== "all" ||
  filters.status !== "all";

export const filterBoardColumns = (
  columns: Column[],
  filters: BoardFilters,
): Column[] => {
  const normalizedSearch = normalizeSearch(filters.search);

  return columns.map((column) => {
    if (filters.status !== "all" && column.id !== filters.status) {
      return { ...column, cards: [] };
    }

    return {
      ...column,
      cards: column.cards.filter((card) => {
        const matchesSearch =
          normalizedSearch === "" ||
          card.title.toLowerCase().includes(normalizedSearch);
        const matchesPriority =
          filters.priority === "all" || card.priority === filters.priority;

        return matchesSearch && matchesPriority;
      }),
    };
  });
};
