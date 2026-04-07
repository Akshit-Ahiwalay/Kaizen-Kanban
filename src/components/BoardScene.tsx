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
import { Plus, Search, SlidersHorizontal, Users } from "lucide-react";
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
import BoardColumn from "./BoardColumn";
import AccountMenu from "./AccountMenu";
import CreateTaskDialog from "./CreateTaskDialog";
import TaskCard from "./TaskCard";
import TaskDetailDialog from "./TaskDetailDialog";
import TeamMembersDialog from "./TeamMembersDialog";

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
  onSignOut,
  canCreateTask = true,
  isBoardLoading = false,
}: BoardSceneProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [recentlyMovedTaskId, setRecentlyMovedTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
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
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="border border-border/24 bg-background/48 px-3 py-1.5 text-[11px] font-body uppercase tracking-[0.14em] text-foreground/66">
              {boardStats.totalTasks} total
            </span>
            <span className="border border-olive/18 bg-olive/7 px-3 py-1.5 text-[11px] font-body uppercase tracking-[0.14em] text-olive/70">
              {boardStats.doneTasks} done
            </span>
            <span className="border border-seal/18 bg-seal/7 px-3 py-1.5 text-[11px] font-body uppercase tracking-[0.14em] text-seal/72">
              {boardStats.overdueTasks} overdue
            </span>
            <span className="border border-border/24 bg-background/48 px-3 py-1.5 text-[11px] font-body uppercase tracking-[0.14em] text-muted-foreground/64">
              {boardStats.inProgressTasks} in progress
            </span>
          </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {statusText && (
              <span
                className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-body uppercase tracking-[0.14em] ${statusToneClasses}`}
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
            {accountLabel && (
              <AccountMenu
                label={accountLabel}
                detail={accountDetail}
                avatarUrl={accountAvatarUrl}
                isGuest={isGuestSession}
                onSignOut={onSignOut}
              />
            )}
            <button
              type="button"
              aria-label="Manage team members"
              className="p-2.5 text-muted-foreground/58 transition-colors duration-300 hover:text-foreground/82 disabled:cursor-not-allowed disabled:text-muted-foreground/26"
              onClick={() => setIsTeamDialogOpen(true)}
              disabled={!canCreateTask}
            >
              <Users size={15} />
            </button>
            <button
              type="button"
              aria-label="Toggle search and filters"
              className={`p-2.5 transition-colors duration-300 ${
                isFilterTrayVisible
                  ? "text-foreground/78"
                  : "text-muted-foreground/58 hover:text-foreground/82"
              }`}
              onClick={() => setIsFilterTrayOpen((current) => !current)}
            >
              <Search size={15} />
            </button>
            <button
              type="button"
              className="flex items-center gap-2 border border-border/38 px-4 py-2 text-[12px] font-body uppercase tracking-[0.14em] text-foreground/66 transition-all duration-300 hover:border-border/56 hover:text-foreground/84 disabled:cursor-not-allowed disabled:border-border/18 disabled:text-muted-foreground/32"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!canCreateTask}
            >
              <Plus size={12} />
              <span>New Task</span>
            </button>
          </div>
          </div>

          {isFilterTrayVisible && (
            <motion.div
              className="mt-5 flex flex-wrap items-center gap-2.5 border border-border/24 bg-background/46 px-4 py-4 backdrop-blur-[2px]"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex min-w-[260px] flex-1 items-center gap-2.5 border border-border/24 bg-background/60 px-4 py-3">
                <Search size={14} className="text-muted-foreground/52" />
                <input
                  aria-label="Search task titles"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, search: event.target.value }))
                  }
                  placeholder="Search titles"
                  className="w-full bg-transparent font-body text-[14px] text-foreground/82 outline-none placeholder:text-muted-foreground/44"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2.5 border border-border/24 bg-background/60 px-4 py-3">
                  <SlidersHorizontal size={14} className="text-muted-foreground/52" />
                  <select
                    aria-label="Filter by priority"
                    value={filters.priority}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        priority: event.target.value as typeof current.priority,
                      }))
                    }
                    className="bg-transparent font-body text-[12px] uppercase tracking-[0.12em] text-foreground/76 outline-none"
                  >
                    <option value="all">All priorities</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="border border-border/24 bg-background/60 px-4 py-3">
                  <select
                    aria-label="Filter by status"
                    value={filters.status}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        status: event.target.value as typeof current.status,
                      }))
                    }
                    className="bg-transparent font-body text-[12px] uppercase tracking-[0.12em] text-foreground/76 outline-none"
                  >
                    <option value="all">All statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="in-review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="border border-border/24 bg-background/60 px-4 py-3">
                  <select
                    aria-label="Filter by assignee"
                    value={filters.assigneeId}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        assigneeId: event.target.value,
                      }))
                    }
                    className="bg-transparent font-body text-[12px] uppercase tracking-[0.12em] text-foreground/76 outline-none"
                  >
                    <option value={ALL_ASSIGNEES_FILTER}>All assignees</option>
                    <option value={UNASSIGNED_ASSIGNEE_FILTER}>Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
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
              )}

              {hasActiveFilters && !hasVisibleResults && (
                <span className="font-body text-[11px] uppercase tracking-[0.14em] text-muted-foreground/50">
                  No matching tasks
                </span>
              )}
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
        onOpenChange={handleTaskDetailOpenChange}
        onSaveTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
      />
    </div>
  );
};

export default BoardScene;
