import { motion } from "framer-motion";
import { getDueDateState } from "@/features/board/due-dates";
import type { KanbanCard } from "@/features/board/types";
import { getInitials, withAlpha } from "@/features/team/types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  card: KanbanCard;
  delay: number;
  animateIn?: boolean;
  elevated?: boolean;
  className?: string;
}

const priorityColors: Record<string, string> = {
  high: "border border-seal/18 bg-seal/7 px-2 py-0.5 text-seal/80",
  normal: "border border-olive/18 bg-olive/7 px-2 py-0.5 text-olive/78",
  low: "text-muted-foreground/64",
};

const dueDateClasses = {
  none: "text-muted-foreground/54",
  overdue: "border border-seal/20 bg-seal/7 px-2 py-0.5 text-seal/76",
  today: "border border-seal/14 bg-seal/[0.05] px-2 py-0.5 text-foreground/76",
  soon: "border border-olive/18 bg-olive/7 px-2 py-0.5 text-olive/76",
} as const;

const TaskCard = ({ card, delay, animateIn = true, elevated = false, className }: TaskCardProps) => {
  const dueDateState = getDueDateState(card.dueDateValue);

  return (
    <motion.div
      className={cn(
        "group relative cursor-pointer border border-border/26 bg-background/62 px-4 py-4 transition-all duration-300 hover:border-border/42",
        elevated && "border-border/36 bg-background/95 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.45)]",
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
      <h3 className="font-body text-[15px] leading-relaxed text-foreground/90">
        {card.title}
      </h3>

      {card.description && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground/68">
          {card.description}
        </p>
      )}

      {(card.dueDate || card.priority || card.done || card.assignee) && (
        <div className="mt-3.5 flex items-center gap-2.5">
          {card.priority && (
            <span
              className={`text-[10px] font-body uppercase tracking-[0.12em] ${priorityColors[card.priority]}`}
            >
              {card.priority}
            </span>
          )}
          {card.dueDate && (
            <span
              className={cn(
                "text-[10px] font-body tracking-[0.08em]",
                dueDateState === "none" ? dueDateClasses.none : dueDateClasses[dueDateState],
              )}
            >
              {card.dueDate}
            </span>
          )}
          {card.assignee && (
            <span
              aria-label={`Assignee ${card.assignee.name}`}
              className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-body uppercase tracking-[0.06em]"
              style={{
                color: card.assignee.color,
                borderColor: withAlpha(card.assignee.color, "3d"),
                backgroundColor: withAlpha(card.assignee.color, "12"),
              }}
              title={card.assignee.name}
            >
              {getInitials(card.assignee.name)}
            </span>
          )}
          {card.done && (
            <span className={`${card.assignee ? "" : "ml-auto"} h-1.5 w-1.5 rounded-full bg-olive/40`} />
          )}
        </div>
      )}
    </motion.div>
  );
};

export default TaskCard;
