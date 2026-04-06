export type KanbanPriority = "low" | "normal" | "high";

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: KanbanPriority;
  done?: boolean;
}

export interface Column {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: KanbanPriority;
  dueDate?: string;
}

export interface MoveTaskInput {
  taskId: string;
  targetColumnId: string;
  targetIndex?: number;
}
