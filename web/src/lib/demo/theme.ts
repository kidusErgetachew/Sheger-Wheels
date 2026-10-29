"use client";

import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "./storage";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "sw_theme_v1";
export const THEME_CHANGE_EVENT = "sw:theme-change";

const VALID_THEMES: Theme[] = ["light", "dark", "system"];

/**
 * Safely reads the user's saved theme from localStorage, falling back to "system".
 */
export function getStoredTheme(): Theme {
  const result = readStorage<Theme>(THEME_STORAGE_KEY, "system");
  if (!result.ok || !VALID_THEMES.includes(result.value)) {
    return "system";
  }
  return result.value;
}

/**
 * Checks the user's OS / browser color scheme preference.
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Resolves "system" to actual "light" or "dark".
 */
export function getResolvedTheme(theme: Theme = getStoredTheme()): ResolvedTheme {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Applies the resolved theme to document.documentElement (data-theme attribute and colorScheme style).
 */
export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = getResolvedTheme(theme);
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.style.colorScheme = resolved;
  }
  return resolved;
}

/**
 * Sets a new theme, persists to localStorage, applies to DOM, and notifies listeners.
 */
export function setTheme(theme: Theme): ResolvedTheme {
  const safeTheme: Theme = VALID_THEMES.includes(theme) ? theme : "system";
  writeStorage(THEME_STORAGE_KEY, safeTheme);
  const resolved = applyTheme(safeTheme);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: { theme: safeTheme, resolvedTheme: resolved },
      }),
    );
  }

  return resolved;
}

/**
 * Toggles between light and dark themes.
 */
export function toggleTheme(): ResolvedTheme {
  const currentResolved = getResolvedTheme();
  const nextTheme: Theme = currentResolved === "dark" ? "light" : "dark";
  return setTheme(nextTheme);
}

function subscribeTheme(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = () => callback();
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === null || e.key === THEME_STORAGE_KEY) {
      applyTheme(getStoredTheme());
      callback();
    }
  };

  window.addEventListener(THEME_CHANGE_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  let mql: MediaQueryList | null = null;
  const handleMediaChange = () => {
    if (getStoredTheme() === "system") {
      applyTheme("system");
      callback();
    }
  };

  if (window.matchMedia) {
    mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", handleMediaChange);
  }

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
    if (mql) {
      mql.removeEventListener("change", handleMediaChange);
    }
  };
}

function getThemeSnapshot(): string {
  if (typeof window === "undefined") {
    return JSON.stringify({ theme: "system", resolvedTheme: "light" });
  }
  const theme = getStoredTheme();
  const resolvedTheme = getResolvedTheme(theme);
  return JSON.stringify({ theme, resolvedTheme });
}

function getServerThemeSnapshot(): string {
  return JSON.stringify({ theme: "system", resolvedTheme: "light" });
}

/**
 * Reactive hook for theme management and synchronization.
 */
export function useTheme() {
  const serialized = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  let parsed: { theme: Theme; resolvedTheme: ResolvedTheme } = {
    theme: "system",
    resolvedTheme: "light",
  };

  try {
    parsed = JSON.parse(serialized);
  } catch {
    parsed = { theme: "system", resolvedTheme: "light" };
  }

  return {
    theme: parsed.theme,
    resolvedTheme: parsed.resolvedTheme,
    isDark: parsed.resolvedTheme === "dark",
    setTheme: (newTheme: Theme) => setTheme(newTheme),
    toggleTheme: () => toggleTheme(),
  };
}

