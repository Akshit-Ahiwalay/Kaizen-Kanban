import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { KanbanCard } from "@/features/board/types";
import TaskCard from "./TaskCard";

interface DraggableTaskCardProps {
  card: KanbanCard;
  columnId: string;
  index: number;
  delay: number;
  animateIn?: boolean;
  onSelectTask: (taskId: string) => void;
}

const DraggableTaskCard = ({
  card,
  columnId,
  index,
  delay,
  animateIn = true,
  onSelectTask,
}: DraggableTaskCardProps) => {
  const draggable = useDraggable({
    id: card.id,
    data: {
      type: "task",
      taskId: card.id,
      columnId,
    },
  });
  const droppable = useDroppable({
    id: `drop-${card.id}`,
    data: {
      type: "card",
      taskId: card.id,
      columnId,
      index,
    },
  });
  const { attributes, listeners, transform, transition, isDragging } = draggable;

  const setNodeRef = (node: HTMLDivElement | null) => {
    draggable.setNodeRef(node);
    droppable.setNodeRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.2 : 1,
      }}
      className={`touch-none ${droppable.isOver && !isDragging ? "ring-1 ring-border/20" : ""}`}
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
