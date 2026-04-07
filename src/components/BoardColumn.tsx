import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import type { Column } from "@/features/board/types";
import DraggableTaskCard from "./DraggableTaskCard";

interface BoardColumnProps {
  column: Column;
  index: number;
  isLast: boolean;
  isActive: boolean;
  recentlyMovedTaskId?: string | null;
  isBoardLoading?: boolean;
  hasActiveFilters?: boolean;
  onSelectTask: (taskId: string) => void;
}

const BoardColumn = ({
  column,
  index,
  isLast,
  isActive,
  recentlyMovedTaskId,
  isBoardLoading = false,
  hasActiveFilters = false,
  onSelectTask,
}: BoardColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[260px] flex-1 flex-col px-4 pb-5 pt-5 sm:px-5 sm:pt-5 lg:min-w-[280px] lg:px-7 lg:pt-6 xl:min-w-[300px] ${
        !isLast ? "border-r border-border/18" : ""
      } ${isOver ? "bg-background/25" : ""}`}
    >
      {/* Column header */}
      {isActive && (
        <motion.div
          className="mb-4 flex items-center gap-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
        >
          <h2 className="font-body text-[11px] tracking-[0.28em] uppercase text-foreground/68">
            {column.title}
          </h2>
          <span className="text-[10px] font-body text-muted-foreground/46">
            {column.cards.length}
          </span>
        </motion.div>
      )}

      {/* Thin separator */}
      <div className={`mb-5 h-px transition-colors duration-200 ${isOver ? "bg-border/40" : "bg-border/28"}`} />

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-3">
        {isActive && isBoardLoading && column.cards.length === 0 && (
          <>
            <div className="h-[78px] animate-pulse border border-border/18 bg-background/38" />
            <div className="h-[92px] animate-pulse border border-border/14 bg-background/28" />
          </>
        )}

        {isActive &&
          !isBoardLoading &&
          column.cards.length === 0 && (
            <div className="mt-1 border border-dashed border-border/28 bg-background/24 px-4 py-4 text-center">
              <p className="font-body text-[13px] text-muted-foreground/68">
                {hasActiveFilters
                  ? "No matches"
                  : column.id === "todo"
                    ? "No tasks yet"
                    : "Drop tasks here"}
              </p>
              <p className="mt-1.5 font-body text-[10px] uppercase tracking-[0.16em] text-muted-foreground/44">
                {hasActiveFilters
                  ? "Clear filters"
                  : column.id === "todo"
                    ? "Add one to begin"
                    : "Ready"}
              </p>
            </div>
          )}

        {isActive &&
          !isBoardLoading &&
          column.cards.map((card, cardIndex) => (
            <DraggableTaskCard
              key={card.id}
              card={card}
              columnId={column.id}
              index={card.sortOrder ?? cardIndex}
              delay={0.5 + index * 0.1 + cardIndex * 0.06}
              animateIn={card.id !== recentlyMovedTaskId}
              onSelectTask={onSelectTask}
            />
          ))}
      </div>
    </div>
  );
};

export default BoardColumn;
