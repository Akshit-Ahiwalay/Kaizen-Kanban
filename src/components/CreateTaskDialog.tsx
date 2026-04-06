import { useEffect, useState } from "react";
import type { CreateTaskInput, KanbanPriority } from "@/features/board/types";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: CreateTaskInput) => void;
  submitLabel?: string;
}

interface TaskDraft {
  title: string;
  description: string;
  priority: "" | KanbanPriority;
  dueDate: string;
}

const initialDraft: TaskDraft = {
  title: "",
  description: "",
  priority: "",
  dueDate: "",
};

const CreateTaskDialog = ({
  open,
  onOpenChange,
  onCreateTask,
  submitLabel = "Add To Do",
}: CreateTaskDialogProps) => {
  const [draft, setDraft] = useState<TaskDraft>(initialDraft);
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (!open) {
      setDraft(initialDraft);
      setTitleError("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = draft.title.trim();

    if (!title) {
      setTitleError("Title is required.");
      return;
    }

    onCreateTask({
      title,
      description: draft.description.trim() || undefined,
      priority: draft.priority || undefined,
      dueDate: draft.dueDate || undefined,
    });
    onOpenChange(false);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-foreground/10 px-4 py-8 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
        aria-label="Close new task dialog"
      />

      <div className="relative z-10 w-full max-w-md border border-border/35 bg-background/95 p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.35em] text-muted-foreground/50">
              TASK ENTRY
            </p>
            <h2 className="mt-2 font-display text-2xl text-foreground/80">New Task</h2>
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
              htmlFor="task-title"
              className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
            >
              Title
            </label>
            <input
              id="task-title"
              value={draft.title}
              onChange={(event) => {
                setDraft((current) => ({ ...current, title: event.target.value }));
                if (titleError) {
                  setTitleError("");
                }
              }}
              className="w-full border border-border/30 bg-background/70 px-3 py-2.5 font-body text-sm text-foreground/80 outline-none transition-colors duration-300 placeholder:text-muted-foreground/35 focus:border-border/60"
              placeholder="Write a task title"
            />
            {titleError && (
              <p className="mt-2 font-body text-xs text-seal/80">{titleError}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
            >
              Description
            </label>
            <textarea
              id="task-description"
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
                htmlFor="task-priority"
                className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
              >
                Priority
              </label>
              <select
                id="task-priority"
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
                htmlFor="task-due-date"
                className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={draft.dueDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, dueDate: event.target.value }))
                }
                className="w-full border border-border/30 bg-background/70 px-3 py-2.5 font-body text-sm text-foreground/80 outline-none transition-colors duration-300 focus:border-border/60"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              className="px-3 py-2 text-[10px] font-body uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border border-border/30 px-4 py-2 text-[10px] font-body uppercase tracking-[0.2em] text-foreground/70 transition-all duration-300 hover:border-border/55 hover:text-foreground"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskDialog;
