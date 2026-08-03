"use client";

import { useLayoutEffect } from "react";
import { applyThemeData, getInitialTheme, persistTheme } from "@/theme";

export function ThemePersistence() {
  useLayoutEffect(() => {
    const theme = getInitialTheme(window.location.search);
    applyThemeData(theme);
    persistTheme(theme);
  }, []);

  return null;
}
