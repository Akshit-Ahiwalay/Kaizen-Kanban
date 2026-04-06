import { useState, useCallback } from "react";
import LandingScreen from "@/components/LandingScreen";
import BoardScene from "@/components/BoardScene";
import type { Column, CreateTaskInput, KanbanCard } from "@/features/board/types";
import { createInitialBoardColumns } from "@/features/board/data";

type AppState = "landing" | "revealing" | "board";
const TODO_COLUMN_ID = "todo";

const formatDueDate = (dueDate?: string) => {
  if (!dueDate) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${dueDate}T00:00:00`));
};

const createTaskId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const addTaskToBoard = (columns: Column[], task: CreateTaskInput): Column[] => {
  if (columns.length === 0) {
    return columns;
  }

  const newTask: KanbanCard = {
    id: createTaskId(),
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: formatDueDate(task.dueDate),
  };

  const targetColumnId =
    columns.find((column) => column.id === TODO_COLUMN_ID)?.id ?? columns[0].id;

  return columns.map((column) =>
    column.id === targetColumnId
      ? { ...column, cards: [newTask, ...column.cards] }
      : column,
  );
};

const Index = () => {
  const [state, setState] = useState<AppState>("landing");
  const [boardColumns, setBoardColumns] = useState<Column[]>(createInitialBoardColumns);

  const handleEnter = useCallback(() => {
    setState("revealing");
  }, []);

  const handleRevealComplete = useCallback(() => {
    setState("board");
  }, []);

  const handleCreateTask = useCallback((task: CreateTaskInput) => {
    setBoardColumns((currentColumns) => addTaskToBoard(currentColumns, task));
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Board is always mounted underneath */}
      <div className="absolute inset-0 z-10">
        <BoardScene
          columns={boardColumns}
          isActive={state !== "landing"}
          onCreateTask={handleCreateTask}
        />
      </div>

      {/* Landing screen sits on top, gets clipped away during reveal */}
      {state !== "board" && (
        <div
          className="absolute inset-0 z-30"
          style={{
            clipPath:
              state === "revealing"
                ? "inset(0 0 0 100%)"
                : "inset(0 0 0 0)",
            transition:
              state === "revealing"
                ? "clip-path 1.2s cubic-bezier(0.77, 0, 0.175, 1)"
                : "none",
          }}
          onTransitionEnd={() => {
            if (state === "revealing") {
              handleRevealComplete();
            }
          }}
        >
          <LandingScreen onEnter={handleEnter} />
        </div>
      )}

      {/* Ink edge texture overlay during reveal */}
      {state === "revealing" && (
        <div
          className="absolute inset-0 z-40 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, transparent 0%, hsl(var(--ink) / 0.06) 48%, hsl(var(--ink) / 0.12) 50%, transparent 52%)",
            clipPath: "inset(0 0 0 0)",
            animation: "ink-edge-sweep 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards",
          }}
        />
      )}
    </div>
  );
};

export default Index;
