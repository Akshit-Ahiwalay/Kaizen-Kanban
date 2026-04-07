import type { BoardColumnId, Column, CreateTaskInput, KanbanCard, MoveTaskInput } from "./types";
import { formatDueDate } from "./due-dates";

const TODO_COLUMN_ID: BoardColumnId = "todo";

const createFallbackUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });

const createTaskId = () =>
  globalThis.crypto?.randomUUID?.() ?? createFallbackUuid();

const resolveTargetColumnId = (columns: Column[], preferredColumnId: BoardColumnId) =>
  columns.find((column) => column.id === preferredColumnId)?.id ?? columns[0]?.id;

export const createTaskCard = (task: CreateTaskInput): KanbanCard => ({
  id: createTaskId(),
  title: task.title,
  description: task.description,
  priority: task.priority,
  dueDateValue: task.dueDate,
  dueDate: formatDueDate(task.dueDate),
});

export const insertTaskIntoColumn = (
  columns: Column[],
  task: KanbanCard,
  targetColumnId: BoardColumnId,
): Column[] => {
  if (columns.length === 0) {
    return columns;
  }

  const resolvedColumnId = resolveTargetColumnId(columns, targetColumnId);

  return columns.map((column) =>
    column.id === resolvedColumnId
      ? { ...column, cards: [task, ...column.cards] }
      : column,
  );
};

export const createTaskInTodoColumn = (
  columns: Column[],
  task: CreateTaskInput,
): Column[] => insertTaskIntoColumn(columns, createTaskCard(task), TODO_COLUMN_ID);

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
