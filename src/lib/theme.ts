export function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6 && h.length !== 3) return false;
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // perceived luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62;
}

export function themeFromEst(est?: {
  primaryColor?: string | null;
  bgColor?: string | null;
  cardColor?: string | null;
} | null) {
  const primary = est?.primaryColor || "#d4a017";
  const bg = est?.bgColor || "#0f0f0f";
  const card = est?.cardColor || "#1a1a1a";
  const lightBg = isLightColor(bg);
  const lightCard = isLightColor(card);
  return {
    "--primary": primary,
    "--bg": bg,
    "--card": card,
    "--fg": lightBg ? "#111111" : "#f5f5f5",
    "--muted": lightBg ? "#eef0f3" : "#262626",
    "--border": lightBg ? "#e5e7eb" : "#333333",
    "--primary-fg": isLightColor(primary) ? "#111111" : "#0f0f0f",
    "--card-fg": lightCard ? "#111111" : "#f5f5f5",
    "--muted-fg": lightCard || lightBg ? "#525252" : "#a3a3a3",
  } as Record<string, string>;
}
