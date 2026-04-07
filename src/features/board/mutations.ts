import type {
  BoardColumnId,
  Column,
  CreateTaskInput,
  KanbanCard,
  MoveTaskInput,
  UpdateTaskInput,
} from "./types";
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
  sortOrder: 0,
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
      ? {
          ...column,
          cards: [
            { ...task, sortOrder: 0 },
            ...column.cards.map((card, index) => ({ ...card, sortOrder: index + 1 })),
          ],
        }
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

  if (targetColumnIndex === -1) {
    return columns;
  }

  const sourceColumn = columns[sourceColumnIndex];
  const targetColumn = columns[targetColumnIndex];
  const taskIndex = sourceColumn.cards.findIndex((card) => card.id === taskId);

  if (taskIndex === -1) {
    return columns;
  }

  const task = {
    ...sourceColumn.cards[taskIndex],
    done: targetColumn.id === "done",
  };

  if (sourceColumnIndex === targetColumnIndex) {
    if (targetIndex === undefined || targetIndex === taskIndex) {
      return columns;
    }

    const nextCards = [...sourceColumn.cards];
    nextCards.splice(taskIndex, 1);

    const insertionIndex = clampTargetIndex(targetIndex, nextCards.length);
    nextCards.splice(insertionIndex, 0, task);

    const hasSameOrder = nextCards.every((card, index) => card.id === sourceColumn.cards[index]?.id);

    if (hasSameOrder) {
      return columns;
    }

    return columns.map((column, index) =>
      index === sourceColumnIndex
        ? {
            ...column,
            cards: nextCards.map((card, cardIndex) => ({ ...card, sortOrder: cardIndex })),
          }
        : column,
    );
  }

  const nextSourceCards = sourceColumn.cards.filter((card) => card.id !== taskId);
  const insertionIndex = clampTargetIndex(targetIndex, targetColumn.cards.length);
  const nextTargetCards = [...targetColumn.cards];

  nextTargetCards.splice(insertionIndex, 0, task);

  return columns.map((column, index) => {
    if (index === sourceColumnIndex) {
      return {
        ...column,
        cards: nextSourceCards.map((card, cardIndex) => ({ ...card, sortOrder: cardIndex })),
      };
    }

    if (index === targetColumnIndex) {
      return {
        ...column,
        cards: nextTargetCards.map((card, cardIndex) => ({ ...card, sortOrder: cardIndex })),
      };
    }

    return column;
  });
};

export const updateTask = (
  columns: Column[],
  { taskId, title, description, priority, dueDate, status }: UpdateTaskInput,
): Column[] => {
  const sourceColumnIndex = columns.findIndex((column) =>
    column.cards.some((card) => card.id === taskId),
  );

  if (sourceColumnIndex === -1) {
    return columns;
  }

  const sourceColumn = columns[sourceColumnIndex];
  const sourceTaskIndex = sourceColumn.cards.findIndex((card) => card.id === taskId);

  if (sourceTaskIndex === -1) {
    return columns;
  }

  const targetColumnId = resolveTargetColumnId(columns, status);
  const targetColumnIndex = columns.findIndex((column) => column.id === targetColumnId);

  if (targetColumnIndex === -1) {
    return columns;
  }

  const currentTask = sourceColumn.cards[sourceTaskIndex];
  const nextTask: KanbanCard = {
    ...currentTask,
    title,
    description,
    priority,
    dueDateValue: dueDate,
    dueDate: formatDueDate(dueDate),
    done: targetColumnId === "done",
  };

  if (sourceColumnIndex === targetColumnIndex) {
    const nextCards = sourceColumn.cards.map((card, index) =>
      index === sourceTaskIndex ? nextTask : card,
    );

    return columns.map((column, index) =>
      index === sourceColumnIndex
        ? {
            ...column,
            cards: nextCards.map((card, cardIndex) => ({ ...card, sortOrder: cardIndex })),
          }
        : column,
    );
  }

  const nextSourceCards = sourceColumn.cards.filter((card) => card.id !== taskId);
  const targetColumn = columns[targetColumnIndex];
  const nextTargetCards = [nextTask, ...targetColumn.cards];

  return columns.map((column, index) => {
    if (index === sourceColumnIndex) {
      return {
        ...column,
        cards: nextSourceCards.map((card, cardIndex) => ({ ...card, sortOrder: cardIndex })),
      };
    }

    if (index === targetColumnIndex) {
      return {
        ...column,
        cards: nextTargetCards.map((card, cardIndex) => ({ ...card, sortOrder: cardIndex })),
      };
    }

    return column;
  });
};

export const deleteTask = (columns: Column[], taskId: string): Column[] => {
  const sourceColumnIndex = columns.findIndex((column) =>
    column.cards.some((card) => card.id === taskId),
  );

  if (sourceColumnIndex === -1) {
    return columns;
  }

  const sourceColumn = columns[sourceColumnIndex];
  const nextCards = sourceColumn.cards.filter((card) => card.id !== taskId);

  if (nextCards.length === sourceColumn.cards.length) {
    return columns;
  }

  return columns.map((column, index) =>
    index === sourceColumnIndex
      ? {
          ...column,
          cards: nextCards.map((card, cardIndex) => ({ ...card, sortOrder: cardIndex })),
        }
      : column,
  );
};
