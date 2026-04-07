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
          assignee_id: string | null;
          sort_order: number;
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
          assignee_id?: string | null;
          sort_order?: number;
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
          assignee_id?: string | null;
          sort_order?: number;
          user_id?: string;
          created_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
    };
  };
}
