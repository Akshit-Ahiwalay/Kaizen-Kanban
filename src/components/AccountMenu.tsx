import { useEffect, useMemo, useRef, useState } from "react";

interface AccountMenuProps {
  label: string;
  detail?: string | null;
  avatarUrl?: string | null;
  isGuest?: boolean;
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
  onSignOut,
}: AccountMenuProps) => {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
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

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

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

          <button
            type="button"
            className="w-full border border-border/24 px-3.5 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/40 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
            disabled={isSigningOut}
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
