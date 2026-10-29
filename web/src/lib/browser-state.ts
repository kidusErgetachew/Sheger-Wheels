"use client";

import { useSyncExternalStore } from "react";
import { localIsoDate } from "./dates";

function subscribeLocation(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getLocationSearch(): string {
  return window.location.search;
}

function subscribeNothing(): () => void {
  return () => {};
}

export function useBrowserLocationSearch(): string {
  return useSyncExternalStore(subscribeLocation, getLocationSearch, () => "");
}

export function useLocalToday(): string {
  return useSyncExternalStore(subscribeNothing, localIsoDate, () => "");
}
