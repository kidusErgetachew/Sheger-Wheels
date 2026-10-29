export const DEMO_SESSION_CHANGE_EVENT = "sw:demo-session-change";

export function publishDemoSessionChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DEMO_SESSION_CHANGE_EVENT));
  }
}
