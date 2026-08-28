import { isThemeId, readStoredTheme, THEME_STORAGE_KEY } from "@/theme";

describe("theme ids", () => {
  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
  });

  it("accepts the six named palettes", () => {
    expect(isThemeId("teal")).toBe(true);
    expect(isThemeId("neon")).toBe(false);
  });

  it("falls back to terracotta when storage is empty", () => {
    expect(readStoredTheme()).toBe("terracotta");
  });
});
