import { motion } from "framer-motion";
import type { KanbanCard } from "@/features/board/types";

interface TaskCardProps {
  card: KanbanCard;
  delay: number;
}

const priorityColors: Record<string, string> = {
  high: "text-seal/70",
  normal: "text-olive/70",
  low: "text-muted-foreground/50",
};

const TaskCard = ({ card, delay }: TaskCardProps) => {
  return (
    <motion.div
      className="group relative bg-background/60 border border-border/15 px-4 py-3 cursor-pointer transition-all duration-300 hover:border-border/35"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -1 }}
    >
      <h3 className="font-body text-sm text-foreground/80 leading-relaxed">
        {card.title}
      </h3>

      {(card.dueDate || card.priority || card.done) && (
        <div className="flex items-center gap-2 mt-2">
          {card.priority && (
            <span
              className={`text-[9px] font-body tracking-wider uppercase ${priorityColors[card.priority]}`}
            >
              {card.priority}
            </span>
          )}
          {card.dueDate && (
            <span className="text-[9px] font-body text-muted-foreground/40 tracking-wide">
              {card.dueDate}
            </span>
          )}
          {card.done && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-olive/40" />
          )}
        </div>
      )}
    </motion.div>
  );
};

export default TaskCard;
