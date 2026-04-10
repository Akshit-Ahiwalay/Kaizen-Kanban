import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type FeedbackTone = "success" | "error" | "info" | null;

export interface AccountWorkspaceOption {
  id: string;
  label: string;
  description: string;
  isShared: boolean;
  isOwnedByCurrentUser: boolean;
}

export interface AccountWorkspaceGroup {
  label: string;
  options: AccountWorkspaceOption[];
}

export interface AccountWorkspaceInvitation {
  id: string;
  invitedEmail: string;
}

export interface AccountWorkspaceMember {
  id: string;
  label: string;
  detail?: string | null;
  avatarUrl?: string | null;
  isOwner?: boolean;
  isCurrentUser?: boolean;
}

interface AccountMenuProps {
  label: string;
  detail?: string | null;
  avatarUrl?: string | null;
  isGuest?: boolean;
  guestUpgradeFeedback?: string | null;
  guestUpgradeFeedbackTone?: FeedbackTone;
  isUpgradeBusy?: boolean;
  onUpgradeWithGoogle?: () => Promise<void> | void;
  onUpgradeWithEmail?: (email: string) => Promise<boolean>;
  activeWorkspaceId?: string | null;
  activeWorkspaceLabel?: string | null;
  activeWorkspaceDetail?: string | null;
  isActiveSharedWorkspace?: boolean;
  workspaces?: AccountWorkspaceGroup[];
  workspaceMembers?: AccountWorkspaceMember[];
  workspaceFeedback?: string | null;
  workspaceFeedbackTone?: FeedbackTone;
  latestInviteLink?: string | null;
  pendingInvitations?: AccountWorkspaceInvitation[];
  canManageWorkspaceInvites?: boolean;
  canManageWorkspaceMembers?: boolean;
  isWorkspaceActionLoading?: boolean;
  isWorkspaceMembersLoading?: boolean;
  onSelectWorkspace?: (workspaceId: string) => void;
  onCreateSharedWorkspace?: (name: string) => Promise<boolean>;
  onCreateWorkspaceInvitation?: (email: string) => Promise<string | null>;
  onRevokeWorkspaceInvitation?: (invitationId: string) => Promise<void> | void;
  onRemoveWorkspaceMember?: (memberUserId: string) => Promise<void> | void;
  onLeaveSharedWorkspace?: () => Promise<void> | void;
  onSignOut: () => Promise<void> | void;
}

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const AccountMenu = ({
  label,
  detail = null,
  avatarUrl = null,
  isGuest = false,
  guestUpgradeFeedback = null,
  guestUpgradeFeedbackTone = null,
  isUpgradeBusy = false,
  onUpgradeWithGoogle,
  onUpgradeWithEmail,
  activeWorkspaceId = null,
  activeWorkspaceLabel = null,
  activeWorkspaceDetail = null,
  isActiveSharedWorkspace = false,
  workspaces = [],
  workspaceMembers = [],
  workspaceFeedback = null,
  workspaceFeedbackTone = null,
  latestInviteLink = null,
  pendingInvitations = [],
  canManageWorkspaceInvites = false,
  canManageWorkspaceMembers = false,
  isWorkspaceActionLoading = false,
  isWorkspaceMembersLoading = false,
  onSelectWorkspace,
  onCreateSharedWorkspace,
  onCreateWorkspaceInvitation,
  onRevokeWorkspaceInvitation,
  onRemoveWorkspaceMember,
  onLeaveSharedWorkspace,
  onSignOut,
}: AccountMenuProps) => {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isCreateSharedWorkspaceOpen, setIsCreateSharedWorkspaceOpen] = useState(false);
  const [sharedWorkspaceName, setSharedWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isInviteSubmitting, setIsInviteSubmitting] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [isRevokingInviteId, setIsRevokingInviteId] = useState<string | null>(null);
  const [memberActionUserId, setMemberActionUserId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
    maxHeight: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initials = useMemo(() => getInitials(label || (isGuest ? "Guest" : "User")), [isGuest, label]);
  const flattenedWorkspaces = useMemo(() => workspaces.flatMap((group) => group.options), [workspaces]);
  const selectedWorkspace = useMemo(
    () => flattenedWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, flattenedWorkspaces],
  );
  const toneLabel = isGuest ? "Guest" : "Account";
  const canShowAvatar = Boolean(avatarUrl) && !imageFailed;
  const statusMessage = emailError || guestUpgradeFeedback;
  const workspaceStatusMessage = inviteError || workspaceFeedback;
  const statusClassName = emailError
    ? "text-seal/72"
    : guestUpgradeFeedbackTone === "success"
      ? "text-olive/70"
      : guestUpgradeFeedbackTone === "error"
        ? "text-seal/72"
        : "text-muted-foreground/54";
  const workspaceStatusClassName = inviteError
    ? "text-seal/72"
    : workspaceFeedbackTone === "success"
      ? "text-olive/70"
      : workspaceFeedbackTone === "error"
        ? "text-seal/72"
        : "text-muted-foreground/54";

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!guestUpgradeFeedback) {
      return;
    }

    setEmailError("");
  }, [guestUpgradeFeedback]);

  useEffect(() => {
    if (!workspaceFeedback) {
      return;
    }

    setInviteError("");
  }, [workspaceFeedback]);

  useEffect(() => {
    if (!latestInviteLink) {
      setCopiedInviteLink(false);
    }
  }, [latestInviteLink]);

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateMenuPosition = () => {
      if (!buttonRef.current || !menuRef.current) {
        return;
      }

      const viewportPadding = 12;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const menuWidth = Math.min(menuRect.width || 288, window.innerWidth - viewportPadding * 2);
      const menuHeight = menuRect.height || 0;
      const anchoredLeft = buttonRect.right - menuWidth;
      const left = Math.min(
        Math.max(viewportPadding, anchoredLeft),
        window.innerWidth - viewportPadding - menuWidth,
      );
      const preferredTop = buttonRect.bottom + 8;
      const availableBelow = window.innerHeight - preferredTop - viewportPadding;
      const availableAbove = buttonRect.top - 8 - viewportPadding;
      const shouldOpenAbove =
        availableBelow < Math.min(menuHeight, 320) && availableAbove > availableBelow;
      const top = shouldOpenAbove
        ? Math.max(viewportPadding, buttonRect.top - 8 - menuHeight)
        : Math.max(
            viewportPadding,
            Math.min(preferredTop, window.innerHeight - viewportPadding - Math.min(menuHeight, 320)),
          );
      const maxHeight = shouldOpenAbove
        ? Math.max(160, buttonRect.top - 8 - viewportPadding)
        : Math.max(160, window.innerHeight - top - viewportPadding);

      setMenuPosition({
        left,
        top,
        maxHeight,
      });
    };

    updateMenuPosition();

    const frameId = window.requestAnimationFrame(updateMenuPosition);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [
    open,
    isCreateSharedWorkspaceOpen,
    isGuest,
    latestInviteLink,
    pendingInvitations.length,
    workspaceMembers.length,
    isWorkspaceMembersLoading,
    canManageWorkspaceInvites,
    workspaceStatusMessage,
    statusMessage,
  ]);

  const handleEmailUpgrade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onUpgradeWithEmail) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required.");
      return;
    }

    setEmailError("");
    setIsEmailSubmitting(true);

    try {
      const didStart = await onUpgradeWithEmail(trimmedEmail);

      if (!didStart) {
        return;
      }

      setEmail("");
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleCreateSharedWorkspace = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onCreateSharedWorkspace) {
      return;
    }

    const didCreate = await onCreateSharedWorkspace(sharedWorkspaceName.trim());

    if (didCreate) {
      setSharedWorkspaceName("");
      setIsCreateSharedWorkspaceOpen(false);
    }
  };

  const handleCreateInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onCreateWorkspaceInvitation) {
      return;
    }

    const trimmedEmail = inviteEmail.trim();

    if (!trimmedEmail) {
      setInviteError("Email is required.");
      return;
    }

    setInviteError("");
    setCopiedInviteLink(false);
    setIsInviteSubmitting(true);

    try {
      const createdLink = await onCreateWorkspaceInvitation(trimmedEmail);

      if (!createdLink) {
        return;
      }

      setInviteEmail("");
    } finally {
      setIsInviteSubmitting(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!latestInviteLink || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(latestInviteLink);
    setCopiedInviteLink(true);
  };

  const handleMemberAction = async (member: AccountWorkspaceMember) => {
    const canRemoveMember =
      canManageWorkspaceMembers && !member.isOwner && !member.isCurrentUser && !!onRemoveWorkspaceMember;
    const canLeaveWorkspace =
      !canManageWorkspaceMembers && member.isCurrentUser && !member.isOwner && !!onLeaveSharedWorkspace;

    if (!canRemoveMember && !canLeaveWorkspace) {
      return;
    }

    setMemberActionUserId(member.id);

    try {
      if (canRemoveMember) {
        await onRemoveWorkspaceMember?.(member.id);
        return;
      }

      await onLeaveSharedWorkspace?.();
    } finally {
      setMemberActionUserId(null);
    }
  };

  return (
    <div className="relative max-w-full" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open account menu"
        className="flex max-w-full min-w-0 items-center gap-2.5 border border-border/24 bg-background/42 px-2.5 py-2 text-left transition-colors duration-300 hover:border-border/40 sm:px-3"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border/26 bg-background/68 text-[10px] font-body uppercase tracking-[0.08em] text-foreground/76">
          {canShowAvatar ? (
            <img
              src={avatarUrl ?? undefined}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            initials
          )}
        </span>
        <span className="hidden min-w-0 flex-col sm:flex">
          <span className="text-[10px] font-body uppercase tracking-[0.14em] text-muted-foreground/48">
            {toneLabel}
          </span>
          <span className="truncate font-body text-[11px] uppercase tracking-[0.12em] text-foreground/70">
            {label}
          </span>
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="fixed z-40 flex w-[min(288px,calc(100vw-24px))] flex-col overflow-hidden border border-border/24 bg-background/95 p-3.5 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.45)] backdrop-blur-[2px] sm:min-w-[240px]"
          style={
            menuPosition
              ? {
                  left: menuPosition.left,
                  top: menuPosition.top,
                  maxHeight: menuPosition.maxHeight,
                  visibility: "visible",
                }
              : { visibility: "hidden" }
          }
        >
          <div className="mb-3 border-b border-border/18 pb-3">
            <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
              {toneLabel}
            </p>
            <p className="mt-1.5 font-body text-[12px] uppercase tracking-[0.1em] text-foreground/74">
              {label}
            </p>
            {detail && (
              <p className="mt-1.5 font-body text-[12px] leading-relaxed text-muted-foreground/62">
                {detail}
              </p>
            )}
          </div>

          <div className="account-menu-scroll flex-1 overflow-y-auto overscroll-contain pr-1">

          {!isGuest && (workspaces.length > 0 || !!onCreateSharedWorkspace) && (
            <div className="mb-3 border-b border-border/18 pb-3">
              <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                Workspace
              </p>

              {(activeWorkspaceLabel || activeWorkspaceDetail || selectedWorkspace) && (
                <div className="mt-2.5 border border-border/16 bg-background/54 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-body text-[11px] uppercase tracking-[0.14em] text-foreground/74">
                        {activeWorkspaceLabel ?? selectedWorkspace?.label ?? "Workspace"}
                      </p>
                      {(activeWorkspaceDetail || selectedWorkspace?.description) && (
                        <p className="mt-1 font-body text-[12px] leading-relaxed text-muted-foreground/60">
                          {activeWorkspaceDetail ?? selectedWorkspace?.description}
                        </p>
                      )}
                    </div>
                    {selectedWorkspace && (
                      <span className="shrink-0 border border-border/18 px-2 py-1 font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/56">
                        {selectedWorkspace.isShared ? "Shared" : "Private"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {workspaces.length > 0 && (
                <label className="mt-2.5 block">
                  <span className="sr-only">Select workspace</span>
                  <select
                    aria-label="Select workspace"
                    value={activeWorkspaceId ?? ""}
                    onChange={(event) => onSelectWorkspace?.(event.target.value)}
                    className="w-full border border-border/24 bg-background/68 px-3 py-2.5 font-body text-[12px] uppercase tracking-[0.1em] text-foreground/76 outline-none transition-colors duration-300 hover:border-border/36"
                  >
                    {workspaces.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              )}

              {onCreateSharedWorkspace && (
                <div className="mt-3 border-t border-border/14 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                        Shared Workspace
                      </p>
                      <p className="mt-1 font-body text-[12px] leading-relaxed text-muted-foreground/60">
                        Create a collaborative workspace without changing your private one.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 border border-border/24 px-3 py-2 text-[10px] font-body uppercase tracking-[0.16em] text-foreground/70 transition-colors duration-300 hover:border-border/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
                      disabled={isWorkspaceActionLoading}
                      onClick={() => setIsCreateSharedWorkspaceOpen((current) => !current)}
                    >
                      {isCreateSharedWorkspaceOpen ? "Close" : "Create Shared"}
                    </button>
                  </div>

                  {isCreateSharedWorkspaceOpen && (
                    <form className="mt-2.5 flex flex-col gap-2.5" onSubmit={handleCreateSharedWorkspace}>
                      <Input
                        aria-label="Shared workspace name"
                        value={sharedWorkspaceName}
                        onChange={(event) => setSharedWorkspaceName(event.target.value)}
                        placeholder="Shared workspace name"
                        className="border-border/24 bg-background/68 text-[12px] text-foreground/76 placeholder:text-muted-foreground/36"
                        disabled={isWorkspaceActionLoading}
                      />
                      <button
                        type="submit"
                        className="w-full border border-border/24 px-3.5 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
                        disabled={isWorkspaceActionLoading}
                      >
                        {isWorkspaceActionLoading ? "Creating..." : "Create Shared Workspace"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {isActiveSharedWorkspace && (
                <div className="mt-3 border-t border-border/14 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                      Members
                    </p>
                    <span className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/44">
                      {isWorkspaceMembersLoading
                        ? "Loading"
                        : `${workspaceMembers.length} ${workspaceMembers.length === 1 ? "member" : "members"}`}
                    </span>
                  </div>

                  {isWorkspaceMembersLoading ? (
                    <p className="mt-2 font-body text-[12px] leading-relaxed text-muted-foreground/58">
                      Loading member list...
                    </p>
                  ) : workspaceMembers.length === 0 ? (
                    <p className="mt-2 font-body text-[12px] leading-relaxed text-muted-foreground/58">
                      No shared members yet.
                    </p>
                  ) : (
                    <div className="mt-2.5 space-y-2">
                      {workspaceMembers.map((member) => {
                        const canShowMemberAvatar = Boolean(member.avatarUrl);

                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between gap-3 border border-border/16 px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border/18 bg-background/68 text-[10px] font-body uppercase tracking-[0.08em] text-foreground/72">
                                {canShowMemberAvatar ? (
                                  <img
                                    src={member.avatarUrl ?? undefined}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  getInitials(member.label)
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-body text-[11px] uppercase tracking-[0.12em] text-foreground/72">
                                  {member.label}
                                </p>
                                {member.detail && (
                                  <p className="truncate font-body text-[12px] text-muted-foreground/58">
                                    {member.detail}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {member.isCurrentUser && (
                                <span className="border border-border/18 px-2 py-1 font-body text-[9px] uppercase tracking-[0.14em] text-muted-foreground/52">
                                  You
                                </span>
                              )}
                              {member.isOwner && (
                                <span className="border border-olive/18 bg-olive/7 px-2 py-1 font-body text-[9px] uppercase tracking-[0.14em] text-olive/68">
                                  Owner
                                </span>
                              )}
                              {((canManageWorkspaceMembers &&
                                !member.isOwner &&
                                !member.isCurrentUser &&
                                !!onRemoveWorkspaceMember) ||
                                (!canManageWorkspaceMembers &&
                                  member.isCurrentUser &&
                                  !member.isOwner &&
                                  !!onLeaveSharedWorkspace)) && (
                                <button
                                  type="button"
                                  className="shrink-0 text-[10px] font-body uppercase tracking-[0.14em] text-seal/68 transition-colors duration-300 hover:text-seal/82 disabled:cursor-not-allowed disabled:text-muted-foreground/34"
                                  disabled={isWorkspaceActionLoading || memberActionUserId === member.id}
                                  onClick={() => void handleMemberAction(member)}
                                >
                                  {memberActionUserId === member.id
                                    ? canManageWorkspaceMembers
                                      ? "Removing..."
                                      : "Leaving..."
                                    : canManageWorkspaceMembers
                                      ? "Remove"
                                      : "Leave"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {canManageWorkspaceInvites && (
                <div className="mt-3 border-t border-border/14 pt-3">
                  <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                    Invite
                  </p>
                  <p className="mt-1 font-body text-[12px] leading-relaxed text-muted-foreground/60">
                    Generate a link for a specific email address.
                  </p>

                  <form className="mt-2.5 flex flex-col gap-2.5" onSubmit={handleCreateInvite}>
                    <Input
                      aria-label="Invite collaborator email"
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => {
                        setInviteEmail(event.target.value);
                        if (inviteError) {
                          setInviteError("");
                        }
                      }}
                      placeholder="Collaborator email"
                      className="border-border/24 bg-background/68 text-[12px] text-foreground/76 placeholder:text-muted-foreground/36"
                      disabled={isInviteSubmitting}
                    />
                    <button
                      type="submit"
                      className="w-full border border-border/24 px-3.5 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
                      disabled={isInviteSubmitting || !onCreateWorkspaceInvitation}
                    >
                      {isInviteSubmitting ? "Creating..." : "Create Invite Link"}
                    </button>
                  </form>

                  {latestInviteLink && (
                    <div className="mt-2.5 space-y-2">
                      <Input
                        aria-label="Latest invite link"
                        value={latestInviteLink}
                        readOnly
                        className="border-border/24 bg-background/68 text-[12px] text-foreground/70"
                      />
                      <button
                        type="button"
                        className="w-full border border-border/24 px-3.5 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
                        onClick={() => void handleCopyInviteLink()}
                      >
                        {copiedInviteLink ? "Copied" : "Copy Link"}
                      </button>
                    </div>
                  )}

                  {pendingInvitations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {pendingInvitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center justify-between gap-3 border border-border/16 px-3 py-2"
                        >
                          <span className="min-w-0 truncate font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground/60">
                            {invitation.invitedEmail}
                          </span>
                          <button
                            type="button"
                            className="shrink-0 text-[10px] font-body uppercase tracking-[0.14em] text-seal/68 transition-colors duration-300 hover:text-seal/82 disabled:cursor-not-allowed disabled:text-muted-foreground/34"
                            disabled={isRevokingInviteId === invitation.id}
                            onClick={async () => {
                              if (!onRevokeWorkspaceInvitation) {
                                return;
                              }

                              setIsRevokingInviteId(invitation.id);

                              try {
                                await onRevokeWorkspaceInvitation(invitation.id);
                              } finally {
                                setIsRevokingInviteId(null);
                              }
                            }}
                          >
                            {isRevokingInviteId === invitation.id ? "Revoking..." : "Revoke"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {workspaceStatusMessage && (
                <p
                  className={`mt-2.5 font-body text-[11px] uppercase tracking-[0.12em] ${workspaceStatusClassName}`}
                >
                  {workspaceStatusMessage}
                </p>
              )}
            </div>
          )}

          {isGuest && (
            <div className="mb-3 border-b border-border/18 pb-3">
              <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                Upgrade
              </p>
              <p className="mt-1.5 font-body text-[12px] leading-relaxed text-muted-foreground/62">
                Keep this board and attach a permanent account.
              </p>

              <button
                type="button"
                className="mt-3 w-full border border-border/24 px-3.5 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
                disabled={isUpgradeBusy || isEmailSubmitting || !onUpgradeWithGoogle}
                onClick={() => void onUpgradeWithGoogle?.()}
              >
                {isUpgradeBusy ? "Preparing..." : "Upgrade with Google"}
              </button>

              <form className="mt-2.5 flex flex-col gap-2.5" onSubmit={handleEmailUpgrade}>
                <Input
                  aria-label="Upgrade guest account email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) {
                      setEmailError("");
                    }
                  }}
                  placeholder="Email address"
                  className="border-border/24 bg-background/68 text-[12px] text-foreground/76 placeholder:text-muted-foreground/36"
                  disabled={isUpgradeBusy || isEmailSubmitting}
                />
                <button
                  type="submit"
                  className="w-full border border-border/24 px-3.5 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
                  disabled={isUpgradeBusy || isEmailSubmitting || !onUpgradeWithEmail}
                >
                  {isEmailSubmitting ? "Sending..." : "Upgrade with Email"}
                </button>
              </form>

              {statusMessage && (
                <p className={`mt-2.5 font-body text-[11px] uppercase tracking-[0.12em] ${statusClassName}`}>
                  {statusMessage}
                </p>
              )}
            </div>
          )}

          </div>

          <button
            type="button"
            className="mt-3 w-full shrink-0 border border-border/24 px-3.5 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
            disabled={
              isSigningOut ||
              isUpgradeBusy ||
              isEmailSubmitting ||
              isInviteSubmitting ||
              isWorkspaceActionLoading
            }
            onClick={async () => {
              setIsSigningOut(true);

              try {
                await onSignOut();
              } finally {
                setIsSigningOut(false);
                setOpen(false);
              }
            }}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
