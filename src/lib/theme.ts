export function isLightColor(hex: string): boolean {
  const h = (hex || "").replace("#", "").trim();
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
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55;
}

export function themeFromEst(est?: {
  primaryColor?: string | null;
  bgColor?: string | null;
  cardColor?: string | null;
} | null) {
  const primary = normalizeHex(est?.primaryColor) || "#d4a017";
  const bg = normalizeHex(est?.bgColor) || "#0f0f0f";
  const card = normalizeHex(est?.cardColor) || "#1a1a1a";
  const lightBg = isLightColor(bg);
  const lightCard = isLightColor(card);
  const lightPrimary = isLightColor(primary);

  const header = lightBg
    ? mixToward(bg, "#ffffff", 0.5)
    : mixToward(bg, "#000000", 0.4);
  const headerFg = isLightColor(header) ? "#111111" : "#f5f5f5";
  const sidebar = lightBg
    ? mixToward(card, "#ffffff", 0.15)
    : mixToward(card, "#000000", 0.2);

  return {
    "--primary": primary,
    "--bg": bg,
    "--card": card,
    "--fg": lightBg ? "#111111" : "#f5f5f5",
    "--muted": lightBg ? "#e8eaed" : "#262626",
    "--border": lightBg ? "#d1d5db" : "#333333",
    "--primary-fg": lightPrimary ? "#111111" : "#ffffff",
    "--card-fg": lightCard ? "#111111" : "#f5f5f5",
    "--muted-fg": lightBg || lightCard ? "#525252" : "#a3a3a3",
    "--header": header,
    "--header-fg": headerFg,
    "--footer": header,
    "--sidebar": sidebar,
    "--ring": primary,
  } as Record<string, string>;
}

/** Tema do painel: fundo escuro legível + cor principal do estabelecimento */
export function adminThemeFromEst(est?: {
  primaryColor?: string | null;
} | null) {
  const primary = normalizeHex(est?.primaryColor) || "#d4a017";
  const lightPrimary = isLightColor(primary);
  return {
    "--primary": primary,
    "--primary-fg": lightPrimary ? "#111111" : "#0f0f0f",
    "--bg": "#0c0c0c",
    "--fg": "#f5f5f5",
    "--card": "#161616",
    "--card-fg": "#f5f5f5",
    "--muted": "#242424",
    "--muted-fg": "#a3a3a3",
    "--border": "#333333",
    "--header": "#0c0c0c",
    "--header-fg": "#f5f5f5",
    "--footer": "#0c0c0c",
    "--sidebar": "#121212",
    "--ring": primary,
  } as Record<string, string>;
}

function normalizeHex(hex?: string | null): string | null {
  if (!hex) return null;
  let h = hex.trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) return null;
  return h.toLowerCase();
}

function mixToward(hex: string, toward: string, amount: number): string {
  const a = parseHex(hex);
  const b = parseHex(toward);
  if (!a || !b) return hex;
  const r = Math.round(a[0] + (b[0] - a[0]) * amount);
  const g = Math.round(a[1] + (b[1] - a[1]) * amount);
  const bl = Math.round(a[2] + (b[2] - a[2]) * amount);
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (full.length !== 6) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(n: number) {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
}
