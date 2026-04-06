import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Column, CreateTaskInput } from "@/features/board/types";
import BoardColumn from "./BoardColumn";
import CreateTaskDialog from "./CreateTaskDialog";
import SamuraiSilhouette from "./SamuraiSilhouette";

interface BoardSceneProps {
  columns: Column[];
  isActive: boolean;
  onCreateTask: (task: CreateTaskInput) => void;
}

const BoardScene = ({ columns, isActive, onCreateTask }: BoardSceneProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="h-full w-full bg-background relative flex flex-col overflow-hidden">
      {/* Red sun */}
      <div className="absolute top-[6%] left-1/2 -translate-x-1/2 z-0">
        <div
          className="w-10 h-10 rounded-full bg-seal/20"
          style={{
            boxShadow: "0 0 30px 8px hsl(var(--seal) / 0.08)",
          }}
        />
      </div>

      {/* Vertical red line from sun */}
      <div
        className="absolute top-[calc(6%+44px)] left-1/2 -translate-x-1/2 w-px bg-seal/15 z-0"
        style={{ height: "35vh" }}
      />

      {/* Samurai silhouette */}
      <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 z-0 pointer-events-none">
        <SamuraiSilhouette className="w-16 h-24 text-foreground/[0.04]" />
      </div>

      {/* Floating header controls */}
      {isActive && (
        <motion.div
          className="relative z-20 flex items-center justify-between px-8 lg:px-12 py-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="font-display text-sm tracking-[0.15em] text-foreground/50">
            改善
          </span>
          <div className="flex items-center gap-3">
            <button className="p-2 text-muted-foreground/40 hover:text-foreground transition-colors duration-300">
              <Search size={13} />
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-body tracking-[0.15em] uppercase text-foreground/50 hover:text-foreground border border-border/30 hover:border-border/50 transition-all duration-300"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus size={11} />
              <span>New Task</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Kanban columns */}
      <div className="relative z-10 flex-1 flex overflow-x-auto">
        {columns.map((column, i) => (
          <BoardColumn
            key={column.id}
            column={column}
            index={i}
            isLast={i === columns.length - 1}
            isActive={isActive}
          />
        ))}
      </div>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={onCreateTask}
      />
    </div>
  );
};

export default BoardScene;
