import { useEffect, useState } from "react";
import type { BoardColumnId, KanbanPriority, KanbanCard, UpdateTaskInput } from "@/features/board/types";

interface TaskDetailDialogProps {
  open: boolean;
  task: KanbanCard | null;
  status: BoardColumnId | null;
  onOpenChange: (open: boolean) => void;
  onSaveTask: (task: UpdateTaskInput) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
}

interface TaskDraft {
  title: string;
  description: string;
  priority: "" | KanbanPriority;
  dueDate: string;
  status: BoardColumnId;
}

const STATUS_OPTIONS: Array<{ label: string; value: BoardColumnId }> = [
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "in-progress" },
  { label: "In Review", value: "in-review" },
  { label: "Done", value: "done" },
];

const DEFAULT_DRAFT: TaskDraft = {
  title: "",
  description: "",
  priority: "",
  dueDate: "",
  status: "todo",
};

const TaskDetailDialog = ({
  open,
  task,
  status,
  onOpenChange,
  onSaveTask,
  onDeleteTask,
}: TaskDetailDialogProps) => {
  const [draft, setDraft] = useState<TaskDraft>(DEFAULT_DRAFT);
  const [titleError, setTitleError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open || !task || !status) {
      return;
    }

    setDraft({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority ?? "",
      dueDate: task.dueDateValue ?? "",
      status,
    });
    setTitleError("");
    setSaveError("");
    setDeleteError("");
    setIsSaving(false);
    setIsDeleting(false);
    setIsConfirmingDelete(false);
  }, [open, status, task]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  if (!open || !task || !status) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = draft.title.trim();

    if (!title) {
      setTitleError("Title is required.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setDeleteError("");

    const didSave = await onSaveTask({
      taskId: task.id,
      title,
      description: draft.description.trim() || undefined,
      priority: draft.priority || undefined,
      dueDate: draft.dueDate || undefined,
      status: draft.status,
    });

    setIsSaving(false);

    if (!didSave) {
      setSaveError("Save issue");
      return;
    }

    onOpenChange(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    setSaveError("");

    const didDelete = await onDeleteTask(task.id);

    setIsDeleting(false);

    if (!didDelete) {
      setDeleteError("Delete issue");
      return;
    }

    onOpenChange(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-foreground/10 px-4 py-8 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
        aria-label="Close task detail dialog"
      />

      <div className="relative z-10 w-full max-w-lg border border-border/35 bg-background/95 p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.35em] text-muted-foreground/50">
              TASK DETAIL
            </p>
            <h2 className="mt-2 font-display text-2xl text-foreground/80">Edit Task</h2>
          </div>
          <button
            type="button"
            className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground/55 transition-colors duration-300 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="edit-task-title"
              className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
            >
              Title
            </label>
            <input
              id="edit-task-title"
              autoFocus
              value={draft.title}
              onChange={(event) => {
                setDraft((current) => ({ ...current, title: event.target.value }));
                if (titleError) {
                  setTitleError("");
                }
              }}
              className="w-full border border-border/30 bg-background/70 px-3 py-2.5 font-body text-sm text-foreground/80 outline-none transition-colors duration-300 placeholder:text-muted-foreground/35 focus:border-border/60"
              placeholder="Task title"
            />
            {titleError && <p className="mt-2 font-body text-xs text-seal/80">{titleError}</p>}
          </div>

          <div>
            <label
              htmlFor="edit-task-description"
              className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
            >
              Description
            </label>
            <textarea
              id="edit-task-description"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              className="w-full resize-none border border-border/30 bg-background/70 px-3 py-2.5 font-body text-sm text-foreground/80 outline-none transition-colors duration-300 placeholder:text-muted-foreground/35 focus:border-border/60"
              placeholder="Optional context"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-task-priority"
                className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
              >
                Priority
              </label>
              <select
                id="edit-task-priority"
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as TaskDraft["priority"],
                  }))
                }
                className="w-full border border-border/30 bg-background/70 px-3 py-2.5 font-body text-sm text-foreground/80 outline-none transition-colors duration-300 focus:border-border/60"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-task-status"
                className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
              >
                Status
              </label>
              <select
                id="edit-task-status"
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as BoardColumnId,
                  }))
                }
                className="w-full border border-border/30 bg-background/70 px-3 py-2.5 font-body text-sm text-foreground/80 outline-none transition-colors duration-300 focus:border-border/60"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-task-due-date"
              className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
            >
              Due Date
            </label>
            <input
              id="edit-task-due-date"
              type="date"
              value={draft.dueDate}
              onChange={(event) =>
                setDraft((current) => ({ ...current, dueDate: event.target.value }))
              }
              className="w-full border border-border/30 bg-background/70 px-3 py-2.5 font-body text-sm text-foreground/80 outline-none transition-colors duration-300 focus:border-border/60"
            />
          </div>

          <div className="border-t border-border/18 pt-4">
            {isConfirmingDelete ? (
              <div className="flex items-center justify-between gap-3">
                <div className="font-body text-[10px] uppercase tracking-[0.16em] text-seal/58">
                  Delete this task?
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-2 py-1 text-[10px] font-body uppercase tracking-[0.18em] text-muted-foreground/56 transition-colors duration-300 hover:text-foreground"
                    onClick={() => {
                      setIsConfirmingDelete(false);
                      setDeleteError("");
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="border border-seal/22 px-3 py-1.5 text-[10px] font-body uppercase tracking-[0.18em] text-seal/72 transition-all duration-300 hover:border-seal/40 hover:text-seal/84 disabled:cursor-not-allowed disabled:border-seal/12 disabled:text-seal/38"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="text-[10px] font-body uppercase tracking-[0.2em] text-seal/56 transition-colors duration-300 hover:text-seal/74"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isSaving}
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="font-body text-[10px] uppercase tracking-[0.16em] text-muted-foreground/40">
              {deleteError ? deleteError : saveError ? saveError : isDeleting ? "Deleting" : isSaving ? "Saving" : ""}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-3 py-2 text-[10px] font-body uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="border border-border/30 px-4 py-2 text-[10px] font-body uppercase tracking-[0.2em] text-foreground/70 transition-all duration-300 hover:border-border/55 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/18 disabled:text-muted-foreground/38"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetailDialog;
