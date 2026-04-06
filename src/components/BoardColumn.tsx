import { motion } from "framer-motion";
import type { Column } from "./BoardScene";
import TaskCard from "./TaskCard";

interface BoardColumnProps {
  column: Column;
  index: number;
  isLast: boolean;
  isActive: boolean;
}

const BoardColumn = ({ column, index, isLast, isActive }: BoardColumnProps) => {
  return (
    <div
      className={`flex-1 min-w-[220px] flex flex-col px-5 lg:px-7 pt-4 pb-4 ${
        !isLast ? "border-r border-border/15" : ""
      }`}
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
      <div className="h-px bg-border/20 mb-4" />

      {/* Cards */}
      <div className="flex flex-col gap-2.5 flex-1">
        {isActive &&
          column.cards.map((card, cardIndex) => (
            <TaskCard
              key={card.id}
              card={card}
              delay={0.5 + index * 0.1 + cardIndex * 0.06}
            />
          ))}
      </div>
    </div>
  );
};

export default BoardColumn;
