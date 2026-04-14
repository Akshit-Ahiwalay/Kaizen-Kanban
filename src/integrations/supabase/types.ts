import type { KanbanPriority, TaskStatus } from "@/features/board/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          workspace_id: string | null;
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
          workspace_id?: string | null;
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
          workspace_id?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          workspace_id: string;
          author_user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          workspace_id?: string;
          author_user_id?: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          workspace_id?: string;
          author_user_id?: string;
          body?: string;
          created_at?: string;
        };
      };
      task_activity: {
        Row: {
          id: string;
          task_id: string;
          workspace_id: string;
          actor_user_id: string;
          event_type:
            | "task_created"
            | "task_edited"
            | "task_moved"
            | "assignee_changed"
            | "comment_added";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          workspace_id: string;
          actor_user_id: string;
          event_type:
            | "task_created"
            | "task_edited"
            | "task_moved"
            | "assignee_changed"
            | "comment_added";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          workspace_id?: string;
          actor_user_id?: string;
          event_type?:
            | "task_created"
            | "task_edited"
            | "task_moved"
            | "assignee_changed"
            | "comment_added";
          metadata?: Json;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          user_id: string;
          name: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          invited_email: string;
          invited_by_user_id: string;
          token_hash: string;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_by_user_id: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          invited_email: string;
          invited_by_user_id: string;
          token_hash: string;
          created_at?: string;
          expires_at: string;
          accepted_at?: string | null;
          accepted_by_user_id?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          invited_email?: string;
          invited_by_user_id?: string;
          token_hash?: string;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by_user_id?: string | null;
          revoked_at?: string | null;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          owner_user_id: string;
          personal_for_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_user_id: string;
          personal_for_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_user_id?: string;
          personal_for_user_id?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      ensure_personal_workspace: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      create_shared_workspace: {
        Args: {
          p_name: string;
        };
        Returns: {
          workspace_id: string;
          workspace_name: string;
        }[];
      };
      create_workspace_invitation: {
        Args: {
          p_workspace_id: string;
          p_invited_email: string;
        };
        Returns: {
          invitation_id: string;
          raw_token: string;
          invited_email: string;
          expires_at: string;
        }[];
      };
      accept_workspace_invitation: {
        Args: {
          p_raw_token: string;
        };
        Returns: {
          workspace_id: string;
          workspace_name: string;
        }[];
      };
      revoke_workspace_invitation: {
        Args: {
          p_invitation_id: string;
        };
        Returns: undefined;
      };
      remove_workspace_member: {
        Args: {
          p_workspace_id: string;
          p_member_user_id: string;
        };
        Returns: undefined;
      };
      leave_shared_workspace: {
        Args: {
          p_workspace_id: string;
        };
        Returns: undefined;
      };
      delete_shared_workspace: {
        Args: {
          p_workspace_id: string;
        };
        Returns: undefined;
      };
      list_workspace_members: {
        Args: {
          p_workspace_id: string;
        };
        Returns: {
          user_id: string;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          joined_at: string;
          is_owner: boolean;
        }[];
      };
    };
  };
}
