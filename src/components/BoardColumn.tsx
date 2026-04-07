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
}

const BoardColumn = ({
  column,
  index,
  isLast,
  isActive,
  recentlyMovedTaskId,
  isBoardLoading = false,
  hasActiveFilters = false,
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
      className={`flex-1 min-w-[220px] flex flex-col px-4 pt-4 pb-4 sm:px-5 lg:px-7 ${
        !isLast ? "border-r border-border/18" : ""
      } ${isOver ? "bg-background/25" : ""}`}
    >
      {/* Column header */}
      {isActive && (
        <motion.div
          className="flex items-center gap-2.5 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
        >
          <h2 className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground/68">
            {column.title}
          </h2>
          <span className="text-[9px] font-body text-muted-foreground/34">
            {column.cards.length}
          </span>
        </motion.div>
      )}

      {/* Thin separator */}
      <div className={`mb-4 h-px transition-colors duration-200 ${isOver ? "bg-border/35" : "bg-border/24"}`} />

      {/* Cards */}
      <div className="flex flex-col gap-2.5 flex-1">
        {isActive && isBoardLoading && column.cards.length === 0 && (
          <>
            <div className="h-[72px] animate-pulse border border-border/15 bg-background/35" />
            <div className="h-[88px] animate-pulse border border-border/10 bg-background/25" />
          </>
        )}

        {isActive &&
          !isBoardLoading &&
          column.cards.length === 0 && (
            <div className="mt-1 border border-dashed border-border/24 bg-background/22 px-4 py-4 text-center">
              <p className="font-body text-xs text-muted-foreground/60">
                {hasActiveFilters
                  ? "No matches"
                  : column.id === "todo"
                    ? "No tasks yet"
                    : "Drop tasks here"}
              </p>
              <p className="mt-1 font-body text-[10px] uppercase tracking-[0.16em] text-muted-foreground/36">
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
              delay={0.5 + index * 0.1 + cardIndex * 0.06}
              animateIn={card.id !== recentlyMovedTaskId}
            />
          ))}
      </div>
    </div>
  );
};

export default BoardColumn;
