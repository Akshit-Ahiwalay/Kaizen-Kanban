import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import LandingScreen from "@/components/LandingScreen";
import BoardScene from "@/components/BoardScene";
import type {
  Column,
  CreateTaskInput,
  CreateTeamMemberInput,
  MoveTaskInput,
  TeamMember,
  UpdateTaskInput,
} from "@/features/board/types";
import { attachAssigneesToColumns } from "@/features/board/assignees";
import { createEmptyBoardColumns, createInitialBoardColumns } from "@/features/board/data";
import { createTaskCard, deleteTask, insertTaskIntoColumn, moveTask, updateTask } from "@/features/board/mutations";
import {
  createTaskForWorkspace,
  deleteTaskForWorkspace,
  fetchBoardColumnsForWorkspace,
  syncTaskOrderForWorkspace,
  updateTaskForWorkspace,
} from "@/features/board/persistence";
import { createInitialTeamMembers } from "@/features/team/data";
import { createTeamMember } from "@/features/team/mutations";
import { createTeamMemberForWorkspace, fetchTeamMembersForWorkspace } from "@/features/team/persistence";
import { ensureProfileForUser, resolveUserAvatarUrl } from "@/features/profile/persistence";
import type { AppProfile } from "@/features/profile/types";
import { ensurePersonalWorkspaceForCurrentUser } from "@/features/workspace/persistence";
import {
  acceptWorkspaceInvitation,
  clearStoredActiveWorkspaceId,
  createSharedWorkspace,
  createWorkspaceInvitation,
  fetchWorkspaceMembers,
  fetchWorkspaceInvitationsForOwner,
  fetchWorkspacesForCurrentUser,
  getStoredActiveWorkspaceId,
  getWorkspaceErrorMessage,
  getWorkspaceInvitationErrorMessage,
  revokeWorkspaceInvitation,
  storeActiveWorkspaceId,
  type WorkspaceMemberSummary,
  type WorkspaceInvitationSummary,
  type WorkspaceSummary,
} from "@/features/workspace/persistence";
import {
  clearPendingWorkspaceInviteToken,
  continueAsGuest,
  clearPendingAuthFlow,
  getGuestUpgradeErrorMessage,
  getGuestUpgradePendingMessage,
  getGuestUpgradeSuccessMessage,
  getCurrentSession,
  getPendingAuthFlow,
  getPendingWorkspaceInviteToken,
  persistPendingWorkspaceInviteToken,
  readRedirectAuthError,
  readWorkspaceInviteToken,
  sendMagicLink,
  signInWithGoogle,
  signOutSession,
  upgradeGuestToEmail,
  upgradeGuestToGoogle,
} from "@/integrations/supabase/auth";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

type AppState = "landing" | "revealing" | "board";

const shouldUseSupabase = isSupabaseConfigured && import.meta.env.MODE !== "test";

const findTaskColumnId = (columns: Column[], taskId: string) =>
  columns.find((column) => column.cards.some((card) => card.id === taskId))?.id ?? null;

const buildWorkspaceInviteLink = (rawToken: string) => {
  if (typeof window === "undefined") {
    return rawToken;
  }

  const inviteUrl = new URL(window.location.href);

  inviteUrl.searchParams.set("invite", rawToken);
  inviteUrl.hash = "";

  return inviteUrl.toString();
};

const isSharedWorkspace = (workspace: WorkspaceSummary | null) =>
  Boolean(workspace && !workspace.personalForUserId);

const buildWorkspaceGroups = (workspaces: WorkspaceSummary[], currentUserId: string | null) => {
  const personal = workspaces
    .filter((workspace) => workspace.personalForUserId === currentUserId)
    .map((workspace) => ({
      id: workspace.id,
      label: workspace.name,
      description: "Private to you",
      isShared: false,
      isOwnedByCurrentUser: true,
    }));
  const ownedShared = workspaces
    .filter((workspace) => !workspace.personalForUserId && workspace.ownerUserId === currentUserId)
    .map((workspace) => ({
      id: workspace.id,
      label: workspace.name,
      description: "Shared workspace you own",
      isShared: true,
      isOwnedByCurrentUser: true,
    }));
  const joinedShared = workspaces
    .filter((workspace) => !workspace.personalForUserId && workspace.ownerUserId !== currentUserId)
    .map((workspace) => ({
      id: workspace.id,
      label: workspace.name,
      description: "Shared workspace",
      isShared: true,
      isOwnedByCurrentUser: false,
    }));

  return [
    personal.length > 0 ? { label: "Personal", options: personal } : null,
    ownedShared.length > 0 ? { label: "Shared by you", options: ownedShared } : null,
    joinedShared.length > 0 ? { label: "Shared with you", options: joinedShared } : null,
  ].filter((group): group is NonNullable<typeof group> => group !== null);
};

