import { useState } from "react";
import EnterButton from "./EnterButton";

interface LandingAuthPanelProps {
  canUseSupabase: boolean;
  hasSession: boolean;
  isGuestSession: boolean;
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
      <div className="flex flex-col items-center gap-3.5">
        <EnterButton onClick={onEnter} />
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-muted-foreground/46">
          Local board
        </p>
      </div>
    );
  }

  if (hasSession) {
    return (
      <div className="flex flex-col items-center gap-3">
        <EnterButton onClick={onEnter} disabled={isBusy} />
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-muted-foreground/46">
          {isGuestSession ? "Guest access ready" : "Signed in"}
        </p>
        {accountLabel && !isGuestSession && (
          <p className="font-body text-[13px] text-muted-foreground/62">
            {accountLabel}
          </p>
        )}
        {statusMessage && (
          <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground/48">
            {statusMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[25rem] flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-3">
        <EnterButton onClick={() => void onContinueAsGuest()} disabled={isBusy || isSendingLink} />
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-muted-foreground/46">
          Continue as guest
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 border border-border/22 bg-background/42 px-5 py-5">
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-muted-foreground/44">
          Or sign in
        </p>
        <button
          type="button"
          className="border border-border/30 px-4 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/74 transition-all duration-300 hover:border-border/50 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
          onClick={() => void onContinueWithGoogle()}
          disabled={isBusy || isSendingLink}
        >
          Continue with Google
        </button>

        <form className="flex flex-col gap-2.5" onSubmit={handleSendMagicLink}>
          <input
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
            className="w-full border border-border/26 bg-background/58 px-3.5 py-2.5 font-body text-[14px] text-foreground/82 outline-none placeholder:text-muted-foreground/42 focus:border-border/50"
            disabled={isBusy || isSendingLink}
          />
          <button
            type="submit"
            className="border border-border/26 px-4 py-2.5 text-[11px] font-body uppercase tracking-[0.16em] text-foreground/72 transition-all duration-300 hover:border-border/46 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/16 disabled:text-muted-foreground/32"
            disabled={isBusy || isSendingLink}
          >
            {isSendingLink ? "Sending..." : "Email me a magic link"}
          </button>
        </form>
      </div>

      {statusMessage && (
        <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground/48">
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export default LandingAuthPanel;
