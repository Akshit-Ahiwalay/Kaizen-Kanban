import { useState, useCallback } from "react";
import LandingScreen from "@/components/LandingScreen";
import BoardScene from "@/components/BoardScene";

type AppState = "landing" | "revealing" | "board";

const Index = () => {
  const [state, setState] = useState<AppState>("landing");

  const handleEnter = useCallback(() => {
    setState("revealing");
  }, []);

  const handleRevealComplete = useCallback(() => {
    setState("board");
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Board is always mounted underneath */}
      <div className="absolute inset-0 z-10">
        <BoardScene isActive={state !== "landing"} />
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
