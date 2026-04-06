import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import type { Column } from "@/features/board/types";
import DraggableTaskCard from "./DraggableTaskCard";

interface BoardColumnProps {
  column: Column;
  index: number;
  isLast: boolean;
  isActive: boolean;
}

const BoardColumn = ({ column, index, isLast, isActive }: BoardColumnProps) => {
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
      className={`flex-1 min-w-[220px] flex flex-col px-5 lg:px-7 pt-4 pb-4 ${
        !isLast ? "border-r border-border/15" : ""
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
          <h2 className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60">
            {column.title}
          </h2>
          <span className="text-[9px] font-body text-muted-foreground/25">
            {column.cards.length}
          </span>
        </motion.div>
      )}

      {/* Thin separator */}
      <div className={`h-px mb-4 transition-colors duration-200 ${isOver ? "bg-border/35" : "bg-border/20"}`} />

      {/* Cards */}
      <div className="flex flex-col gap-2.5 flex-1">
        {isActive &&
          column.cards.map((card, cardIndex) => (
            <DraggableTaskCard
              key={card.id}
              card={card}
              columnId={column.id}
              delay={0.5 + index * 0.1 + cardIndex * 0.06}
            />
          ))}
      </div>
    </div>
  );
};

export default BoardColumn;
