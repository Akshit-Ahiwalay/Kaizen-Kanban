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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initials = useMemo(() => getInitials(label || (isGuest ? "Guest" : "User")), [isGuest, label]);
  const toneLabel = isGuest ? "Guest" : "Account";
  const canShowAvatar = Boolean(avatarUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!open) {
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Open account menu"
        className="flex items-center gap-2.5 border border-border/24 bg-background/42 px-3 py-2 text-left transition-colors duration-300 hover:border-border/40"
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
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[240px] border border-border/24 bg-background/95 p-3.5 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.45)] backdrop-blur-[2px]">
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
