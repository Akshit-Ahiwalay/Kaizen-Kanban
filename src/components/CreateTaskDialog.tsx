import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { CreateTaskInput, KanbanPriority } from "@/features/board/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
const fieldLabelClassName =
  "block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66";
const modalSelectClassName =
  "h-11 w-full appearance-none rounded-[0.6rem] border border-border/34 bg-[hsl(var(--background)/0.66)] px-3.5 pr-10 font-body text-[14px] text-foreground/82 shadow-[inset_0_1px_0_hsl(var(--background)/0.58)] transition-[border-color,background-color,box-shadow,color] duration-200 hover:border-border/46 focus:border-foreground/16 focus:bg-[hsl(var(--background)/0.82)] focus:outline-none focus:shadow-[inset_0_1px_0_hsl(var(--background)/0.8),0_0_0_1px_hsl(var(--olive)/0.16)]";

const CreateTaskDialog = ({
  open,
  onOpenChange,
  onCreateTask,
  submitLabel = "Add To Do",
}: CreateTaskDialogProps) => {
  const [draft, setDraft] = useState<TaskDraft>(initialDraft);
  const [titleError, setTitleError] = useState("");
  const dueDateInputRef = useRef<HTMLInputElement | null>(null);

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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-foreground/12 px-4 py-8 backdrop-blur-[3px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
        aria-label="Close new task dialog"
      />

      <div className="relative z-10 w-full max-w-lg border border-border/30 bg-[hsl(var(--background)/0.96)] p-7 shadow-[0_28px_90px_-48px_rgba(0,0,0,0.42)] backdrop-blur-[10px] sm:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[11px] tracking-[0.32em] text-muted-foreground/56">
              TASK ENTRY
            </p>
            <h2 className="mt-3 font-display text-[28px] text-foreground/84">New Task</h2>
            <p className="mt-3 max-w-sm font-body text-[13px] leading-relaxed text-muted-foreground/58">
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

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2.5">
            <label htmlFor="task-title" className={fieldLabelClassName}>
              Title
            </label>
            <Input
              id="task-title"
              autoFocus
              value={draft.title}
              onChange={(event) => {
                setDraft((current) => ({ ...current, title: event.target.value }));
                if (titleError) {
                  setTitleError("");
                }
              }}
              placeholder="Write a task title"
            />
            {titleError && (
              <p className="mt-2.5 font-body text-[12px] text-seal/80">{titleError}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <label htmlFor="task-description" className={fieldLabelClassName}>
              Description
            </label>
            <Textarea
              id="task-description"
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
              <label htmlFor="task-priority" className={fieldLabelClassName}>
                Priority
              </label>
              <div className="relative">
                <select
                  id="task-priority"
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
              <label htmlFor="task-due-date" className={fieldLabelClassName}>
                Due Date
              </label>
              <div className="relative">
                <Input
                  id="task-due-date"
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
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border/18 pt-5">
            <button
              type="button"
              className="px-3 py-2 text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground/64 transition-colors duration-300 hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border border-border/32 bg-[hsl(var(--background)/0.42)] px-4.5 py-2.5 text-[11px] font-body uppercase tracking-[0.18em] text-foreground/74 transition-all duration-300 hover:border-border/56 hover:text-foreground"
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
