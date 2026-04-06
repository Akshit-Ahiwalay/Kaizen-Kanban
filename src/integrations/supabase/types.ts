import type { KanbanPriority, TaskStatus } from "@/features/board/types";

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: KanbanPriority | null;
          due_date: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description?: string | null;
          status: TaskStatus;
          priority?: KanbanPriority | null;
          due_date?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: KanbanPriority | null;
          due_date?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
