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

      <div className="relative z-10 w-full max-w-lg border border-border/36 bg-background/95 p-7 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[11px] tracking-[0.32em] text-muted-foreground/56">
              TASK ENTRY
            </p>
            <h2 className="mt-2.5 font-display text-[28px] text-foreground/84">New Task</h2>
            <p className="mt-2.5 max-w-sm font-body text-[13px] leading-relaxed text-muted-foreground/58">
              New items appear in the To Do column and sync into your guest workspace.
            </p>
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
              htmlFor="task-title"
              className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
            >
              Title
            </label>
            <input
              id="task-title"
              autoFocus
              value={draft.title}
              onChange={(event) => {
                setDraft((current) => ({ ...current, title: event.target.value }));
                if (titleError) {
                  setTitleError("");
                }
              }}
              className="w-full border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[15px] text-foreground/84 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40 focus:border-border/62"
              placeholder="Write a task title"
            />
            {titleError && (
              <p className="mt-2.5 font-body text-[12px] text-seal/80">{titleError}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
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
              className="w-full resize-none border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[14px] text-foreground/82 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40 focus:border-border/62"
              placeholder="Optional context"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-priority"
                className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
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
                htmlFor="task-due-date"
                className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
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
                className="w-full border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[14px] text-foreground/82 outline-none transition-colors duration-300 focus:border-border/62"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-3 py-2 text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground/64 transition-colors duration-300 hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border border-border/32 px-4.5 py-2.5 text-[11px] font-body uppercase tracking-[0.18em] text-foreground/74 transition-all duration-300 hover:border-border/56 hover:text-foreground"
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
