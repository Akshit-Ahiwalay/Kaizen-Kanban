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
  assigneeId: row.assignee_id ?? undefined,
  sortOrder: row.sort_order,
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

const buildTaskInsert = (task: KanbanCard, userId: string, workspaceId: string): TaskInsert => ({
  id: task.id,
  title: task.title,
  description: task.description ?? null,
  status: "todo",
  priority: task.priority ?? null,
  due_date: task.dueDateValue ?? null,
  assignee_id: task.assigneeId ?? null,
  sort_order: task.sortOrder ?? 0,
  workspace_id: workspaceId,
  user_id: userId,
});

const buildTaskUpdate = (task: UpdateTaskInput): TaskUpdate => ({
  title: task.title,
  description: task.description ?? null,
  status: COLUMN_ID_TO_STATUS[task.status],
  priority: task.priority ?? null,
  due_date: task.dueDate ?? null,
  assignee_id: task.assigneeId ?? null,
});

const buildTaskOrderUpdates = (
  columns: Column[],
  columnIds: BoardColumnId[],
) => {
  const uniqueColumnIds = Array.from(new Set(columnIds));

  return uniqueColumnIds.flatMap((columnId) => {
    const column = columns.find((entry) => entry.id === columnId);

    if (!column) {
      return [];
    }

    return column.cards.map((card, index) => ({
      id: card.id,
      status: COLUMN_ID_TO_STATUS[column.id],
      sort_order: index,
    }));
  });
};

export const fetchBoardColumnsForWorkspace = async (workspaceId: string): Promise<Column[]> => {
  if (!supabase) {
    return createEmptyBoardColumns();
  }

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, due_date, assignee_id, sort_order, workspace_id, user_id, created_at",
    )
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return mapRowsToColumns(data ?? []);
};

export const createTaskForWorkspace = async (
  userId: string,
  workspaceId: string,
  task: KanbanCard,
) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .insert(buildTaskInsert(task, userId, workspaceId));

  if (error) {
    throw error;
  }
};

export const syncTaskOrderForWorkspace = async (
  workspaceId: string,
  columns: Column[],
  columnIds: BoardColumnId[],
) => {
  if (!supabase) {
    return;
  }

  const updates = buildTaskOrderUpdates(columns, columnIds);

  await Promise.all(
    updates.map(async (update) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: update.status,
          sort_order: update.sort_order,
        })
        .eq("id", update.id)
        .eq("workspace_id", workspaceId);

      if (error) {
        throw error;
      }
    }),
  );
};

export const updateTaskForWorkspace = async (workspaceId: string, task: UpdateTaskInput) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .update(buildTaskUpdate(task))
    .eq("id", task.taskId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }
};

export const deleteTaskForWorkspace = async (workspaceId: string, taskId: string) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }
};
