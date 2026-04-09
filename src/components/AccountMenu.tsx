import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type FeedbackTone = "success" | "error" | "info" | null;

export interface AccountWorkspaceOption {
  id: string;
  label: string;
}

export interface AccountWorkspaceInvitation {
  id: string;
  invitedEmail: string;
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
  workspaces?: AccountWorkspaceOption[];
  workspaceFeedback?: string | null;
  workspaceFeedbackTone?: FeedbackTone;
  latestInviteLink?: string | null;
  pendingInvitations?: AccountWorkspaceInvitation[];
  canManageWorkspaceInvites?: boolean;
  onSelectWorkspace?: (workspaceId: string) => void;
  onCreateWorkspaceInvitation?: (email: string) => Promise<string | null>;
  onRevokeWorkspaceInvitation?: (invitationId: string) => Promise<void> | void;
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
  workspaces = [],
  workspaceFeedback = null,
  workspaceFeedbackTone = null,
  latestInviteLink = null,
  pendingInvitations = [],
  canManageWorkspaceInvites = false,
  onSelectWorkspace,
  onCreateWorkspaceInvitation,
  onRevokeWorkspaceInvitation,
  onSignOut,
}: AccountMenuProps) => {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isInviteSubmitting, setIsInviteSubmitting] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [isRevokingInviteId, setIsRevokingInviteId] = useState<string | null>(null);
  const [mobileMenuPosition, setMobileMenuPosition] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initials = useMemo(() => getInitials(label || (isGuest ? "Guest" : "User")), [isGuest, label]);
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
      setMobileMenuPosition(null);
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

    const updateMobileMenuPosition = () => {
      if (!buttonRef.current || window.innerWidth >= 640) {
        setMobileMenuPosition(null);
        return;
      }

      const viewportPadding = 12;
      const desiredWidth = Math.min(256, window.innerWidth - viewportPadding * 2);
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 0;
      const left = Math.min(
        window.innerWidth - viewportPadding - desiredWidth,
        Math.max(viewportPadding, buttonRect.right - desiredWidth),
      );
      const preferredTop = buttonRect.bottom + 8;
      const top = menuHeight
        ? Math.max(
            viewportPadding,
            Math.min(preferredTop, window.innerHeight - viewportPadding - menuHeight),
          )
        : preferredTop;

      setMobileMenuPosition({
        left,
        top,
        width: desiredWidth,
      });
    };

    updateMobileMenuPosition();

    const frameId = window.requestAnimationFrame(updateMobileMenuPosition);
    window.addEventListener("resize", updateMobileMenuPosition);
    window.addEventListener("scroll", updateMobileMenuPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateMobileMenuPosition);
      window.removeEventListener("scroll", updateMobileMenuPosition, true);
    };
  }, [open]);

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
          className="fixed z-40 border border-border/24 bg-background/95 p-3.5 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.45)] backdrop-blur-[2px] sm:absolute sm:right-0 sm:top-[calc(100%+8px)] sm:min-w-[240px] sm:w-auto"
          style={
            mobileMenuPosition
              ? {
                  left: mobileMenuPosition.left,
                  top: mobileMenuPosition.top,
                  width: mobileMenuPosition.width,
                }
              : undefined
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

          {!isGuest && workspaces.length > 0 && (
            <div className="mb-3 border-b border-border/18 pb-3">
              <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                Workspace
              </p>

              <label className="mt-2.5 block">
                <span className="sr-only">Select workspace</span>
                <select
                  aria-label="Select workspace"
                  value={activeWorkspaceId ?? ""}
                  onChange={(event) => onSelectWorkspace?.(event.target.value)}
                  className="w-full border border-border/24 bg-background/68 px-3 py-2.5 font-body text-[12px] uppercase tracking-[0.1em] text-foreground/76 outline-none transition-colors duration-300 hover:border-border/36"
                >
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {!isGuest && canManageWorkspaceInvites && (
            <div className="mb-3 border-b border-border/18 pb-3">
              <p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
                Invite
              </p>
              <p className="mt-1.5 font-body text-[12px] leading-relaxed text-muted-foreground/62">
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

          <button
            type="button"
            className="w-full border border-border/24 px-3.5 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
            disabled={isSigningOut || isUpgradeBusy || isEmailSubmitting || isInviteSubmitting}
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
