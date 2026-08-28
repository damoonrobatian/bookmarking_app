export const THEME_STORAGE_KEY = "neshanak-theme";

export const THEME_IDS = ["terracotta", "gray", "teal", "green", "purple", "blue"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "terracotta";

export const THEMES: Array<{ id: ThemeId; label: string; logo: string }> = [
  { id: "terracotta", label: "Terracotta", logo: "/themes/terracotta.png" },
  { id: "gray", label: "Gray", logo: "/themes/gray.png" },
  { id: "teal", label: "Teal", logo: "/themes/teal.png" },
  { id: "green", label: "Green", logo: "/themes/green.png" },
  { id: "purple", label: "Purple", logo: "/themes/purple.png" },
  { id: "blue", label: "Blue", logo: "/themes/blue.png" },
];

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function themeLogo(id: ThemeId): string {
  return THEMES.find((item) => item.id === id)?.logo ?? "/themes/terracotta.png";
}

export function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}

export function applyStoredTheme(): void {
  applyTheme(readStoredTheme());
}
