import { useEffect, useState } from "react";
import type {
  BoardColumnId,
  KanbanCard,
  KanbanPriority,
  TeamMember,
  UpdateTaskInput,
} from "@/features/board/types";

interface TaskDetailDialogProps {
  open: boolean;
  task: KanbanCard | null;
  status: BoardColumnId | null;
  teamMembers: TeamMember[];
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
  assigneeId: string;
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
  assigneeId: "",
};

const TaskDetailDialog = ({
  open,
  task,
  status,
  teamMembers,
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
      assigneeId: task.assigneeId ?? "",
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

    const assignee = teamMembers.find((member) => member.id === draft.assigneeId);
    const didSave = await onSaveTask({
      taskId: task.id,
      title,
      description: draft.description.trim() || undefined,
      priority: draft.priority || undefined,
      dueDate: draft.dueDate || undefined,
      status: draft.status,
      assigneeId: assignee?.id,
      assignee,
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

      <div className="relative z-10 w-full max-w-2xl border border-border/36 bg-background/95 p-7 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[11px] tracking-[0.32em] text-muted-foreground/56">
              TASK DETAIL
            </p>
            <h2 className="mt-2.5 font-display text-[28px] text-foreground/84">Edit Task</h2>
          </div>
          <button
            type="button"
            className="text-[11px] font-body tracking-[0.18em] uppercase text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="edit-task-title"
              className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
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
              className="w-full border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[15px] text-foreground/84 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40 focus:border-border/62"
              placeholder="Task title"
            />
            {titleError && <p className="mt-2.5 font-body text-[12px] text-seal/80">{titleError}</p>}
          </div>

          <div>
            <label
              htmlFor="edit-task-description"
              className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
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
              className="w-full resize-none border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[14px] text-foreground/82 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40 focus:border-border/62"
              placeholder="Optional context"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-task-priority"
                className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
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
                className="w-full border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[14px] text-foreground/82 outline-none transition-colors duration-300 focus:border-border/62"
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
                className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
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
                className="w-full border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[14px] text-foreground/82 outline-none transition-colors duration-300 focus:border-border/62"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-task-due-date"
                className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
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
                className="w-full border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[14px] text-foreground/82 outline-none transition-colors duration-300 focus:border-border/62"
              />
            </div>

            <div>
              <label
                htmlFor="edit-task-assignee"
                className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
              >
                Assignee
              </label>
              <select
                id="edit-task-assignee"
                value={draft.assigneeId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    assigneeId: event.target.value,
                  }))
                }
                className="w-full border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[14px] text-foreground/82 outline-none transition-colors duration-300 focus:border-border/62"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-border/20 pt-5">
            {isConfirmingDelete ? (
              <div className="flex items-center justify-between gap-3">
                <div className="font-body text-[11px] uppercase tracking-[0.14em] text-seal/62">
                  Delete this task?
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-2.5 py-1 text-[11px] font-body uppercase tracking-[0.16em] text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
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
                    className="border border-seal/24 px-3.5 py-2 text-[11px] font-body uppercase tracking-[0.16em] text-seal/74 transition-all duration-300 hover:border-seal/42 hover:text-seal/86 disabled:cursor-not-allowed disabled:border-seal/12 disabled:text-seal/38"
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
                className="text-[11px] font-body uppercase tracking-[0.18em] text-seal/58 transition-colors duration-300 hover:text-seal/76"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isSaving}
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="font-body text-[11px] uppercase tracking-[0.14em] text-muted-foreground/48">
              {deleteError ? deleteError : saveError ? saveError : isDeleting ? "Deleting" : isSaving ? "Saving" : ""}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-3 py-2 text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground/64 transition-colors duration-300 hover:text-foreground"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="border border-border/32 px-4.5 py-2.5 text-[11px] font-body uppercase tracking-[0.18em] text-foreground/74 transition-all duration-300 hover:border-border/56 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/18 disabled:text-muted-foreground/38"
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
