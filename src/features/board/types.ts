export type BoardColumnId = "todo" | "in-progress" | "in-review" | "done";
export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type KanbanPriority = "low" | "normal" | "high";

export interface TeamMember {
  id: string;
  name: string;
  color: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueDateValue?: string;
  priority?: KanbanPriority;
  done?: boolean;
  sortOrder?: number;
  assigneeId?: string;
  assignee?: TeamMember;
}

export interface Column {
  id: BoardColumnId;
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
  targetColumnId: BoardColumnId;
  targetIndex?: number;
}

export interface UpdateTaskInput {
  taskId: string;
  title: string;
  description?: string;
  priority?: KanbanPriority;
  dueDate?: string;
  status: BoardColumnId;
  assigneeId?: string;
  assignee?: TeamMember;
}

export interface CreateTeamMemberInput {
  name: string;
  color: string;
}
