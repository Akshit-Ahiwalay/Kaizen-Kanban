import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { TaskActivity, TaskComment, WorkspaceTaskActivity } from "./types";

type TaskCommentInsert = Database["public"]["Tables"]["task_comments"]["Insert"];
type TaskCommentRow = Database["public"]["Tables"]["task_comments"]["Row"];
type TaskActivityRow = Database["public"]["Tables"]["task_activity"]["Row"];
type TaskTitleRow = Pick<Database["public"]["Tables"]["tasks"]["Row"], "id" | "title">;

const selectTaskCommentFields =
  "id, task_id, workspace_id, author_user_id, body, created_at";
const selectTaskActivityFields =
  "id, task_id, workspace_id, actor_user_id, event_type, metadata, created_at";

const mapTaskCommentRow = (row: TaskCommentRow): TaskComment => ({
  id: row.id,
  taskId: row.task_id,
  workspaceId: row.workspace_id,
  authorUserId: row.author_user_id,
  body: row.body,
  createdAt: row.created_at,
});

const mapTaskActivityRow = (row: TaskActivityRow): TaskActivity => ({
  id: row.id,
  taskId: row.task_id,
  workspaceId: row.workspace_id,
  actorUserId: row.actor_user_id,
  eventType: row.event_type,
  metadata:
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {},
  createdAt: row.created_at,
});

const buildTaskCommentInsert = (taskId: string, body: string): TaskCommentInsert => ({
  task_id: taskId,
  body,
});

export const fetchTaskComments = async (taskId: string): Promise<TaskComment[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("task_comments")
    .select(selectTaskCommentFields)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapTaskCommentRow);
};

export const fetchTaskActivity = async (taskId: string): Promise<TaskActivity[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("task_activity")
    .select(selectTaskActivityFields)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapTaskActivityRow);
};

export const fetchWorkspaceActivity = async (workspaceId: string): Promise<WorkspaceTaskActivity[]> => {
  if (!supabase) {
    return [];
  }

  const { data: activityRows, error: activityError } = await supabase
    .from("task_activity")
    .select(selectTaskActivityFields)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (activityError) {
    throw activityError;
  }

  const mappedActivity = (activityRows ?? []).map(mapTaskActivityRow);
  const taskIds = Array.from(new Set(mappedActivity.map((entry) => entry.taskId)));

  if (taskIds.length === 0) {
    return [];
  }

  const { data: taskRows, error: taskError } = await supabase
    .from("tasks")
    .select("id, title")
    .in("id", taskIds);

  if (taskError) {
    throw taskError;
  }

  const taskTitlesById = new Map(
    ((taskRows ?? []) as TaskTitleRow[]).map((task) => [task.id, task.title]),
  );

  return mappedActivity.map((entry) => ({
    ...entry,
    taskTitle: taskTitlesById.get(entry.taskId),
  }));
};

export const createTaskComment = async (taskId: string, body: string): Promise<TaskComment> => {
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error("Comment body is required");
  }

  const { data, error } = await supabase
    .from("task_comments")
    .insert(buildTaskCommentInsert(taskId, trimmedBody))
    .select(selectTaskCommentFields)
    .single();

  if (error) {
    throw error;
  }

  return mapTaskCommentRow(data);
};
