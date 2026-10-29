import { useSyncExternalStore } from "react";
import { getCurrentSession } from "./session";
import type { DemoUser } from "./types";
import { DEMO_SESSION_CHANGE_EVENT } from "./events";
import { DEMO_DATA_CHANGE_EVENT } from "./storage";

export type SessionSnapshot = {
  ready: boolean;
  user: DemoUser | null;
  error: string;
};

function getSnapshot(): string {
  const session = getCurrentSession();
  if (!session.ok) {
    return JSON.stringify({ ready: true, user: null, error: session.error });
  }
  return JSON.stringify({ ready: true, user: session.value.user, error: "" });
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(DEMO_SESSION_CHANGE_EVENT, onChange);
  window.addEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DEMO_SESSION_CHANGE_EVENT, onChange);
    window.removeEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function useSessionSnapshot(): SessionSnapshot {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () =>
    JSON.stringify({ ready: false, user: null, error: "" }),
  );
  return JSON.parse(snapshot) as SessionSnapshot;
}

export function useCurrentDemoSession(): SessionSnapshot {
  return useSessionSnapshot();
}

export function useDemoSession(): { name: string; error: string } {
  const { user, error } = useSessionSnapshot();
  return { name: user?.name ?? "", error };
}
