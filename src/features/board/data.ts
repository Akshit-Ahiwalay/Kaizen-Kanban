import type { Column } from "./types";

export const demoColumns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    cards: [
      { id: "1", title: "Design landing page", priority: "high" },
      { id: "2", title: "Database setup", dueDate: "Sep 15", done: true },
      { id: "3", title: "Project scope setup", dueDate: "Sep 15" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [
      { id: "4", title: "Content summary", dueDate: "Sep 16" },
      { id: "5", title: "Training soon", priority: "low", done: true },
    ],
  },
  {
    id: "in-review",
    title: "In Review",
    cards: [
      { id: "6", title: "Write documentation", priority: "high", dueDate: "Sep 20" },
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
