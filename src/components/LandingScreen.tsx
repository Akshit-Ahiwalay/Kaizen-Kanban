import { motion } from "framer-motion";
import LandingAuthPanel from "./LandingAuthPanel";

interface LandingScreenProps {
  onEnter: () => void;
  canUseSupabase: boolean;
  hasSession: boolean;
  isGuestSession: boolean;
  accountLabel?: string | null;
  authFeedback?: string | null;
  isAuthBusy?: boolean;
  onContinueAsGuest: () => Promise<void> | void;
  onContinueWithGoogle: () => Promise<void> | void;
  onSendMagicLink: (email: string) => Promise<boolean>;
}

const LandingScreen = ({
  onEnter,
  canUseSupabase,
  hasSession,
  isGuestSession,
  accountLabel = null,
  authFeedback = null,
  isAuthBusy = false,
  onContinueAsGuest,
  onContinueWithGoogle,
  onSendMagicLink,
}: LandingScreenProps) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-background relative">
      {/* Main calligraphy composition */}
      <motion.div
        className="flex flex-col items-center gap-11 px-4 sm:gap-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Vertical Japanese calligraphy — native text, no image */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="font-display text-foreground select-none"
            style={{
              writingMode: "vertical-rl",
              fontSize: "clamp(100px, 14vw, 160px)",
              lineHeight: 1.1,
              letterSpacing: "0.05em",
              fontWeight: 400,
              mixBlendMode: "multiply",
            }}
          >
            改善
          </div>

          {/* Red seal / hanko mark */}
          <svg
            className="absolute -bottom-3 -right-5"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
          >
            <rect
              x="2"
              y="2"
              width="24"
              height="24"
              rx="2"
              stroke="hsl(var(--seal))"
              strokeWidth="1.5"
              fill="hsl(var(--seal) / 0.08)"
            />
            <text
              x="14"
              y="17"
              textAnchor="middle"
              fontSize="10"
              fontFamily="'Noto Serif JP', serif"
              fill="hsl(var(--seal))"
            >
              禅
            </text>
          </svg>
        </motion.div>

        {/* Subtle divider */}
        <motion.div
          className="w-12 h-px bg-foreground/15"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        />

        {/* Auth surface */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <LandingAuthPanel
            canUseSupabase={canUseSupabase}
            hasSession={hasSession}
            isGuestSession={isGuestSession}
            accountLabel={accountLabel}
            feedback={authFeedback}
            isBusy={isAuthBusy}
            onEnter={onEnter}
            onContinueAsGuest={onContinueAsGuest}
            onContinueWithGoogle={onContinueWithGoogle}
            onSendMagicLink={onSendMagicLink}
          />
        </motion.div>
      </motion.div>

      {/* Bottom subtle text */}
      <motion.div
        className="absolute bottom-10 font-display text-[10px] tracking-[0.5em] text-muted-foreground/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      >
        改善
      </motion.div>
    </div>
  );
};

export default LandingScreen;