const Index = () => {
  const [state, setState] = useState<AppState>("landing");
  const [boardColumns, setBoardColumns] = useState<Column[]>(
    shouldUseSupabase
      ? createEmptyBoardColumns
      : () => attachAssigneesToColumns(createInitialBoardColumns(), createInitialTeamMembers()),
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    shouldUseSupabase ? [] : createInitialTeamMembers,
  );
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMemberSummary[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [pendingWorkspaceInvitations, setPendingWorkspaceInvitations] = useState<
    WorkspaceInvitationSummary[]
  >([]);
  const [isAuthLoading, setIsAuthLoading] = useState(shouldUseSupabase);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(shouldUseSupabase);
  const [isBoardLoading, setIsBoardLoading] = useState(shouldUseSupabase);
  const [hasPendingWorkspaceInvite, setHasPendingWorkspaceInvite] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);
  const [guestUpgradeFeedback, setGuestUpgradeFeedback] = useState<string | null>(null);
  const [guestUpgradeFeedbackTone, setGuestUpgradeFeedbackTone] = useState<
    "success" | "error" | "info" | null
  >(null);
  const [workspaceFeedback, setWorkspaceFeedback] = useState<string | null>(null);
  const [workspaceFeedbackTone, setWorkspaceFeedbackTone] = useState<
    "success" | "error" | "info" | null
  >(null);
  const [isWorkspaceActionLoading, setIsWorkspaceActionLoading] = useState(false);
  const [isWorkspaceMembersLoading, setIsWorkspaceMembersLoading] = useState(false);
  const [latestInviteLink, setLatestInviteLink] = useState<string | null>(null);
  const activeWorkspaceIdRef = useRef<string | null>(null);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === workspaceId) ?? null,
    [workspaceId, workspaces],
  );
  const isActiveSharedWorkspace = useMemo(() => isSharedWorkspace(activeWorkspace), [activeWorkspace]);
  const canManageWorkspaceInvites = useMemo(
    () =>
      Boolean(
        activeWorkspace &&
          !activeWorkspace.personalForUserId &&
          userId &&
          !session?.user?.is_anonymous &&
          activeWorkspace.ownerUserId === userId,
      ),
    [activeWorkspace, session?.user?.is_anonymous, userId],
  );
  const workspaceGroups = useMemo(() => buildWorkspaceGroups(workspaces, userId), [userId, workspaces]);
  const activeWorkspaceOption = useMemo(
    () =>
      workspaceGroups
        .flatMap((group) => group.options)
        .find((workspace) => workspace.id === activeWorkspace?.id) ?? null,
    [activeWorkspace?.id, workspaceGroups],
  );
  const activeWorkspaceDetail = useMemo(() => {
    if (!activeWorkspaceOption) {
      return null;
    }

    if (!activeWorkspaceOption.isShared) {
      return activeWorkspaceOption.description;
    }

    const memberCount = workspaceMembers.length;
    const memberLabel = `${memberCount} ${memberCount === 1 ? "member" : "members"}`;

    return `${activeWorkspaceOption.description} | ${memberLabel}`;
  }, [activeWorkspaceOption, workspaceMembers.length]);
  const requiresPermanentInviteAuth = hasPendingWorkspaceInvite && (!session?.user || session.user.is_anonymous);

  const handleEnter = useCallback(() => {
    setState("revealing");
  }, []);

  const handleRevealComplete = useCallback(() => {
    setState("board");
  }, []);

  const handleContinueAsGuest = useCallback(async () => {
    if (!shouldUseSupabase) {
      handleEnter();
      return;
    }

    setIsAuthActionLoading(true);
    setAuthFeedback(null);
    setGuestUpgradeFeedback(null);
    setGuestUpgradeFeedbackTone(null);

    try {
      await continueAsGuest();
      handleEnter();
    } catch {
      setAuthFeedback("Guest auth unavailable");
    } finally {
      setIsAuthActionLoading(false);
    }
  }, [handleEnter]);

  const handleContinueWithGoogle = useCallback(async () => {
    if (!shouldUseSupabase) {
      return;
    }

    setIsAuthActionLoading(true);
    setAuthFeedback(null);
    setGuestUpgradeFeedback(null);
    setGuestUpgradeFeedbackTone(null);

    try {
      await signInWithGoogle();
    } catch {
      setAuthFeedback("Google sign-in unavailable");
      setIsAuthActionLoading(false);
      return;
    }

    setIsAuthActionLoading(false);
  }, []);

  const handleSendMagicLink = useCallback(async (email: string) => {
    if (!shouldUseSupabase) {
      return false;
    }

    setIsAuthActionLoading(true);
    setAuthFeedback(null);
    setGuestUpgradeFeedback(null);
    setGuestUpgradeFeedbackTone(null);

    try {
      await sendMagicLink(email);
      setAuthFeedback("Magic link sent");
      return true;
    } catch {
      setAuthFeedback("Magic link unavailable");
      return false;
    } finally {
      setIsAuthActionLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!shouldUseSupabase) {
      return;
    }

    try {
      await signOutSession();
      setState("landing");
      setSyncError(null);
      setAuthFeedback(null);
      setGuestUpgradeFeedback(null);
      setGuestUpgradeFeedbackTone(null);
      setWorkspaces([]);
      setWorkspaceMembers([]);
      setWorkspaceId(null);
      setPendingWorkspaceInvitations([]);
      setWorkspaceFeedback(null);
      setWorkspaceFeedbackTone(null);
      setIsWorkspaceActionLoading(false);
      setIsWorkspaceMembersLoading(false);
      setLatestInviteLink(null);
      setIsWorkspaceLoading(false);
      clearStoredActiveWorkspaceId();
      clearPendingAuthFlow();
    } catch {
      setSyncError("Sign-out issue");
    }
  }, []);

  const handleUpgradeGuestWithGoogle = useCallback(async () => {
    if (!shouldUseSupabase) {
      return;
    }

    setIsAuthActionLoading(true);
    setGuestUpgradeFeedback(null);
    setGuestUpgradeFeedbackTone(null);

    try {
      const didStart = await upgradeGuestToGoogle();

      if (!didStart) {
        setGuestUpgradeFeedback("Upgrade unavailable");
        setGuestUpgradeFeedbackTone("error");
      }
    } catch (error) {
      setGuestUpgradeFeedback(getGuestUpgradeErrorMessage(error, "guest-upgrade-google"));
      setGuestUpgradeFeedbackTone("error");
      setIsAuthActionLoading(false);
      return;
    }

    setIsAuthActionLoading(false);
  }, []);

  const handleUpgradeGuestWithEmail = useCallback(async (email: string) => {
    if (!shouldUseSupabase) {
      return false;
    }

    setIsAuthActionLoading(true);
    setGuestUpgradeFeedback(null);
    setGuestUpgradeFeedbackTone(null);

    try {
      const didStart = await upgradeGuestToEmail(email);

      if (!didStart) {
        setGuestUpgradeFeedback("Upgrade unavailable");
        setGuestUpgradeFeedbackTone("error");
        return false;
      }

      const pendingFlow = getPendingAuthFlow();

      setGuestUpgradeFeedback(
        pendingFlow ? getGuestUpgradePendingMessage(pendingFlow) : "Check your email to finish upgrade",
      );
      setGuestUpgradeFeedbackTone("info");
      return true;
    } catch (error) {
      setGuestUpgradeFeedback(getGuestUpgradeErrorMessage(error, "guest-upgrade-email"));
      setGuestUpgradeFeedbackTone("error");
      return false;
    } finally {
      setIsAuthActionLoading(false);
    }
  }, []);

  const handleCreateTask = useCallback(
    (task: CreateTaskInput) => {
      const newTask = createTaskCard(task);
      const targetWorkspaceId = activeWorkspaceIdRef.current;
      let previousColumns: Column[] | null = null;
      let nextColumns: Column[] | null = null;

      setBoardColumns((currentColumns) => {
        previousColumns = currentColumns;
        nextColumns = insertTaskIntoColumn(currentColumns, newTask, "todo");
        return nextColumns;
      });

      if (!shouldUseSupabase || !userId || !targetWorkspaceId) {
        return;
      }

      void (async () => {
        try {
          await createTaskForWorkspace(userId, targetWorkspaceId, newTask);
          if (nextColumns) {
            await syncTaskOrderForWorkspace(targetWorkspaceId, nextColumns, ["todo"]);
          }
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
      let nextColumns: Column[] | null = null;
      let sourceColumnId: Column["id"] | null = null;
      let changed = false;

      setBoardColumns((currentColumns) => {
        sourceColumnId = findTaskColumnId(currentColumns, taskMove.taskId);
        nextColumns = moveTask(currentColumns, taskMove);
        previousColumns = currentColumns;
        changed = nextColumns !== currentColumns;
        return nextColumns;
      });

      if (!changed || !shouldUseSupabase || !workspaceId) {
        return;
      }

      void (async () => {
        try {
          if (nextColumns && sourceColumnId) {
            await syncTaskOrderForWorkspace(workspaceId, nextColumns, [
              sourceColumnId,
              taskMove.targetColumnId,
            ]);
          }
          setSyncError(null);
        } catch {
          if (previousColumns) {
            setBoardColumns(previousColumns);
          }
          setSyncError("Move issue");
        }
      })();
    },
    [workspaceId],
  );

  const handleUpdateTask = useCallback(
    async (taskUpdate: UpdateTaskInput) => {
      let previousColumns: Column[] | null = null;
      let nextColumns: Column[] | null = null;
      let previousStatus: Column["id"] | null = null;

      setBoardColumns((currentColumns) => {
        previousColumns = currentColumns;
        previousStatus = findTaskColumnId(currentColumns, taskUpdate.taskId);
        nextColumns = updateTask(currentColumns, taskUpdate);
        return nextColumns;
      });

      if (!shouldUseSupabase || !workspaceId) {
        return true;
      }

      try {
        await updateTaskForWorkspace(workspaceId, taskUpdate);
        if (nextColumns && previousStatus && previousStatus !== taskUpdate.status) {
          await syncTaskOrderForWorkspace(workspaceId, nextColumns, [
            previousStatus,
            taskUpdate.status,
          ]);
        }
        setSyncError(null);
        return true;
      } catch {
        if (previousColumns) {
          setBoardColumns(previousColumns);
        }
        setSyncError("Save issue");
        return false;
      }
    },
    [workspaceId],
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      let previousColumns: Column[] | null = null;
      let nextColumns: Column[] | null = null;
      let sourceColumnId: Column["id"] | null = null;

      setBoardColumns((currentColumns) => {
        previousColumns = currentColumns;
        sourceColumnId = findTaskColumnId(currentColumns, taskId);
        nextColumns = deleteTask(currentColumns, taskId);
        return nextColumns;
      });

      if (!shouldUseSupabase || !workspaceId) {
        return true;
      }

      try {
        await deleteTaskForWorkspace(workspaceId, taskId);
        if (nextColumns && sourceColumnId) {
          await syncTaskOrderForWorkspace(workspaceId, nextColumns, [sourceColumnId]);
        }
        setSyncError(null);
        return true;
      } catch {
        if (previousColumns) {
          setBoardColumns(previousColumns);
        }
        setSyncError("Delete issue");
        return false;
      }
    },
    [workspaceId],
  );

  const handleCreateTeamMember = useCallback(
    async (input: CreateTeamMemberInput) => {
      const newMember = createTeamMember(input);
      let previousMembers: TeamMember[] | null = null;

      setTeamMembers((currentMembers) => {
        previousMembers = currentMembers;
        return [...currentMembers, newMember];
      });

      if (!shouldUseSupabase || !userId || !workspaceId) {
        return true;
      }

      try {
        await createTeamMemberForWorkspace(userId, workspaceId, newMember);
        setSyncError(null);
        return true;
      } catch {
        if (previousMembers) {
          setTeamMembers(previousMembers);
        }
        setSyncError("Members issue");
        return false;
      }
    },
    [userId, workspaceId],
  );

  const refreshPendingInvitations = useCallback(
    async (targetWorkspaceId: string) => {
      if (!canManageWorkspaceInvites) {
        setPendingWorkspaceInvitations([]);
        return;
      }

      const nextInvitations = await fetchWorkspaceInvitationsForOwner(targetWorkspaceId);
      setPendingWorkspaceInvitations(nextInvitations);
    },
    [canManageWorkspaceInvites],
  );

  const handleSelectWorkspace = useCallback(
    (nextWorkspaceId: string) => {
      activeWorkspaceIdRef.current = nextWorkspaceId;
      setWorkspaceId(nextWorkspaceId);
      storeActiveWorkspaceId(nextWorkspaceId);
      setLatestInviteLink(null);
      setWorkspaceFeedback(null);
      setWorkspaceFeedbackTone(null);
    },
    [],
  );

  useEffect(() => {
    activeWorkspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  const handleCreateSharedWorkspace = useCallback(
    async (name: string) => {
      if (!userId) {
        setWorkspaceFeedback("Sign in to continue");
        setWorkspaceFeedbackTone("error");
        return false;
      }

      setIsWorkspaceActionLoading(true);

      try {
        const createdWorkspace = await createSharedWorkspace(name);
        const optimisticWorkspace: WorkspaceSummary = {
          id: createdWorkspace.workspaceId,
          name: createdWorkspace.workspaceName,
          ownerUserId: userId,
          personalForUserId: undefined,
        };

        setWorkspaces((currentWorkspaces) =>
          currentWorkspaces.some((workspace) => workspace.id === optimisticWorkspace.id)
            ? currentWorkspaces
            : [...currentWorkspaces, optimisticWorkspace],
        );
        activeWorkspaceIdRef.current = createdWorkspace.workspaceId;
        setWorkspaceId(createdWorkspace.workspaceId);
        setWorkspaceMembers([]);
        setPendingWorkspaceInvitations([]);
        storeActiveWorkspaceId(createdWorkspace.workspaceId);
        setLatestInviteLink(null);
        setWorkspaceFeedback(`Created ${createdWorkspace.workspaceName}`);
        setWorkspaceFeedbackTone("success");
        void fetchWorkspacesForCurrentUser()
          .then((nextWorkspaces) => {
            setWorkspaces(nextWorkspaces);
          })
          .catch(() => {
            // Preserve the newly-created workspace selection even if the follow-up refresh fails.
          });
        return true;
      } catch (error) {
        setWorkspaceFeedback(getWorkspaceErrorMessage(error));
        setWorkspaceFeedbackTone("error");
        return false;
      } finally {
        setIsWorkspaceActionLoading(false);
      }
    },
    [userId],
  );

  const handleCreateWorkspaceInvitation = useCallback(
    async (email: string) => {
      if (!workspaceId) {
        return null;
      }

      try {
        const invitation = await createWorkspaceInvitation(workspaceId, email);
        const inviteLink = buildWorkspaceInviteLink(invitation.rawToken);

        setLatestInviteLink(inviteLink);
        setWorkspaceFeedback(`Invite ready for ${invitation.invitedEmail}`);
        setWorkspaceFeedbackTone("success");
        await refreshPendingInvitations(workspaceId);
        return inviteLink;
      } catch (error) {
        setWorkspaceFeedback(getWorkspaceInvitationErrorMessage(error));
        setWorkspaceFeedbackTone("error");
        return null;
      }
    },
    [refreshPendingInvitations, workspaceId],
  );

  const handleRevokeWorkspaceInvitation = useCallback(
    async (invitationId: string) => {
      if (!workspaceId) {
        return;
      }

      try {
        await revokeWorkspaceInvitation(invitationId);
        setWorkspaceFeedback("Invite revoked");
        setWorkspaceFeedbackTone("info");
        await refreshPendingInvitations(workspaceId);
      } catch (error) {
        setWorkspaceFeedback(getWorkspaceInvitationErrorMessage(error));
        setWorkspaceFeedbackTone("error");
      }
    },
    [refreshPendingInvitations, workspaceId],
  );

  const loadBoardSnapshot = useCallback(async (targetWorkspaceId: string) => {
    const [columns, members] = await Promise.all([
      fetchBoardColumnsForWorkspace(targetWorkspaceId),
      fetchTeamMembersForWorkspace(targetWorkspaceId),
    ]);

    return { columns, members };
  }, []);

  useEffect(() => {
    if (!shouldUseSupabase || !supabase) {
      return;
    }

    let isMounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      const pendingFlow = getPendingAuthFlow();
      const pendingWorkspaceInviteToken = getPendingWorkspaceInviteToken();

      setSession(nextSession);
      setUserId(nextSession?.user.id ?? null);

      if (!nextSession?.user || nextSession.user.is_anonymous) {
        setProfile(null);
        if (pendingWorkspaceInviteToken) {
          setHasPendingWorkspaceInvite(true);
          setAuthFeedback("Sign in with Google or a magic link to accept this invite");
          setState("landing");
        }

        if (pendingFlow?.returnToBoard && !pendingWorkspaceInviteToken) {
          setState("board");
        }

        if (pendingFlow?.kind === "guest-upgrade-email") {
          setGuestUpgradeFeedback(getGuestUpgradePendingMessage(pendingFlow));
          setGuestUpgradeFeedbackTone("info");
        }

        if (!nextSession?.user) {
          if (!pendingWorkspaceInviteToken) {
            setAuthFeedback(null);
          }
          setGuestUpgradeFeedback(null);
          setGuestUpgradeFeedbackTone(null);
        }
        return;
      }

      try {
        const nextProfile = await ensureProfileForUser(nextSession.user);

        if (!isMounted) {
          return;
        }

        setProfile(nextProfile);

        if (pendingFlow) {
          if (pendingFlow.returnToBoard) {
            setState("board");
          }

          setAuthFeedback(getGuestUpgradeSuccessMessage(pendingFlow));
          setGuestUpgradeFeedback(null);
          setGuestUpgradeFeedbackTone(null);
          clearPendingAuthFlow();
        } else {
          if (!getPendingWorkspaceInviteToken()) {
            setAuthFeedback(null);
          }
          setGuestUpgradeFeedback(null);
          setGuestUpgradeFeedbackTone(null);
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setProfile(null);
        setAuthFeedback("Profile unavailable");
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
        void applySession(nextSession);
      },
    );

    void (async () => {
      try {
        const inviteTokenFromUrl = readWorkspaceInviteToken();

        if (inviteTokenFromUrl) {
          persistPendingWorkspaceInviteToken(inviteTokenFromUrl);
          setHasPendingWorkspaceInvite(true);
          setAuthFeedback("Sign in with Google or a magic link to accept this invite");
          setState("landing");
        } else if (getPendingWorkspaceInviteToken()) {
          setHasPendingWorkspaceInvite(true);
        }

        const redirectError = readRedirectAuthError();
        const pendingFlow = getPendingAuthFlow();

        if (redirectError && pendingFlow) {
          if (pendingFlow.returnToBoard) {
            setState("board");
            setGuestUpgradeFeedback(getGuestUpgradeErrorMessage(redirectError, pendingFlow.kind));
            setGuestUpgradeFeedbackTone("error");
          } else {
            setAuthFeedback(getGuestUpgradeErrorMessage(redirectError, pendingFlow.kind));
          }

          clearPendingAuthFlow();
        }

        const currentSession = await getCurrentSession();

        await applySession(currentSession);
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthFeedback("Auth unavailable");
        setIsBoardLoading(false);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    })();

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
        setWorkspaces([]);
        setWorkspaceMembers([]);
        setWorkspaceId(null);
        setIsWorkspaceLoading(false);
      }
      return;
    }

    let isMounted = true;

    const loadWorkspace = async () => {
      setIsWorkspaceLoading(true);

      try {
        const personalWorkspace = await ensurePersonalWorkspaceForCurrentUser();
        const pendingInviteToken = getPendingWorkspaceInviteToken();
        const canRedeemPendingInvite = Boolean(
          pendingInviteToken && session?.user && !session.user.is_anonymous,
        );
        let acceptedWorkspaceId: string | null = null;
        let acceptedWorkspaceName: string | null = null;
        let nextWorkspaces: WorkspaceSummary[] | null = null;

        if (canRedeemPendingInvite && pendingInviteToken) {
          const currentWorkspaces = await fetchWorkspacesForCurrentUser();
          const currentWorkspaceIds = new Set(currentWorkspaces.map((workspace) => workspace.id));

          try {
            const acceptedInvite = await acceptWorkspaceInvitation(pendingInviteToken);
            nextWorkspaces = await fetchWorkspacesForCurrentUser();
            const acceptedWorkspace =
              (acceptedInvite?.workspaceId
                ? nextWorkspaces.find((workspace) => workspace.id === acceptedInvite.workspaceId) ?? null
                : null) ??
              nextWorkspaces.find((workspace) => !currentWorkspaceIds.has(workspace.id)) ??
              null;

            if (acceptedWorkspace) {
              acceptedWorkspaceId = acceptedWorkspace.id;
              acceptedWorkspaceName = acceptedInvite?.workspaceName ?? acceptedWorkspace.name;
              clearPendingWorkspaceInviteToken();
              setHasPendingWorkspaceInvite(false);
              setAuthFeedback(`Joined ${acceptedWorkspaceName}`);
              setWorkspaceFeedback(null);
              setWorkspaceFeedbackTone(null);
              setState("board");
            } else if (!acceptedInvite) {
              setAuthFeedback("Workspace invite unavailable");
            }
          } catch (error) {
            const inviteMessage = getWorkspaceInvitationErrorMessage(error);

            setAuthFeedback(inviteMessage);

            if (inviteMessage !== "Workspace invite unavailable") {
              clearPendingWorkspaceInviteToken();
              setHasPendingWorkspaceInvite(false);
            }
          }
        }

        const resolvedWorkspaces = nextWorkspaces ?? (await fetchWorkspacesForCurrentUser());
        const storedWorkspaceId = getStoredActiveWorkspaceId();
        const personalWorkspaceId =
          resolvedWorkspaces.find((workspace) => workspace.id === personalWorkspace.id)?.id ??
          personalWorkspace.id;
        const nextWorkspaceId =
          (acceptedWorkspaceId &&
            resolvedWorkspaces.some((workspace) => workspace.id === acceptedWorkspaceId)
              ? acceptedWorkspaceId
              : null) ??
          (storedWorkspaceId &&
          resolvedWorkspaces.some((workspace) => workspace.id === storedWorkspaceId)
            ? storedWorkspaceId
            : null) ??
          (resolvedWorkspaces.some((workspace) => workspace.id === personalWorkspaceId)
            ? personalWorkspaceId
            : resolvedWorkspaces[0]?.id ?? null);

        if (!isMounted) {
          return;
        }

        setWorkspaces(resolvedWorkspaces);
        activeWorkspaceIdRef.current = nextWorkspaceId;
        setWorkspaceId(nextWorkspaceId);
        if (nextWorkspaceId) {
          storeActiveWorkspaceId(nextWorkspaceId);
        } else {
          clearStoredActiveWorkspaceId();
        }
        setSyncError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setWorkspaces([]);
        setWorkspaceMembers([]);
        setWorkspaceId(null);
        setSyncError("Workspace unavailable");
      } finally {
        if (isMounted) {
          setIsWorkspaceLoading(false);
        }
      }
    };

    void loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, session?.user, userId]);

  useEffect(() => {
    if (!shouldUseSupabase) {
      return;
    }

    if (!workspaceId || !canManageWorkspaceInvites) {
      setPendingWorkspaceInvitations([]);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        const nextInvitations = await fetchWorkspaceInvitationsForOwner(workspaceId);

        if (!isMounted) {
          return;
        }

        setPendingWorkspaceInvitations(nextInvitations);
      } catch {
        if (!isMounted) {
          return;
        }

        setPendingWorkspaceInvitations([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [canManageWorkspaceInvites, workspaceId]);

  useEffect(() => {
    if (!shouldUseSupabase) {
      return;
    }

    if (!activeWorkspace || !isSharedWorkspace(activeWorkspace)) {
      setWorkspaceMembers([]);
      setIsWorkspaceMembersLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      setIsWorkspaceMembersLoading(true);
      setWorkspaceMembers([]);

      try {
        const nextMembers = await fetchWorkspaceMembers(activeWorkspace.id);

        if (!isMounted) {
          return;
        }

        setWorkspaceMembers(nextMembers);
      } catch {
        if (!isMounted) {
          return;
        }

        setWorkspaceMembers([]);
      } finally {
        if (isMounted) {
          setIsWorkspaceMembersLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspace]);

  useEffect(() => {
    if (!shouldUseSupabase) {
      return;
    }

    if (!userId) {
      if (!isAuthLoading && !isWorkspaceLoading) {
        setBoardColumns(createEmptyBoardColumns());
        setTeamMembers([]);
        setIsBoardLoading(false);
      }
      return;
    }

    if (!workspaceId) {
      if (!isAuthLoading && !isWorkspaceLoading) {
        setBoardColumns(createEmptyBoardColumns());
        setTeamMembers([]);
        setIsBoardLoading(false);
      }
      return;
    }

    let isMounted = true;

    const loadBoard = async () => {
      setIsBoardLoading(true);

      try {
        const { columns, members } = await loadBoardSnapshot(workspaceId);

        if (!isMounted) {
          return;
        }

        setTeamMembers(members);
        setBoardColumns(attachAssigneesToColumns(columns, members));
        setSyncError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSyncError("Sync unavailable");
        setBoardColumns(createEmptyBoardColumns());
        setTeamMembers([]);
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
  }, [isAuthLoading, isWorkspaceLoading, loadBoardSnapshot, userId, workspaceId]);

  useEffect(() => {
    if (!shouldUseSupabase || !supabase || !userId || !workspaceId) {
      return;
    }

    let isMounted = true;
    let isRefreshing = false;
    let shouldRefreshAgain = false;

    const refreshBoard = async () => {
      if (isRefreshing) {
        shouldRefreshAgain = true;
        return;
      }

      isRefreshing = true;

      try {
        const { columns, members } = await loadBoardSnapshot(workspaceId);

        if (!isMounted) {
          return;
        }

        setTeamMembers(members);
        setBoardColumns(attachAssigneesToColumns(columns, members));
        setSyncError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSyncError("Sync unavailable");
      } finally {
        isRefreshing = false;

        if (shouldRefreshAgain) {
          shouldRefreshAgain = false;
          void refreshBoard();
        }
      }
    };

    const channel = supabase
      .channel(`workspace-board:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          void refreshBoard();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_members",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          void refreshBoard();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [loadBoardSnapshot, userId, workspaceId]);

  const boardStatusText = useMemo(() => {
    if (!shouldUseSupabase) {
      return null;
    }

    if (syncError) {
      return "Sync issue";
    }

    if (isAuthLoading || isWorkspaceLoading || isBoardLoading) {
      return "Syncing";
    }

    if (session?.user && !session.user.is_anonymous && authFeedback) {
      return authFeedback;
    }

    return null;
  }, [authFeedback, isAuthLoading, isBoardLoading, isWorkspaceLoading, session?.user, syncError]);

  const boardStatusTone = useMemo(() => {
    if (!shouldUseSupabase) {
      return null;
    }

    if (syncError) {
      return "error" as const;
    }

    if (isAuthLoading || isWorkspaceLoading || isBoardLoading) {
      return "loading" as const;
    }

    if (session?.user && !session.user.is_anonymous && authFeedback) {
      return authFeedback === "Profile unavailable" ? ("error" as const) : ("guest" as const);
    }

    return null;
  }, [authFeedback, isAuthLoading, isBoardLoading, isWorkspaceLoading, session?.user, syncError]);

  const accountLabel = useMemo(() => {
    if (session?.user?.is_anonymous) {
      return "Guest";
    }

    return profile?.displayName ?? session?.user?.email ?? null;
  }, [profile?.displayName, session?.user?.email, session?.user?.is_anonymous]);

  const accountDetail = useMemo(() => {
    if (session?.user?.is_anonymous) {
      return "Anonymous access";
    }

    return profile?.email ?? session?.user?.email ?? null;
  }, [profile?.email, session?.user?.email, session?.user?.is_anonymous]);

  const accountAvatarUrl = useMemo(() => {
    return profile?.avatarUrl ?? resolveUserAvatarUrl(session?.user) ?? null;
  }, [profile?.avatarUrl, session?.user]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Board is always mounted underneath */}
      <div className="absolute inset-0 z-10">
        <BoardScene
          columns={boardColumns}
          teamMembers={teamMembers}
          isActive={state !== "landing"}
          onCreateTask={handleCreateTask}
          onCreateTeamMember={handleCreateTeamMember}
          onMoveTask={handleMoveTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          statusText={boardStatusText}
          statusTone={boardStatusTone}
          accountLabel={accountLabel}
          accountDetail={accountDetail}
          accountAvatarUrl={accountAvatarUrl}
          isGuestSession={session?.user?.is_anonymous ?? false}
          guestUpgradeFeedback={session?.user?.is_anonymous ? guestUpgradeFeedback : null}
          guestUpgradeFeedbackTone={session?.user?.is_anonymous ? guestUpgradeFeedbackTone : null}
          isUpgradeBusy={isAuthActionLoading}
          onUpgradeGuestWithGoogle={handleUpgradeGuestWithGoogle}
          onUpgradeGuestWithEmail={handleUpgradeGuestWithEmail}
          activeWorkspaceId={workspaceId}
          activeWorkspaceLabel={activeWorkspace?.name ?? null}
          activeWorkspaceDetail={activeWorkspaceDetail}
          isActiveSharedWorkspace={isActiveSharedWorkspace}
          workspaces={workspaceGroups}
          workspaceFeedback={workspaceFeedback}
          workspaceFeedbackTone={workspaceFeedbackTone}
          latestInviteLink={latestInviteLink}
          workspaceMembers={workspaceMembers.map((member) => ({
            id: member.userId,
            label: member.displayName?.trim() || member.email?.trim() || "Workspace member",
            detail: member.email?.trim() || null,
            avatarUrl: member.avatarUrl,
            isOwner: member.isOwner,
            isCurrentUser: member.userId === userId,
          }))}
          isWorkspaceActionLoading={isWorkspaceActionLoading}
          isWorkspaceMembersLoading={isWorkspaceMembersLoading}
          pendingWorkspaceInvitations={pendingWorkspaceInvitations.map((invitation) => ({
            id: invitation.id,
            invitedEmail: invitation.invitedEmail,
          }))}
          canManageWorkspaceInvites={canManageWorkspaceInvites}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateSharedWorkspace={handleCreateSharedWorkspace}
          onCreateWorkspaceInvitation={handleCreateWorkspaceInvitation}
          onRevokeWorkspaceInvitation={handleRevokeWorkspaceInvitation}
          onSignOut={handleSignOut}
          canCreateTask={!shouldUseSupabase || (!!userId && !!workspaceId)}
          isBoardLoading={isAuthLoading || isWorkspaceLoading || isBoardLoading}
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
          <LandingScreen
            onEnter={handleEnter}
            canUseSupabase={shouldUseSupabase}
            hasSession={!!session}
            isGuestSession={session?.user?.is_anonymous ?? false}
            requiresPermanentAccount={requiresPermanentInviteAuth}
            accountLabel={accountLabel}
            authFeedback={authFeedback}
            isAuthBusy={isAuthLoading || isAuthActionLoading}
            onContinueAsGuest={handleContinueAsGuest}
            onContinueWithGoogle={handleContinueWithGoogle}
            onSendMagicLink={handleSendMagicLink}
          />
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
