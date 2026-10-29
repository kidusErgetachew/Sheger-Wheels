import test from "node:test";
import assert from "node:assert/strict";
import { setupMockBrowserEnvironment } from "./setup-mock-browser";
import {
  getStoredTheme,
  getResolvedTheme,
  setTheme,
  toggleTheme,
  applyTheme,
  THEME_STORAGE_KEY,
  THEME_CHANGE_EVENT,
} from "../src/lib/demo/theme";

test("Theme System: default fallback and resolution", () => {
  const env = setupMockBrowserEnvironment();

  // 1. Initial default is "system", resolving to "light" by default
  assert.equal(getStoredTheme(), "system");
  assert.equal(getResolvedTheme(), "light");

  // 2. Initial document attribute
  applyTheme("system");
  assert.equal(globalThis.document.documentElement.getAttribute("data-theme"), "light");
  assert.equal(globalThis.document.documentElement.style.colorScheme, "light");

  env.reset();
});

test("Theme System: explicit theme switching and persistence", () => {
  const env = setupMockBrowserEnvironment();

  let eventFired = false;
  let receivedTheme = "";
  const listener = (e: Event) => {
    eventFired = true;
    const ce = e as CustomEvent<{ theme: string; resolvedTheme: string }>;
    receivedTheme = ce.detail.theme;
  };

  globalThis.window.addEventListener(THEME_CHANGE_EVENT, listener);

  // 1. Switch to dark theme
  const darkResolved = setTheme("dark");
  assert.equal(darkResolved, "dark");
  assert.equal(getStoredTheme(), "dark");
  assert.equal(getResolvedTheme(), "dark");
  assert.equal(globalThis.document.documentElement.getAttribute("data-theme"), "dark");
  assert.equal(globalThis.document.documentElement.style.colorScheme, "dark");
  assert.equal(env.localStorage.getItem(THEME_STORAGE_KEY), JSON.stringify("dark"));
  assert.equal(eventFired, true);
  assert.equal(receivedTheme, "dark");

  // 2. Toggle to light theme
  eventFired = false;
  const lightResolved = toggleTheme();
  assert.equal(lightResolved, "light");
  assert.equal(getStoredTheme(), "light");
  assert.equal(getResolvedTheme(), "light");
  assert.equal(globalThis.document.documentElement.getAttribute("data-theme"), "light");
  assert.equal(globalThis.document.documentElement.style.colorScheme, "light");
  assert.equal(eventFired, true);
  assert.equal(receivedTheme, "light");

  // 3. Toggle back to dark theme
  const toggleBack = toggleTheme();
  assert.equal(toggleBack, "dark");
  assert.equal(getStoredTheme(), "dark");
  assert.equal(getResolvedTheme(), "dark");

  globalThis.window.removeEventListener(THEME_CHANGE_EVENT, listener);
  env.reset();
});

test("Theme System: resilience to malformed and invalid storage values", () => {
  const env = setupMockBrowserEnvironment();

  // 1. Malformed JSON string in storage
  env.localStorage.setItem(THEME_STORAGE_KEY, "invalid-json{{[");
  assert.equal(getStoredTheme(), "system");
  assert.equal(getResolvedTheme(), "light");

  // 2. Invalid theme name (e.g. "neon", "solarized", 999)
  env.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify("neon-matrix"));
  assert.equal(getStoredTheme(), "system");

  env.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(12345));
  assert.equal(getStoredTheme(), "system");

  // 3. Safe fallback when setting an invalid theme
  // @ts-expect-error Testing invalid runtime value
  const fallback = setTheme("cyberpunk");
  assert.equal(getStoredTheme(), "system");
  assert.equal(fallback, "light");

  env.reset();
});

