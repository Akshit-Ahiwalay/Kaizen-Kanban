import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { fetchWorkspaceActivity } from "@/features/task-detail/persistence";
import type { WorkspaceTaskActivity } from "@/features/task-detail/types";
import { supabase } from "@/integrations/supabase/client";
import type { TeamMember } from "@/features/board/types";
import type { AccountWorkspaceMember } from "./AccountMenu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ActivityHistorySheetProps {
  open: boolean;
  workspaceId: string | null;
  workspaceLabel?: string | null;
  currentUserLabel?: string | null;
  workspaceMembers?: AccountWorkspaceMember[];
  teamMembers?: TeamMember[];
  onOpenChange: (open: boolean) => void;
}

const STATUS_KEY_TO_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const EDITED_FIELD_LABELS: Record<string, string> = {
  title: "title",
  description: "description",
  priority: "priority",
  due_date: "due date",
};

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const resolveStatusLabel = (value: string | null | undefined) =>
  value ? STATUS_KEY_TO_LABEL[value] ?? value : "Unknown";

const resolveMemberLabel = (
  userId: string,
  currentUserId: string | null,
  memberLabels: Map<string, string>,
  currentUserLabel: string | null,
) => {
  if (currentUserId && userId === currentUserId) {
    return "You";
  }

  if (memberLabels.size === 0) {
    return currentUserLabel ?? "Workspace member";
  }

  return memberLabels.get(userId) ?? "Workspace member";
};

const resolveAssigneeLabel = (
  assigneeId: string | null | undefined,
  teamMembersById: Map<string, string>,
) => {
  if (!assigneeId) {
    return "Unassigned";
  }

  return teamMembersById.get(assigneeId) ?? "Assigned teammate";
};

const getActivityMessage = (activity: WorkspaceTaskActivity, teamMembersById: Map<string, string>) => {
  switch (activity.eventType) {
    case "task_created":
      return "Created the task";
    case "task_moved":
      return `Moved task from ${resolveStatusLabel(
        typeof activity.metadata.from_status === "string" ? activity.metadata.from_status : null,
      )} to ${resolveStatusLabel(
        typeof activity.metadata.to_status === "string" ? activity.metadata.to_status : null,
      )}`;
    case "assignee_changed":
      return `Changed assignee to ${resolveAssigneeLabel(
        typeof activity.metadata.to_assignee_id === "string" ? activity.metadata.to_assignee_id : null,
        teamMembersById,
      )}`;
    case "task_edited": {
      const changedFields = isStringArray(activity.metadata.changed_fields)
        ? activity.metadata.changed_fields.map((field) => EDITED_FIELD_LABELS[field] ?? field)
        : [];

      return changedFields.length > 0 ? `Updated ${changedFields.join(", ")}` : "Updated task details";
    }
    case "comment_added":
      return "Added a comment";
    default:
      return "Updated task";
  }
};

const ActivityHistorySheet = ({
  open,
  workspaceId,
  workspaceLabel = null,
  currentUserLabel = null,
  workspaceMembers = [],
  teamMembers = [],
  onOpenChange,
}: ActivityHistorySheetProps) => {
  const [activity, setActivity] = useState<WorkspaceTaskActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const memberLabels = useMemo(
    () => new Map(workspaceMembers.map((member) => [member.id, member.label])),
    [workspaceMembers],
  );
  const teamMembersById = useMemo(
    () => new Map(teamMembers.map((member) => [member.id, member.name])),
    [teamMembers],
  );

  useEffect(() => {
    if (!open || !workspaceId) {
      setActivity([]);
      setCurrentUserId(null);
      setLoadError("");
      return;
    }

    let isMounted = true;

    const loadHistory = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const [nextActivity, currentUserResponse] = await Promise.all([
          fetchWorkspaceActivity(workspaceId),
          supabase?.auth.getUser() ?? Promise.resolve({ data: { user: null }, error: null }),
        ]);

        if (!isMounted) {
          return;
        }

        setActivity(nextActivity);
        setCurrentUserId(currentUserResponse.data.user?.id ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setActivity([]);
        setLoadError("History unavailable");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [open, workspaceId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-border/24 bg-[hsl(var(--background)/0.97)] p-0 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.48)] sm:max-w-[460px] lg:max-w-[520px]"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader className="border-b border-border/16 px-5 pb-5 pt-6 sm:px-6">
            <div className="flex items-start gap-3 pr-10">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center border border-border/20 bg-background/56 text-muted-foreground/58">
                <History size={15} />
              </span>
              <div>
                <SheetTitle className="font-display text-[24px] font-normal text-foreground/84">
                  History
                </SheetTitle>
                <SheetDescription className="mt-1 font-body text-[12px] leading-relaxed text-muted-foreground/58">
                  {workspaceLabel
                    ? `Full activity for ${workspaceLabel}.`
                    : "Full workspace activity."}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {loadError && (
              <p className="mb-4 font-body text-[11px] uppercase tracking-[0.12em] text-seal/72">
                {loadError}
              </p>
            )}

            <div className="space-y-2.5">
              {isLoading ? (
                <>
                  <div className="h-[94px] animate-pulse border border-border/16 bg-background/32" />
                  <div className="h-[94px] animate-pulse border border-border/16 bg-background/28" />
                  <div className="h-[94px] animate-pulse border border-border/16 bg-background/24" />
                </>
              ) : activity.length === 0 ? (
                <div className="border border-dashed border-border/22 bg-background/24 px-4 py-5 text-center">
                  <p className="font-body text-[13px] text-muted-foreground/64">
                    No history yet
                  </p>
                  <p className="mt-1.5 font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/42">
                    Changes will appear here
                  </p>
                </div>
              ) : (
                activity.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-border/16 bg-[hsl(var(--background)/0.4)] px-4 py-3.5 shadow-[inset_0_1px_0_hsl(var(--background)/0.6)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/34" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-body text-[10px] uppercase tracking-[0.14em] text-foreground/60">
                            {resolveMemberLabel(
                              entry.actorUserId,
                              currentUserId,
                              memberLabels,
                              currentUserLabel,
                            )}
                          </p>
                          <p className="font-body text-[10px] uppercase tracking-[0.12em] text-muted-foreground/42">
                            {formatTimestamp(entry.createdAt)}
                          </p>
                        </div>
                        <p className="mt-1.5 break-words font-body text-[13px] leading-6 text-foreground/76">
                          {getActivityMessage(entry, teamMembersById)}
                        </p>
                        {entry.taskTitle && (
                          <p className="mt-2 break-words font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground/48">
                            Task: {entry.taskTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ActivityHistorySheet;
