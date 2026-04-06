import type { Column, CreateTaskInput, KanbanCard, MoveTaskInput } from "./types";

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

const clampTargetIndex = (index: number | undefined, maxIndex: number) => {
  if (index === undefined) {
    return 0;
  }

  return Math.min(Math.max(index, 0), maxIndex);
};

export const moveTask = (
  columns: Column[],
  { taskId, targetColumnId, targetIndex }: MoveTaskInput,
): Column[] => {
  const sourceColumnIndex = columns.findIndex((column) =>
    column.cards.some((card) => card.id === taskId),
  );

  if (sourceColumnIndex === -1) {
    return columns;
  }

  const targetColumnIndex = columns.findIndex((column) => column.id === targetColumnId);

  if (targetColumnIndex === -1 || sourceColumnIndex === targetColumnIndex) {
    return columns;
  }

  const sourceColumn = columns[sourceColumnIndex];
  const targetColumn = columns[targetColumnIndex];
  const taskIndex = sourceColumn.cards.findIndex((card) => card.id === taskId);

  if (taskIndex === -1) {
    return columns;
  }

  const task = sourceColumn.cards[taskIndex];
  const nextSourceCards = sourceColumn.cards.filter((card) => card.id !== taskId);
  const insertionIndex = clampTargetIndex(targetIndex, targetColumn.cards.length);
  const nextTargetCards = [...targetColumn.cards];

  nextTargetCards.splice(insertionIndex, 0, task);

  return columns.map((column, index) => {
    if (index === sourceColumnIndex) {
      return { ...column, cards: nextSourceCards };
    }

    if (index === targetColumnIndex) {
      return { ...column, cards: nextTargetCards };
    }

    return column;
  });
};
