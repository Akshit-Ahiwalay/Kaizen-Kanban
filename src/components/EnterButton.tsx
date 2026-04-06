import { useState } from "react";

interface EnterButtonProps {
  onClick: () => void;
}

const SPRITE_URL =
  "https://raw.githubusercontent.com/robin-dela/css-mask-animation/master/img/urban-sprite.png";
const STEPS = 29;

const EnterButton = ({ onClick }: EnterButtonProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative overflow-hidden border border-foreground/10"
      style={{ width: 140, height: 48 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Static label underneath */}
      <span className="absolute inset-0 flex items-center justify-center font-display text-xs tracking-[0.3em] text-foreground pointer-events-none z-0">
        開始
      </span>

      {/* Mask-animated fill layer */}
      <button
        onClick={onClick}
        className="relative z-10 w-full h-full cursor-pointer border-none font-display text-xs tracking-[0.3em] text-primary-foreground"
        style={{
          background: "hsl(var(--foreground))",
          WebkitMask: `url(${SPRITE_URL})`,
          mask: `url(${SPRITE_URL})`,
          WebkitMaskSize: `${STEPS * 100 + 100}% 100%`,
          maskSize: `${STEPS * 100 + 100}% 100%`,
          animation: hovered
            ? `mask-reveal 0.7s steps(${STEPS}) forwards`
            : `mask-hide 0.7s steps(${STEPS}) forwards`,
        }}
      >
        開始
      </button>
    </div>
  );
};

export default EnterButton;
