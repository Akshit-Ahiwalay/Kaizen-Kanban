import {
  closestCorners,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { History, Plus, Search, SlidersHorizontal, Users } from "lucide-react";
import {
  ALL_ASSIGNEES_FILTER,
  DEFAULT_BOARD_FILTERS,
  UNASSIGNED_ASSIGNEE_FILTER,
  filterBoardColumns,
  hasActiveBoardFilters,
} from "@/features/board/filters";
import { getBoardStats } from "@/features/board/stats";
import type {
  Column,
  CreateTaskInput,
  CreateTeamMemberInput,
  MoveTaskInput,
  TeamMember,
  UpdateTaskInput,
} from "@/features/board/types";
import type {
  AccountWorkspaceGroup,
  AccountWorkspaceInvitation,
  AccountWorkspaceMember,
} from "./AccountMenu";
import BoardColumn from "./BoardColumn";
import AccountMenu from "./AccountMenu";
import CreateTaskDialog from "./CreateTaskDialog";
import TaskCard from "./TaskCard";
import TaskDetailDialog from "./TaskDetailDialog";
import TeamMembersDialog from "./TeamMembersDialog";
import ActivityHistorySheet from "./ActivityHistorySheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BoardSceneProps {
  columns: Column[];
  teamMembers: TeamMember[];
  isActive: boolean;
  onCreateTask: (task: CreateTaskInput) => void;
  onCreateTeamMember: (member: CreateTeamMemberInput) => Promise<boolean>;
  onMoveTask: (taskMove: MoveTaskInput) => void;
  onUpdateTask: (task: UpdateTaskInput) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  statusText?: string | null;
  statusTone?: "loading" | "guest" | "error" | null;
  accountLabel?: string | null;
  accountDetail?: string | null;
  accountAvatarUrl?: string | null;
  isGuestSession?: boolean;
  guestUpgradeFeedback?: string | null;
  guestUpgradeFeedbackTone?: "success" | "error" | "info" | null;
  isUpgradeBusy?: boolean;
  onUpgradeGuestWithGoogle?: () => Promise<void> | void;
  onUpgradeGuestWithEmail?: (email: string) => Promise<boolean>;
  activeWorkspaceId?: string | null;
  activeWorkspaceLabel?: string | null;
  activeWorkspaceDetail?: string | null;
  isActiveSharedWorkspace?: boolean;
  workspaces?: AccountWorkspaceGroup[];
  workspaceMembers?: AccountWorkspaceMember[];
  workspaceFeedback?: string | null;
  workspaceFeedbackTone?: "success" | "error" | "info" | null;
  latestInviteLink?: string | null;
  pendingWorkspaceInvitations?: AccountWorkspaceInvitation[];
  canManageWorkspaceInvites?: boolean;
  canManageWorkspaceMembers?: boolean;
  canDeleteSharedWorkspace?: boolean;
  isWorkspaceActionLoading?: boolean;
  isWorkspaceMembersLoading?: boolean;
  onSelectWorkspace?: (workspaceId: string) => void;
  onCreateSharedWorkspace?: (name: string) => Promise<boolean>;
  onCreateWorkspaceInvitation?: (email: string) => Promise<string | null>;
  onRevokeWorkspaceInvitation?: (invitationId: string) => Promise<void> | void;
  onRemoveWorkspaceMember?: (memberUserId: string) => Promise<void> | void;
  onLeaveSharedWorkspace?: () => Promise<void> | void;
  onDeleteSharedWorkspace?: () => Promise<void> | void;
  onSignOut: () => Promise<void> | void;
  canCreateTask?: boolean;
  isBoardLoading?: boolean;
}

