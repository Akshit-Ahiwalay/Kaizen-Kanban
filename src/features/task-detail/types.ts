export type TaskActivityEventType =
  | "task_created"
  | "task_edited"
  | "task_moved"
  | "assignee_changed"
  | "comment_added";

export interface TaskComment {
  id: string;
  taskId: string;
  workspaceId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  workspaceId: string;
  actorUserId: string;
  eventType: TaskActivityEventType;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface WorkspaceTaskActivity extends TaskActivity {
  taskTitle?: string;
}
