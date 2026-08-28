import { createContext, useContext } from "react";
import { applyTheme, DEFAULT_THEME, type ThemeId } from "@/theme";

export type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: applyTheme,
});

export function useTheme() {
  return useContext(ThemeContext);
}
