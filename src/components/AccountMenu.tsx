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
        className="flex items-center gap-2 border border-border/22 bg-background/40 px-2.5 py-1.5 text-left transition-colors duration-300 hover:border-border/38"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-border/24 bg-background/65 text-[10px] font-body uppercase tracking-[0.08em] text-foreground/72">
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
          <span className="text-[9px] font-body uppercase tracking-[0.16em] text-muted-foreground/44">
            {toneLabel}
          </span>
          <span className="truncate font-body text-[10px] uppercase tracking-[0.14em] text-foreground/64">
            {label}
          </span>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[220px] border border-border/22 bg-background/95 p-3 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.45)] backdrop-blur-[2px]">
          <div className="mb-3 border-b border-border/16 pb-3">
            <p className="font-body text-[10px] uppercase tracking-[0.16em] text-muted-foreground/48">
              {toneLabel}
            </p>
            <p className="mt-1 font-body text-[11px] uppercase tracking-[0.12em] text-foreground/68">
              {label}
            </p>
            {detail && (
              <p className="mt-1 font-body text-[11px] text-muted-foreground/56">
                {detail}
              </p>
            )}
          </div>

          <button
            type="button"
            className="w-full border border-border/22 px-3 py-2 text-[10px] font-body uppercase tracking-[0.18em] text-foreground/68 transition-all duration-300 hover:border-border/38 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
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
