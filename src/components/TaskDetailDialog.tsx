import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import type {
  BoardColumnId,
  KanbanCard,
  KanbanPriority,
  TeamMember,
  UpdateTaskInput,
} from "@/features/board/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
const fieldLabelClassName =
  "block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66";
const modalSelectClassName =
  "h-11 w-full appearance-none rounded-[0.6rem] border border-border/34 bg-[hsl(var(--background)/0.66)] px-3.5 pr-10 font-body text-[14px] text-foreground/82 shadow-[inset_0_1px_0_hsl(var(--background)/0.58)] transition-[border-color,background-color,box-shadow,color] duration-200 hover:border-border/46 focus:border-foreground/16 focus:bg-[hsl(var(--background)/0.82)] focus:outline-none focus:shadow-[inset_0_1px_0_hsl(var(--background)/0.8),0_0_0_1px_hsl(var(--olive)/0.16)]";

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
  const dueDateInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleOpenDueDatePicker = () => {
    const input = dueDateInputRef.current;

    if (!input) {
      return;
    }

    input.focus();

    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
      return;
    }

    input.click();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-foreground/12 px-3 py-4 backdrop-blur-[3px] sm:items-center sm:px-4 sm:py-8">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
        aria-label="Close task detail dialog"
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden border border-border/30 bg-[hsl(var(--background)/0.96)] p-5 shadow-[0_28px_90px_-48px_rgba(0,0,0,0.42)] backdrop-blur-[10px] max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
          <div>
            <p className="font-display text-[11px] tracking-[0.32em] text-muted-foreground/56">
              TASK DETAIL
            </p>
            <h2 className="mt-3 font-display text-[28px] text-foreground/84">Edit Task</h2>
          </div>
          <button
            type="button"
            className="text-[11px] font-body tracking-[0.18em] uppercase text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <div className="space-y-6 overflow-y-auto pr-1">
          <div className="space-y-2.5">
            <label htmlFor="edit-task-title" className={fieldLabelClassName}>
              Title
            </label>
            <Input
              id="edit-task-title"
              autoFocus
              value={draft.title}
              onChange={(event) => {
                setDraft((current) => ({ ...current, title: event.target.value }));
                if (titleError) {
                  setTitleError("");
                }
              }}
              placeholder="Task title"
            />
            {titleError && <p className="mt-2.5 font-body text-[12px] text-seal/80">{titleError}</p>}
          </div>

          <div className="space-y-2.5">
            <label htmlFor="edit-task-description" className={fieldLabelClassName}>
              Description
            </label>
            <Textarea
              id="edit-task-description"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              className="min-h-[120px] resize-none"
              placeholder="Optional context"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2.5">
              <label htmlFor="edit-task-priority" className={fieldLabelClassName}>
                Priority
              </label>
              <div className="relative">
                <select
                  id="edit-task-priority"
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priority: event.target.value as TaskDraft["priority"],
                    }))
                  }
                  className={modalSelectClassName}
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/52"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label htmlFor="edit-task-status" className={fieldLabelClassName}>
                Status
              </label>
              <div className="relative">
                <select
                  id="edit-task-status"
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as BoardColumnId,
                    }))
                  }
                  className={modalSelectClassName}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/52"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2.5">
              <label htmlFor="edit-task-due-date" className={fieldLabelClassName}>
                Due Date
              </label>
              <div className="relative">
                <Input
                  id="edit-task-due-date"
                  ref={dueDateInputRef}
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, dueDate: event.target.value }))
                  }
                  className="date-input pr-11"
                />
                <button
                  type="button"
                  aria-label="Open due date picker"
                  onClick={handleOpenDueDatePicker}
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-muted-foreground/52 transition-colors duration-200 hover:text-foreground/72"
                >
                  <CalendarDays size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <label htmlFor="edit-task-assignee" className={fieldLabelClassName}>
                Assignee
              </label>
              <div className="relative">
                <select
                  id="edit-task-assignee"
                  value={draft.assigneeId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      assigneeId: event.target.value,
                    }))
                  }
                  className={modalSelectClassName}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/52"
                />
              </div>
            </div>
          </div>

          </div>

          <div className="mt-6 border-t border-border/18 pt-5 sm:mt-5">
            {isConfirmingDelete ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-body text-[11px] uppercase tracking-[0.14em] text-seal/62">
                  Delete this task?
                </div>
                <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                  <button
                    type="button"
                    className="w-full px-2.5 py-1 text-[11px] font-body uppercase tracking-[0.16em] text-muted-foreground/60 transition-colors duration-300 hover:text-foreground sm:w-auto"
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
                    className="w-full border border-seal/24 px-3.5 py-2 text-[11px] font-body uppercase tracking-[0.16em] text-seal/74 transition-all duration-300 hover:border-seal/42 hover:text-seal/86 disabled:cursor-not-allowed disabled:border-seal/12 disabled:text-seal/38 sm:w-auto"
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

          <div className="mt-5 flex flex-col gap-3 border-t border-border/12 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-[1rem] font-body text-[11px] uppercase tracking-[0.14em] text-muted-foreground/48">
              {deleteError ? deleteError : saveError ? saveError : isDeleting ? "Deleting" : isSaving ? "Saving" : ""}
            </div>
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:gap-3">
              <button
                type="button"
                className="w-full px-3 py-2 text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground/64 transition-colors duration-300 hover:text-foreground sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="w-full border border-border/32 bg-[hsl(var(--background)/0.42)] px-4.5 py-2.5 text-[11px] font-body uppercase tracking-[0.18em] text-foreground/74 transition-all duration-300 hover:border-border/56 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/18 disabled:text-muted-foreground/38 sm:w-auto"
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
