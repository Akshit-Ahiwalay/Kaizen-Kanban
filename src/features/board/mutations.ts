import type { Column, CreateTaskInput, KanbanCard } from "./types";

const TODO_COLUMN_ID = "todo";

const formatDueDate = (dueDate?: string) => {
  if (!dueDate) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${dueDate}T00:00:00`));
};

const createTaskId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const resolveTargetColumnId = (columns: Column[], preferredColumnId: string) =>
  columns.find((column) => column.id === preferredColumnId)?.id ?? columns[0]?.id;

const buildTask = (task: CreateTaskInput): KanbanCard => ({
  id: createTaskId(),
  title: task.title,
  description: task.description,
  priority: task.priority,
  dueDate: formatDueDate(task.dueDate),
});

export const createTaskInTodoColumn = (
  columns: Column[],
  task: CreateTaskInput,
): Column[] => {
  if (columns.length === 0) {
    return columns;
  }

  const targetColumnId = resolveTargetColumnId(columns, TODO_COLUMN_ID);

  return columns.map((column) =>
    column.id === targetColumnId
      ? { ...column, cards: [buildTask(task), ...column.cards] }
      : column,
  );
};
