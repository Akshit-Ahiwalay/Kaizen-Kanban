import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import LandingScreen from "@/components/LandingScreen";
import BoardScene from "@/components/BoardScene";
import type { Column, CreateTaskInput, MoveTaskInput } from "@/features/board/types";
import { createEmptyBoardColumns, createInitialBoardColumns } from "@/features/board/data";
import { createTaskCard, insertTaskIntoColumn, moveTask } from "@/features/board/mutations";
import {
  createTaskForUser,
  fetchBoardColumnsForUser,
  moveTaskForUser,
} from "@/features/board/persistence";
import { ensureAnonymousSession } from "@/integrations/supabase/auth";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

type AppState = "landing" | "revealing" | "board";

const shouldUseSupabase = isSupabaseConfigured && import.meta.env.MODE !== "test";

const Index = () => {
  const [state, setState] = useState<AppState>("landing");
  const [boardColumns, setBoardColumns] = useState<Column[]>(
    shouldUseSupabase ? createEmptyBoardColumns : createInitialBoardColumns,
  );
  const [session, setSession] = useState<Session | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(shouldUseSupabase);
  const [isBoardLoading, setIsBoardLoading] = useState(shouldUseSupabase);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleEnter = useCallback(() => {
    setState("revealing");
  }, []);

  const handleRevealComplete = useCallback(() => {
    setState("board");
  }, []);

  const handleCreateTask = useCallback(
    (task: CreateTaskInput) => {
      const newTask = createTaskCard(task);
      let previousColumns: Column[] | null = null;

      setBoardColumns((currentColumns) => {
        previousColumns = currentColumns;
        return insertTaskIntoColumn(currentColumns, newTask, "todo");
      });

      if (!shouldUseSupabase || !userId) {
        return;
      }

      void (async () => {
        try {
          await createTaskForUser(userId, newTask);
          setSyncError(null);
        } catch {
          if (previousColumns) {
            setBoardColumns(previousColumns);
          }
          setSyncError("Save issue");
        }
      })();
    },
    [userId],
  );

  const handleMoveTask = useCallback(
    (taskMove: MoveTaskInput) => {
      let previousColumns: Column[] | null = null;
      let changed = false;

      setBoardColumns((currentColumns) => {
        const nextColumns = moveTask(currentColumns, taskMove);
        previousColumns = currentColumns;
        changed = nextColumns !== currentColumns;
        return nextColumns;
      });

      if (!changed || !shouldUseSupabase || !userId) {
        return;
      }

      void (async () => {
        try {
          await moveTaskForUser(userId, taskMove.taskId, taskMove.targetColumnId);
          setSyncError(null);
        } catch {
          if (previousColumns) {
            setBoardColumns(previousColumns);
          }
          setSyncError("Move issue");
        }
      })();
    },
    [userId],
  );

  useEffect(() => {
    if (!shouldUseSupabase || !supabase) {
      return;
    }

    let isMounted = true;

    const syncSession = async () => {
      try {
        const activeSession = await ensureAnonymousSession();

        if (!isMounted) {
          return;
        }

        setSession(activeSession);
        setUserId(activeSession?.user.id ?? null);
        setSyncError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSyncError("Guest auth unavailable");
        setIsBoardLoading(false);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
        if (!isMounted) {
          return;
        }

        setSession(nextSession);
        setUserId(nextSession?.user.id ?? null);
      },
    );

    void syncSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!shouldUseSupabase) {
      return;
    }

    if (!userId) {
      if (!isAuthLoading) {
        setBoardColumns(createEmptyBoardColumns());
        setIsBoardLoading(false);
      }
      return;
    }

    let isMounted = true;

    const loadBoard = async () => {
      setIsBoardLoading(true);

      try {
        const columns = await fetchBoardColumnsForUser(userId);

        if (!isMounted) {
          return;
        }

        setBoardColumns(columns);
        setSyncError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSyncError("Sync unavailable");
        setBoardColumns(createEmptyBoardColumns());
      } finally {
        if (isMounted) {
          setIsBoardLoading(false);
        }
      }
    };

    void loadBoard();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, userId]);

  const boardStatusText = useMemo(() => {
    if (!shouldUseSupabase) {
      return null;
    }

    if (syncError) {
      return "Sync issue";
    }

    if (isAuthLoading || isBoardLoading) {
      return "Syncing";
    }

    if (session?.user?.is_anonymous) {
      return "Guest";
    }

    return null;
  }, [isAuthLoading, isBoardLoading, session?.user?.is_anonymous, syncError]);

  const boardStatusTone = useMemo(() => {
    if (!shouldUseSupabase) {
      return null;
    }

    if (syncError) {
      return "error" as const;
    }

    if (isAuthLoading || isBoardLoading) {
      return "loading" as const;
    }

    if (session?.user?.is_anonymous) {
      return "guest" as const;
    }

    return null;
  }, [isAuthLoading, isBoardLoading, session?.user?.is_anonymous, syncError]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Board is always mounted underneath */}
      <div className="absolute inset-0 z-10">
        <BoardScene
          columns={boardColumns}
          isActive={state !== "landing"}
          onCreateTask={handleCreateTask}
          onMoveTask={handleMoveTask}
          statusText={boardStatusText}
          statusTone={boardStatusTone}
          canCreateTask={!shouldUseSupabase || !!userId}
          isBoardLoading={isAuthLoading || isBoardLoading}
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
