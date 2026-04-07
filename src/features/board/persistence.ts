import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { createEmptyBoardColumns } from "./data";
import { formatDueDate } from "./due-dates";
import type { BoardColumnId, Column, KanbanCard, TaskStatus, UpdateTaskInput } from "./types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

const STATUS_TO_COLUMN_ID: Record<TaskStatus, BoardColumnId> = {
  todo: "todo",
  in_progress: "in-progress",
  in_review: "in-review",
  done: "done",
};

const COLUMN_ID_TO_STATUS: Record<BoardColumnId, TaskStatus> = {
  todo: "todo",
  "in-progress": "in_progress",
  "in-review": "in_review",
  done: "done",
};

const mapTaskRowToCard = (row: TaskRow): KanbanCard => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  priority: row.priority ?? undefined,
  dueDateValue: row.due_date ?? undefined,
  dueDate: formatDueDate(row.due_date ?? undefined),
  done: row.status === "done",
});

const mapRowsToColumns = (rows: TaskRow[]): Column[] => {
  const columns = createEmptyBoardColumns();
  const columnsById = new Map(columns.map((column) => [column.id, column]));

  rows.forEach((row) => {
    const column = columnsById.get(STATUS_TO_COLUMN_ID[row.status]);

    if (column) {
      column.cards.push(mapTaskRowToCard(row));
    }
  });

  return columns;
};

const buildTaskInsert = (task: KanbanCard, userId: string): TaskInsert => ({
  id: task.id,
  title: task.title,
  description: task.description ?? null,
  status: "todo",
  priority: task.priority ?? null,
  due_date: task.dueDateValue ?? null,
  user_id: userId,
});

const buildTaskUpdate = (task: UpdateTaskInput): TaskUpdate => ({
  title: task.title,
  description: task.description ?? null,
  status: COLUMN_ID_TO_STATUS[task.status],
  priority: task.priority ?? null,
  due_date: task.dueDate ?? null,
});

export const fetchBoardColumnsForUser = async (userId: string): Promise<Column[]> => {
  if (!supabase) {
    return createEmptyBoardColumns();
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, status, priority, due_date, user_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return mapRowsToColumns(data ?? []);
};

export const createTaskForUser = async (userId: string, task: KanbanCard) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("tasks").insert(buildTaskInsert(task, userId));

  if (error) {
    throw error;
  }
};

export const moveTaskForUser = async (
  userId: string,
  taskId: string,
  targetColumnId: BoardColumnId,
) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status: COLUMN_ID_TO_STATUS[targetColumnId] })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};

export const updateTaskForUser = async (userId: string, task: UpdateTaskInput) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .update(buildTaskUpdate(task))
    .eq("id", task.taskId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};

export const deleteTaskForUser = async (userId: string, taskId: string) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};
