

# Kaizen Refinement Plan

## Three Problems to Fix

1. **Japanese title** renders as a rectangular image block with a white background instead of blending into the page
2. **Transition** uses `bg-foreground` (ink black) overlays that create a black screen effect — not a true reveal
3. **Board** is a generic horizontal dashboard layout, not the art-directed composition with red sun / samurai / central axis

---

## A. Landing Page — Replace Image with Native Text + SVG Seal

**File: `src/components/LandingScreen.tsx`**

- Remove the `kaizen-calligraphy.png` import entirely
- Replace with large Noto Serif JP text rendering of 改善 styled vertically (two characters stacked using `writing-mode: vertical-rl` or two separate lines)
- Style: `font-display`, very large size (~120-160px), ink color, `mix-blend-mode: multiply` so it sits naturally on the paper
- Add a small inline SVG red seal/stamp mark (a simple circle or hanko shape) positioned near the bottom-right of the characters
- Keep the subtle divider line and EnterButton below
- Keep bottom 改善 tiny text
- Result: text is native to the page, no rectangular artifact

## B. Button — Minor Refinements

**File: `src/components/EnterButton.tsx`**

- Keep the mask-animation approach (it works)
- Reduce border opacity slightly for a softer edge
- Ensure the font styling matches the overall display font
- No structural changes needed

## C. Transition — Architectural Fix (Most Important)

**File: `src/pages/Index.tsx`**

Current problem: The `BrushTransition` uses `bg-foreground` (black) for all overlay layers. It covers the screen in black, then reveals by scaling away. This creates a "black screen" effect.

**Fix the architecture:**
- State: `landing` | `revealing` | `board`
- Always render the BoardScene at `z-10` (behind everything)
- Render LandingScreen at `z-30` (on top)
- On click: set state to `revealing`
- The transition works by **removing the landing screen** via a clip-path / mask animation, progressively exposing the board underneath
- No black overlay at all

**File: `src/components/BrushTransition.tsx` → rename to `BrushRevealTransition.tsx`**

New approach — instead of black overlays sweeping across, apply an animated `clip-path` to the **LandingScreen itself** so it gets "wiped away" to reveal the board:

- The LandingScreen wrapper gets a `clip-path` that animates from `inset(0 0 0 0)` (full visible) to `inset(0 0 0 100%)` (fully clipped away from the left)
- Use multiple staggered layers for organic feel:
  - Main wipe uses a polygon clip-path with slight angle for organic edge
  - A secondary overlay in paper color (not black!) sweeps briefly to add texture
- The board is always visible underneath, so as the landing clips away, the board is progressively revealed
- After animation completes → set state to `board`, unmount landing

**Key change**: No `bg-foreground` (black) overlays. The reveal works by clipping/masking the **landing page away**, not by painting black on top.

Alternative approach if clip-path on the landing feels limited: use a paper-colored overlay (same `bg-background`) that sweeps across carrying ink-like edge textures via SVG mask or gradient masks. This still avoids the black screen.

## D. Board — Art-Directed Composition

**File: `src/components/KanbanBoard.tsx` → refactor to `BoardScene.tsx`**

Replace the generic header + horizontal columns layout with:

1. **Background layer**: Full-screen paper background (same as landing)
2. **Red sun**: A small red circle (`bg-seal`, ~40-50px diameter) centered horizontally, positioned near the top (~8-10% from top)
3. **Vertical red line**: A 1px wide red line (`bg-seal/40`) descending from the sun toward center, maybe 30-40vh tall
4. **Samurai silhouette**: An inline SVG silhouette of a samurai figure, centered horizontally, anchored near the bottom (~15% from bottom), rendered in `ink/10` (very subtle)
5. **Kanban columns**: Four columns arranged across the full width, overlaid on this composition. Columns use thin vertical dividers (`border-border/15`), with generous padding. Column headers are tiny uppercase labels. Cards float within.

**File: `src/components/BoardHeader.tsx`**

- Simplify drastically: remove the horizontal bar style
- Place a tiny 改善 mark in the top-left corner
- Place a single "+" icon button in the top-right
- No search field by default, maybe just a subtle search icon
- Make it feel like floating controls, not a navbar

**File: `src/components/TaskCard.tsx`**

- Keep current design mostly (it's already minimal)
- Slightly refine: reduce card background opacity, make borders even subtler
- Remove the Check icon import — use a tiny dot or nothing for done state

**File: `src/components/KanbanColumn.tsx`**

- Keep structure but adjust spacing to feel more architectural
- Remove the "···" button
- Make column headers even more subtle

## E. New SVG Assets (Inline)

- **Samurai silhouette**: Create as an inline SVG component (`SamuraiSilhouette.tsx`) — a simple silhouette path of a samurai figure, minimal detail, rendered in very low opacity ink
- **Red seal mark**: Simple inline SVG for the landing page hanko stamp

## F. Files Summary

| File | Action |
|------|--------|
| `src/pages/Index.tsx` | Rewrite state flow, always mount board, clip-path reveal on landing |
| `src/components/LandingScreen.tsx` | Replace PNG with native text + SVG seal |
| `src/components/BrushTransition.tsx` → `BrushRevealTransition.tsx` | Rewrite: clip-path wipe on landing, no black overlays |
| `src/components/KanbanBoard.tsx` → `src/components/BoardScene.tsx` | Art-directed layout with sun, line, samurai, overlaid columns |
| `src/components/BoardHeader.tsx` | Simplify to floating minimal controls |
| `src/components/KanbanColumn.tsx` | Refine spacing, remove clutter |
| `src/components/TaskCard.tsx` | Minor refinement |
| `src/components/SamuraiSilhouette.tsx` | New: inline SVG component |
| `src/components/EnterButton.tsx` | Minor styling tweaks |

No changes to `index.css`, `tailwind.config.ts`, or `App.tsx`.

