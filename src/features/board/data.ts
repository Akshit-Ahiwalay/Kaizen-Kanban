import type { BoardColumnId, Column } from "./types";

export const BOARD_COLUMNS: ReadonlyArray<{ id: BoardColumnId; title: string }> = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "in-review", title: "In Review" },
  { id: "done", title: "Done" },
];

export const createEmptyBoardColumns = (): Column[] =>
  BOARD_COLUMNS.map((column) => ({
    ...column,
    cards: [],
  }));

export const demoColumns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    cards: [
      { id: "1", title: "Design landing page", priority: "high", assigneeId: "tm-1" },
      {
        id: "2",
        title: "Database setup",
        dueDateValue: "2026-04-04",
        dueDate: "Apr 4",
        done: true,
        assigneeId: "tm-2",
      },
      {
        id: "3",
        title: "Project scope setup",
        dueDateValue: "2026-04-06",
        dueDate: "Apr 6",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [
      {
        id: "4",
        title: "Content summary",
        dueDateValue: "2026-04-08",
        dueDate: "Apr 8",
        assigneeId: "tm-2",
      },
      { id: "5", title: "Training soon", priority: "low", done: true },
    ],
  },
  {
    id: "in-review",
    title: "In Review",
    cards: [
      {
        id: "6",
        title: "Write documentation",
        priority: "high",
        dueDateValue: "2026-04-14",
        dueDate: "Apr 14",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [
      { id: "7", title: "Define project scope", done: true },
      { id: "8", title: "Stakeholder alignment", done: true },
    ],
  },
];

export const createInitialBoardColumns = (): Column[] =>
  demoColumns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => ({ ...card })),
  }));
