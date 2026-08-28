import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext, useTheme } from "@/hooks/useTheme";
import { useCurrentUser } from "@/hooks/useAuth";
import { applyTheme, isThemeId, readStoredTheme, type ThemeId } from "@/theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);
  const setTheme = useCallback((id: ThemeId) => {
    applyTheme(id);
    setThemeState(id);
  }, []);
  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeSync() {
  const user = useCurrentUser();
  const { setTheme } = useTheme();
  useEffect(() => {
    if (isThemeId(user.data?.theme)) {
      setTheme(user.data.theme);
    }
  }, [setTheme, user.data?.theme]);
  return null;
}
