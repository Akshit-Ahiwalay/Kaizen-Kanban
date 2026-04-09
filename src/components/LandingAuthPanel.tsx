import { useState } from "react";
import EnterButton from "./EnterButton";
import { Input } from "@/components/ui/input";

interface LandingAuthPanelProps {
  canUseSupabase: boolean;
  hasSession: boolean;
  isGuestSession: boolean;
  requiresPermanentAccount?: boolean;
  accountLabel?: string | null;
  feedback?: string | null;
  isBusy?: boolean;
  onEnter: () => void;
  onContinueAsGuest: () => Promise<void> | void;
  onContinueWithGoogle: () => Promise<void> | void;
  onSendMagicLink: (email: string) => Promise<boolean>;
}

const LandingAuthPanel = ({
  canUseSupabase,
  hasSession,
  isGuestSession,
  requiresPermanentAccount = false,
  accountLabel,
  feedback = null,
  isBusy = false,
  onEnter,
  onContinueAsGuest,
  onContinueWithGoogle,
  onSendMagicLink,
}: LandingAuthPanelProps) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSendingLink, setIsSendingLink] = useState(false);
  const statusMessage = emailError || feedback;

  const handleSendMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required.");
      return;
    }

    setEmailError("");
    setIsSendingLink(true);

    const didSend = await onSendMagicLink(trimmedEmail);

    setIsSendingLink(false);

    if (!didSend) {
      setEmailError("Magic link issue");
      return;
    }

    setEmail("");
  };

  if (!canUseSupabase) {
    return (
      <div className="flex w-full max-w-[26.5rem] justify-center">
        <div className="flex w-full max-w-[23rem] flex-col items-center gap-3.5 border border-border/18 bg-[hsl(var(--background)/0.42)] px-5 py-5 text-center shadow-[inset_0_1px_0_hsl(var(--background)/0.54)] sm:px-6 sm:py-6">
          <EnterButton onClick={onEnter} />
          <p className="font-body text-[11px] uppercase tracking-[0.16em] text-muted-foreground/46">
            Local board
          </p>
        </div>
      </div>
    );
  }

  if (hasSession && !(isGuestSession && requiresPermanentAccount)) {
    return (
      <div className="flex w-full max-w-[26.5rem] justify-center">
        <div className="flex w-full max-w-[23rem] flex-col items-center gap-3.5 border border-border/18 bg-[hsl(var(--background)/0.42)] px-5 py-5 text-center shadow-[inset_0_1px_0_hsl(var(--background)/0.54)] sm:px-6 sm:py-6">
          <EnterButton onClick={onEnter} disabled={isBusy} />
          <p className="font-body text-[11px] uppercase tracking-[0.16em] text-muted-foreground/46">
            {isGuestSession ? "Guest access ready" : "Signed in"}
          </p>
          {accountLabel && !isGuestSession && (
            <p className="max-w-[18rem] break-words font-body text-[13px] leading-relaxed text-muted-foreground/62">
              {accountLabel}
            </p>
          )}
          {statusMessage && (
            <p className="max-w-[19rem] break-words font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground/48">
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[26.5rem] flex-col items-center gap-3 sm:gap-4">
      {!requiresPermanentAccount && (
        <div className="flex w-full flex-col items-center gap-3 border border-border/18 bg-[hsl(var(--background)/0.38)] px-5 py-5 text-center shadow-[inset_0_1px_0_hsl(var(--background)/0.54)] sm:gap-3.5 sm:px-6 sm:py-6">
          <EnterButton onClick={() => void onContinueAsGuest()} disabled={isBusy || isSendingLink} />
          <p className="font-body text-[11px] uppercase tracking-[0.16em] text-muted-foreground/46">
            Continue as guest
          </p>
          <p className="max-w-[18rem] font-body text-[13px] leading-relaxed text-muted-foreground/58">
            Open the board immediately with local persistence and the full task flow.
          </p>
        </div>
      )}

      <div className="flex w-full flex-col gap-3.5 border border-border/20 bg-[hsl(var(--background)/0.46)] px-5 py-5 shadow-[inset_0_1px_0_hsl(var(--background)/0.56)] sm:gap-4 sm:px-6 sm:py-6">
        <div className="space-y-1 text-center sm:space-y-1.5">
          <p className="font-body text-[11px] uppercase tracking-[0.16em] text-muted-foreground/44">
            {requiresPermanentAccount ? "Sign in to accept invite" : "Or sign in"}
          </p>
          <p className="mx-auto max-w-[18rem] font-body text-[13px] leading-relaxed text-muted-foreground/58">
            {requiresPermanentAccount
              ? "Use Google or a magic link with the invited email address."
              : "Sync your board with Google or a magic link."}
          </p>
        </div>

        <button
          type="button"
          className="min-h-11 border border-border/30 bg-[hsl(var(--background)/0.42)] px-4 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/74 transition-all duration-300 hover:border-border/50 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
          onClick={() => void onContinueWithGoogle()}
          disabled={isBusy || isSendingLink}
        >
          Continue with Google
        </button>

        <form className="flex flex-col gap-2.5 sm:gap-3" onSubmit={handleSendMagicLink}>
          <Input
            aria-label="Email for magic link"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) {
                setEmailError("");
              }
            }}
            placeholder="Email address"
            disabled={isBusy || isSendingLink}
          />
          <button
            type="submit"
            className="min-h-11 border border-border/26 bg-[hsl(var(--background)/0.42)] px-4 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/46 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
            disabled={isBusy || isSendingLink}
          >
            {isSendingLink ? "Sending..." : "Email me a magic link"}
          </button>
        </form>
      </div>

      {statusMessage && (
        <p className="max-w-[19rem] px-2 text-center font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground/48">
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export default LandingAuthPanel;
