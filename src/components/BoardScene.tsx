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
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
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
  canCreateTask?: boolean;
}

const BoardScene = ({
  columns,
  isActive,
  onCreateTask,
  onMoveTask,
  statusText = null,
  canCreateTask = true,
}: BoardSceneProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [recentlyMovedTaskId, setRecentlyMovedTaskId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const activeTask =
    activeTaskId === null
      ? null
      : columns.flatMap((column) => column.cards).find((card) => card.id === activeTaskId) ?? null;

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
          className="relative z-20 flex items-center justify-between px-8 lg:px-12 py-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="font-display text-sm tracking-[0.15em] text-foreground/50">
            改善
          </span>
          <div className="flex items-center gap-3">
            {statusText && (
              <span className="text-[9px] font-body uppercase tracking-[0.18em] text-muted-foreground/40">
                {statusText}
              </span>
            )}
            <button className="p-2 text-muted-foreground/40 hover:text-foreground transition-colors duration-300">
              <Search size={13} />
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-body tracking-[0.15em] uppercase text-foreground/50 hover:text-foreground border border-border/30 hover:border-border/50 transition-all duration-300 disabled:cursor-not-allowed disabled:border-border/15 disabled:text-muted-foreground/30"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!canCreateTask}
            >
              <Plus size={11} />
              <span>New Task</span>
            </button>
          </div>
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
          {columns.map((column, i) => (
            <BoardColumn
              key={column.id}
              column={column}
              index={i}
              isLast={i === columns.length - 1}
              isActive={isActive}
              recentlyMovedTaskId={recentlyMovedTaskId}
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