const BoardScene = ({
  columns,
  teamMembers,
  isActive,
  onCreateTask,
  onCreateTeamMember,
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
  statusText = null,
  statusTone = null,
  accountLabel = null,
  accountDetail = null,
  accountAvatarUrl = null,
  isGuestSession = false,
  guestUpgradeFeedback = null,
  guestUpgradeFeedbackTone = null,
  isUpgradeBusy = false,
  onUpgradeGuestWithGoogle,
  onUpgradeGuestWithEmail,
  activeWorkspaceId = null,
  activeWorkspaceLabel = null,
  activeWorkspaceDetail = null,
  isActiveSharedWorkspace = false,
  workspaces = [],
  workspaceMembers = [],
  workspaceFeedback = null,
  workspaceFeedbackTone = null,
  latestInviteLink = null,
  pendingWorkspaceInvitations = [],
  canManageWorkspaceInvites = false,
  canManageWorkspaceMembers = false,
  canDeleteSharedWorkspace = false,
  isWorkspaceActionLoading = false,
  isWorkspaceMembersLoading = false,
  onSelectWorkspace,
  onCreateSharedWorkspace,
  onCreateWorkspaceInvitation,
  onRevokeWorkspaceInvitation,
  onRemoveWorkspaceMember,
  onLeaveSharedWorkspace,
  onDeleteSharedWorkspace,
  onSignOut,
  canCreateTask = true,
  isBoardLoading = false,
}: BoardSceneProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [recentlyMovedTaskId, setRecentlyMovedTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isActivityHistoryOpen, setIsActivityHistoryOpen] = useState(false);
  const [isFilterTrayOpen, setIsFilterTrayOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_BOARD_FILTERS);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const filteredColumns = useMemo(
    () => filterBoardColumns(columns, filters),
    [columns, filters],
  );
  const hasActiveFilters = useMemo(() => hasActiveBoardFilters(filters), [filters]);
  const isFilterTrayVisible = isFilterTrayOpen || hasActiveFilters;
  const hasVisibleResults = useMemo(
    () => filteredColumns.some((column) => column.cards.length > 0),
    [filteredColumns],
  );
  const boardStats = useMemo(() => getBoardStats(columns), [columns]);

  const activeTask =
    activeTaskId === null
      ? null
      : columns.flatMap((column) => column.cards).find((card) => card.id === activeTaskId) ?? null;

  const selectedTaskEntry = useMemo(() => {
    if (selectedTaskId === null) {
      return null;
    }

    for (const column of columns) {
      const task = column.cards.find((card) => card.id === selectedTaskId);

      if (task) {
        return {
          task,
          status: column.id,
        };
      }
    }

    return null;
  }, [columns, selectedTaskId]);

  useEffect(() => {
    if (!recentlyMovedTaskId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyMovedTaskId(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyMovedTaskId]);

  useEffect(() => {
    if (selectedTaskId && !selectedTaskEntry) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskEntry, selectedTaskId]);

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTaskId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTaskId(null);

    if (!over) {
      return;
    }

    const taskId = String(active.id);
    const overData = over.data.current;
    const overType = overData?.type;
    const targetColumnId =
      overType === "card"
        ? (overData.columnId as MoveTaskInput["targetColumnId"])
        : (String(over.id) as MoveTaskInput["targetColumnId"]);
    const targetIndex =
      overType === "card"
        ? Number(overData.index)
        : undefined;

    setRecentlyMovedTaskId(taskId);
    onMoveTask({ taskId, targetColumnId, targetIndex });
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleTaskDetailOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedTaskId(null);
    }
  };

  const statusToneClasses =
    statusTone === "error"
      ? "border-seal/24 bg-seal/6 text-seal/74"
      : statusTone === "loading"
        ? "border-border/28 bg-background/62 text-muted-foreground/66"
        : "border-olive/18 bg-olive/6 text-olive/66";
  const filterSelectClassName =
    "min-w-[168px] border-border/28 bg-[hsl(var(--background)/0.74)] text-[12px] uppercase tracking-[0.12em] text-foreground/74 shadow-[inset_0_1px_0_hsl(var(--background)/0.62)]";

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute left-1/2 top-[5.5%] z-0 -translate-x-1/2">
        <div
          className="h-14 w-14 rounded-full bg-seal/20 sm:h-16 sm:w-16"
          style={{
            boxShadow: "0 0 44px 12px hsl(var(--seal) / 0.08)",
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-[calc(5.5%+62px)] z-0 w-px -translate-x-1/2 bg-seal/16"
        style={{ height: "40vh" }}
      />
      {isActive && (
        <motion.div
          className="relative z-20 px-6 py-6 sm:px-8 sm:py-7 lg:px-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="mx-auto w-full max-w-[1760px]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
          <span className="font-display text-[18px] tracking-[0.14em] text-foreground/68 sm:text-[20px]">
            改善
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-border/24 bg-background/48 px-2.5 py-1.5 text-[10px] font-body uppercase tracking-[0.14em] text-foreground/66 sm:px-3 sm:text-[11px]">
              {boardStats.totalTasks} total
            </span>
            <span className="border border-olive/18 bg-olive/7 px-2.5 py-1.5 text-[10px] font-body uppercase tracking-[0.14em] text-olive/70 sm:px-3 sm:text-[11px]">
              {boardStats.doneTasks} done
            </span>
            <span className="border border-seal/18 bg-seal/7 px-2.5 py-1.5 text-[10px] font-body uppercase tracking-[0.14em] text-seal/72 sm:px-3 sm:text-[11px]">
              {boardStats.overdueTasks} overdue
            </span>
            <span className="border border-border/24 bg-background/48 px-2.5 py-1.5 text-[10px] font-body uppercase tracking-[0.14em] text-muted-foreground/64 sm:px-3 sm:text-[11px]">
              {boardStats.inProgressTasks} in progress
            </span>
          </div>
          </div>
          <div className="flex w-full flex-col gap-2.5 xl:w-auto xl:items-end">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5 sm:gap-3 xl:justify-end">
            {statusText && (
              <span
                className={`inline-flex max-w-full items-center gap-1.5 border px-2.5 py-1.5 text-[10px] font-body uppercase tracking-[0.14em] sm:px-3 sm:text-[11px] ${statusToneClasses}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    statusTone === "loading"
                      ? "animate-pulse bg-muted-foreground/45"
                      : statusTone === "error"
                        ? "bg-seal/60"
                        : "bg-olive/45"
                  }`}
                />
                <span>{statusText}</span>
              </span>
            )}
            <button
              type="button"
              aria-label="Open activity history"
              className="inline-flex h-10 w-10 items-center justify-center border border-border/24 bg-background/42 text-muted-foreground/56 transition-colors duration-300 hover:border-border/40 hover:text-foreground/78 disabled:cursor-not-allowed disabled:border-border/14 disabled:text-muted-foreground/28"
              disabled={!activeWorkspaceId}
              onClick={() => setIsActivityHistoryOpen(true)}
            >
              <History size={15} />
            </button>
            {accountLabel && (
              <AccountMenu
                label={accountLabel}
                detail={accountDetail}
                avatarUrl={accountAvatarUrl}
                isGuest={isGuestSession}
                guestUpgradeFeedback={guestUpgradeFeedback}
                guestUpgradeFeedbackTone={guestUpgradeFeedbackTone}
                isUpgradeBusy={isUpgradeBusy}
                onUpgradeWithGoogle={onUpgradeGuestWithGoogle}
                onUpgradeWithEmail={onUpgradeGuestWithEmail}
                activeWorkspaceId={activeWorkspaceId}
                activeWorkspaceLabel={activeWorkspaceLabel}
                activeWorkspaceDetail={activeWorkspaceDetail}
                isActiveSharedWorkspace={isActiveSharedWorkspace}
                workspaces={workspaces}
                workspaceMembers={workspaceMembers}
                workspaceFeedback={workspaceFeedback}
                workspaceFeedbackTone={workspaceFeedbackTone}
                latestInviteLink={latestInviteLink}
                pendingInvitations={pendingWorkspaceInvitations}
                canManageWorkspaceInvites={canManageWorkspaceInvites}
                canManageWorkspaceMembers={canManageWorkspaceMembers}
                canDeleteSharedWorkspace={canDeleteSharedWorkspace}
                isWorkspaceActionLoading={isWorkspaceActionLoading}
                isWorkspaceMembersLoading={isWorkspaceMembersLoading}
                onSelectWorkspace={onSelectWorkspace}
                onCreateSharedWorkspace={onCreateSharedWorkspace}
                onCreateWorkspaceInvitation={onCreateWorkspaceInvitation}
                onRevokeWorkspaceInvitation={onRevokeWorkspaceInvitation}
                onRemoveWorkspaceMember={onRemoveWorkspaceMember}
                onLeaveSharedWorkspace={onLeaveSharedWorkspace}
                onDeleteSharedWorkspace={onDeleteSharedWorkspace}
                onSignOut={onSignOut}
              />
            )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 xl:justify-end">
            <button
              type="button"
              aria-label="Manage team members"
              className="inline-flex h-10 w-10 items-center justify-center border border-border/24 bg-background/44 text-muted-foreground/58 transition-colors duration-300 hover:border-border/40 hover:text-foreground/82 disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/26"
              onClick={() => setIsTeamDialogOpen(true)}
              disabled={!canCreateTask}
            >
              <Users size={15} />
            </button>
            <button
              type="button"
              aria-label="Toggle search and filters"
              className={`inline-flex h-10 w-10 items-center justify-center border bg-background/44 transition-colors duration-300 ${
                isFilterTrayVisible
                  ? "border-border/36 text-foreground/78"
                  : "border-border/24 text-muted-foreground/58 hover:border-border/40 hover:text-foreground/82"
              }`}
              onClick={() => setIsFilterTrayOpen((current) => !current)}
            >
              <Search size={15} />
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-border/38 px-3.5 py-2 text-[11px] font-body uppercase tracking-[0.14em] text-foreground/66 transition-all duration-300 hover:border-border/56 hover:text-foreground/84 disabled:cursor-not-allowed disabled:border-border/18 disabled:text-muted-foreground/32 sm:px-4 sm:text-[12px]"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!canCreateTask}
            >
              <Plus size={12} />
              <span>New Task</span>
            </button>
            </div>
          </div>
          </div>

          {isFilterTrayVisible && (
            <motion.div
              className="mt-5 border border-border/22 bg-[hsl(var(--background)/0.54)] px-4 py-4 shadow-[inset_0_1px_0_hsl(var(--background)/0.58)] backdrop-blur-[6px] sm:px-5"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative min-w-[260px] flex-1">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground/50"
                    />
                    <Input
                      aria-label="Search task titles"
                      value={filters.search}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, search: event.target.value }))
                      }
                      placeholder="Search titles"
                      className="border-border/28 bg-[hsl(var(--background)/0.74)] pl-10 text-[14px] shadow-[inset_0_1px_0_hsl(var(--background)/0.62)]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2.5 pr-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/52">
                      <SlidersHorizontal size={13} />
                      <span>Filters</span>
                    </div>

                    <Select
                      value={filters.priority}
                      onValueChange={(value) =>
                        setFilters((current) => ({
                          ...current,
                          priority: value as typeof current.priority,
                        }))
                      }
                    >
                      <SelectTrigger aria-label="Filter by priority" className={filterSelectClassName}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All priorities</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters((current) => ({
                          ...current,
                          status: value as typeof current.status,
                        }))
                      }
                    >
                      <SelectTrigger aria-label="Filter by status" className={filterSelectClassName}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="in-review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.assigneeId}
                      onValueChange={(value) =>
                        setFilters((current) => ({
                          ...current,
                          assigneeId: value,
                        }))
                      }
                    >
                      <SelectTrigger aria-label="Filter by assignee" className={filterSelectClassName}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_ASSIGNEES_FILTER}>All assignees</SelectItem>
                        <SelectItem value={UNASSIGNED_ASSIGNEE_FILTER}>Unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/14 pt-3">
                    <div className="font-body text-[11px] uppercase tracking-[0.14em] text-muted-foreground/50">
                      {hasActiveFilters && !hasVisibleResults ? "No matching tasks" : " "}
                    </div>

                    <button
                      type="button"
                      className="px-2 py-1.5 font-body text-[11px] uppercase tracking-[0.14em] text-muted-foreground/60 transition-colors duration-300 hover:text-foreground/78"
                      onClick={() => {
                        setFilters(DEFAULT_BOARD_FILTERS);
                        setIsFilterTrayOpen(false);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          </div>
        </motion.div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTaskId(null)}
      >
        <div className="relative z-10 flex-1 overflow-x-auto px-4 pb-6 sm:px-6 lg:px-10 xl:px-12">
          <div className="mx-auto flex h-full w-full min-w-max max-w-[1760px]">
            {filteredColumns.map((column, i) => (
              <BoardColumn
                key={column.id}
                column={column}
                index={i}
                isLast={i === columns.length - 1}
                isActive={isActive}
                recentlyMovedTaskId={recentlyMovedTaskId}
                isBoardLoading={isBoardLoading}
                hasActiveFilters={hasActiveFilters}
                onSelectTask={handleSelectTask}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCard card={activeTask} delay={0} animateIn={false} elevated /> : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={onCreateTask}
        submitLabel="Add To Do"
      />

      <TeamMembersDialog
        open={isTeamDialogOpen}
        members={teamMembers}
        onOpenChange={setIsTeamDialogOpen}
        onCreateMember={onCreateTeamMember}
      />

      <TaskDetailDialog
        open={selectedTaskEntry !== null}
        task={selectedTaskEntry?.task ?? null}
        status={selectedTaskEntry?.status ?? null}
        teamMembers={teamMembers}
        workspaceMembers={workspaceMembers}
        onOpenChange={handleTaskDetailOpenChange}
        onSaveTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
      />

      <ActivityHistorySheet
        open={isActivityHistoryOpen}
        workspaceId={activeWorkspaceId}
        workspaceLabel={activeWorkspaceLabel}
        currentUserLabel={accountLabel}
        workspaceMembers={workspaceMembers}
        teamMembers={teamMembers}
        onOpenChange={setIsActivityHistoryOpen}
      />
    </div>
  );
};

export default BoardScene;
