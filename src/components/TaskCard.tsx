import { motion } from "framer-motion";
import type { KanbanCard } from "@/features/board/types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  card: KanbanCard;
  delay: number;
  animateIn?: boolean;
  elevated?: boolean;
  className?: string;
}

const priorityColors: Record<string, string> = {
  high: "text-seal/70",
  normal: "text-olive/70",
  low: "text-muted-foreground/56",
};

const TaskCard = ({ card, delay, animateIn = true, elevated = false, className }: TaskCardProps) => {
  return (
    <motion.div
      className={cn(
        "group relative cursor-pointer border border-border/20 bg-background/60 px-4 py-3 transition-all duration-300 hover:border-border/40",
        elevated && "border-border/34 bg-background/95 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.45)]",
        className,
      )}
      initial={animateIn ? { opacity: 0, y: 6 } : false}
      animate={animateIn ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={elevated ? undefined : { y: -1 }}
    >
      <h3 className="font-body text-sm leading-relaxed text-foreground/86">
        {card.title}
      </h3>

      {card.description && (
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground/60">
          {card.description}
        </p>
      )}

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
            <span className="text-[9px] font-body tracking-wide text-muted-foreground/46">
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
