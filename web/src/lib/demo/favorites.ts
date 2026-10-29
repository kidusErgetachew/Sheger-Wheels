"use client";

import { useSyncExternalStore } from "react";
import { readStorage, writeStorage, DEMO_DATA_CHANGE_EVENT } from "./storage";

export const FAVORITES_STORAGE_KEY = "sw_favorites_v1";

/**
 * Reads favorited car IDs from browser localStorage.
 */
export function getFavorites(): string[] {
  const result = readStorage<string[]>(FAVORITES_STORAGE_KEY, []);
  if (!result.ok || !Array.isArray(result.value)) return [];
  return result.value.filter((id) => typeof id === "string" && id.trim().length > 0);
}

/**
 * Checks if a specific car ID is in favorites.
 */
export function isFavorite(carId: string): boolean {
  if (!carId) return false;
  const favorites = getFavorites();
  return favorites.includes(carId);
}

/**
 * Toggles a car ID in favorites and persists to localStorage.
 */
export function toggleFavorite(carId: string): { isFavorite: boolean; favorites: string[] } {
  if (!carId) return { isFavorite: false, favorites: [] };
  const current = getFavorites();
  const exists = current.includes(carId);
  const next = exists ? current.filter((id) => id !== carId) : [...current, carId];
  writeStorage(FAVORITES_STORAGE_KEY, next);
  return { isFavorite: !exists, favorites: next };
}

/**
 * Clears all favorited cars.
 */
export function clearFavorites(): void {
  writeStorage(FAVORITES_STORAGE_KEY, []);
}

function subscribeFavorites(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DEMO_DATA_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(DEMO_DATA_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getFavoritesSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return JSON.stringify(getFavorites());
}

/**
 * Reactive hook that synchronizes favorites state across all components in the app.
 */
export function useFavorites() {
  const serialized = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => "[]",
  );

  let favorites: string[] = [];
  try {
    favorites = JSON.parse(serialized) as string[];
  } catch {
    favorites = [];
  }

  return {
    favorites,
    count: favorites.length,
    isFavorite: (carId: string) => favorites.includes(carId),
    toggleFavorite: (carId: string) => toggleFavorite(carId),
    clearFavorites,
  };
}
