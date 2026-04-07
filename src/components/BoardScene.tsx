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
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_BOARD_FILTERS,
  filterBoardColumns,
  hasActiveBoardFilters,
} from "@/features/board/filters";
import type { Column, CreateTaskInput, KanbanCard, MoveTaskInput } from "@/features/board/types";
import BoardColumn from "./BoardColumn";
import CreateTaskDialog from "./CreateTaskDialog";
import SamuraiSilhouette from "./SamuraiSilhouette";
import TaskCard from "./TaskCard";

interface BoardSceneProps {
  columns: Column[];
  isActive: boolean;
  onCreateTask: (task: CreateTaskInput) => void;
  onMoveTask: (taskMove: MoveTaskInput) => void;
  statusText?: string | null;
  statusTone?: "loading" | "guest" | "error" | null;
  canCreateTask?: boolean;
  isBoardLoading?: boolean;
}

const BoardScene = ({
  columns,
  isActive,
  onCreateTask,
  onMoveTask,
  statusText = null,
  statusTone = null,
  canCreateTask = true,
  isBoardLoading = false,
}: BoardSceneProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [recentlyMovedTaskId, setRecentlyMovedTaskId] = useState<string | null>(null);
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

  const activeTask =
    activeTaskId === null
      ? null
      : filteredColumns.flatMap((column) => column.cards).find((card) => card.id === activeTaskId) ??
        null;

  useEffect(() => {
    if (!recentlyMovedTaskId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyMovedTaskId(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyMovedTaskId]);

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTaskId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTaskId(null);

    if (!over) {
      return;
    }

    const taskId = String(active.id);
    const targetColumnId = String(over.id) as MoveTaskInput["targetColumnId"];

    setRecentlyMovedTaskId(taskId);
    onMoveTask({ taskId, targetColumnId });
  };

  const statusToneClasses =
    statusTone === "error"
      ? "border-seal/24 bg-seal/6 text-seal/74"
      : statusTone === "loading"
        ? "border-border/28 bg-background/60 text-muted-foreground/62"
        : "border-olive/18 bg-olive/6 text-olive/66";

  return (
    <div className="h-full w-full bg-background relative flex flex-col overflow-hidden">
      {/* Red sun */}
      <div className="absolute top-[6%] left-1/2 -translate-x-1/2 z-0">
        <div
          className="w-10 h-10 rounded-full bg-seal/20"
          style={{
            boxShadow: "0 0 30px 8px hsl(var(--seal) / 0.08)",
          }}
        />
      </div>

      {/* Vertical red line from sun */}
      <div
        className="absolute top-[calc(6%+44px)] left-1/2 -translate-x-1/2 w-px bg-seal/15 z-0"
        style={{ height: "35vh" }}
      />

      {/* Samurai silhouette */}
      <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 z-0 pointer-events-none">
        <SamuraiSilhouette className="w-16 h-24 text-foreground/[0.04]" />
      </div>

      {/* Floating header controls */}
      {isActive && (
        <motion.div
          className="relative z-20 px-5 py-4 sm:px-8 sm:py-5 lg:px-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center justify-between gap-4">
          <span className="font-display text-sm tracking-[0.15em] text-foreground/58">
            改善
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            {statusText && (
              <span
                className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9px] font-body uppercase tracking-[0.18em] ${statusToneClasses}`}
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
              aria-label="Toggle search and filters"
              className={`p-2 transition-colors duration-300 ${
                isFilterTrayVisible
                  ? "text-foreground/78"
                  : "text-muted-foreground/48 hover:text-foreground/80"
              }`}
              onClick={() => setIsFilterTrayOpen((current) => !current)}
            >
              <Search size={13} />
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 border border-border/35 px-3 py-1 text-[10px] font-body uppercase tracking-[0.15em] text-foreground/56 transition-all duration-300 hover:border-border/55 hover:text-foreground/82 disabled:cursor-not-allowed disabled:border-border/18 disabled:text-muted-foreground/32"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!canCreateTask}
            >
              <Plus size={11} />
              <span>New Task</span>
            </button>
          </div>
          </div>

          {isFilterTrayVisible && (
            <motion.div
              className="mt-4 flex flex-wrap items-center gap-2 border border-border/22 bg-background/42 px-3 py-3 backdrop-blur-[2px]"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex min-w-[220px] flex-1 items-center gap-2 border border-border/22 bg-background/55 px-3 py-2">
                <Search size={12} className="text-muted-foreground/45" />
                <input
                  aria-label="Search task titles"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, search: event.target.value }))
                  }
                  placeholder="Search titles"
                  className="w-full bg-transparent font-body text-xs text-foreground/74 outline-none placeholder:text-muted-foreground/34"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 border border-border/22 bg-background/55 px-3 py-2">
                  <SlidersHorizontal size={12} className="text-muted-foreground/42" />
                  <select
                    aria-label="Filter by priority"
                    value={filters.priority}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        priority: event.target.value as typeof current.priority,
                      }))
                    }
                    className="bg-transparent font-body text-[11px] uppercase tracking-[0.15em] text-foreground/68 outline-none"
                  >
                    <option value="all">All priorities</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="border border-border/22 bg-background/55 px-3 py-2">
                  <select
                    aria-label="Filter by status"
                    value={filters.status}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        status: event.target.value as typeof current.status,
                      }))
                    }
                    className="bg-transparent font-body text-[11px] uppercase tracking-[0.15em] text-foreground/68 outline-none"
                  >
                    <option value="all">All statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="in-review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="px-2 py-1 font-body text-[10px] uppercase tracking-[0.18em] text-muted-foreground/52 transition-colors duration-300 hover:text-foreground/76"
                  onClick={() => {
                    setFilters(DEFAULT_BOARD_FILTERS);
                    setIsFilterTrayOpen(false);
                  }}
                >
                  Clear
                </button>
              )}

              {hasActiveFilters && !hasVisibleResults && (
                <span className="font-body text-[10px] uppercase tracking-[0.16em] text-muted-foreground/40">
                  No matching tasks
                </span>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTaskId(null)}
      >
        <div className="relative z-10 flex-1 flex overflow-x-auto">
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
            />
          ))}
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
    </div>
  );
};

export default BoardScene;
