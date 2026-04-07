import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { KanbanCard } from "@/features/board/types";
import TaskCard from "./TaskCard";

interface DraggableTaskCardProps {
  card: KanbanCard;
  columnId: string;
  delay: number;
  animateIn?: boolean;
  onSelectTask: (taskId: string) => void;
}

const DraggableTaskCard = ({
  card,
  columnId,
  delay,
  animateIn = true,
  onSelectTask,
}: DraggableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({
    id: card.id,
    data: {
      type: "task",
      taskId: card.id,
      columnId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.2 : 1,
      }}
      className="touch-none"
      role="button"
      tabIndex={0}
      aria-label={`Open task ${card.title}`}
      onClick={() => {
        if (!isDragging) {
          onSelectTask(card.id);
        }
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !isDragging) {
          event.preventDefault();
          onSelectTask(card.id);
        }
      }}
      {...listeners}
      {...attributes}
    >
      <TaskCard card={card} delay={delay} animateIn={animateIn} />
    </div>
  );
};

export default DraggableTaskCard;
