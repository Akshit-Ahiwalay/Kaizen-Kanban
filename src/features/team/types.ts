export const TEAM_MEMBER_COLORS = [
  "#7f5347",
  "#8d6f3b",
  "#58644b",
  "#4c6670",
  "#6a5873",
  "#8a5a67",
] as const;

export const DEFAULT_TEAM_MEMBER_COLOR = TEAM_MEMBER_COLORS[0];

export const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const withAlpha = (color: string, alphaHex: string) => {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return `${color}${alphaHex}`;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const expanded = color
      .slice(1)
      .split("")
      .map((value) => `${value}${value}`)
      .join("");

    return `#${expanded}${alphaHex}`;
  }

  return color;
};
