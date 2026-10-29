import { readDemoCollection, readStorage, removeStorage, writeStorage } from "./storage";
import { publishDemoSessionChange } from "./events";
import type { ActionResult, DemoSession, DemoUser, UserRole } from "./types";

export const SESSION_KEY = "sw_session_v1";

function hasBrowserSessionStorage(): boolean {
  return typeof window !== "undefined";
}

export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "/";

  try {
    const parsed = new URL(value, "https://sheggar.local");
    if (parsed.origin !== "https://sheggar.local") return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function getCurrentSession(): ActionResult<{
  session: DemoSession | null;
  user: DemoUser | null;
}> {
  const stored = readStorage<unknown>(SESSION_KEY, undefined, "session");
  if (!stored.ok) return stored;
  if (stored.recovered) {
    const cleared = signOut();
    if (!cleared.ok) return cleared;
    return { ok: true, value: { session: null, user: null } };
  }
  if (stored.value === undefined) {
    return { ok: true, value: { session: null, user: null } };
  }

  const parsed = stored.value;
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("userId" in parsed) ||
    typeof parsed.userId !== "string" ||
    !("startedAt" in parsed) ||
    typeof parsed.startedAt !== "string" ||
    !Number.isFinite(Date.parse(parsed.startedAt))
  ) {
    const cleared = signOut();
    if (!cleared.ok) return cleared;
    return { ok: true, value: { session: null, user: null } };
  }

  const users = readDemoCollection("users");
  if (!users.ok) return users;

  const user = users.value.find((candidate) => candidate.id === parsed.userId);
  if (!user || user.status !== "active") {
    const cleared = signOut();
    if (!cleared.ok) return cleared;
    return { ok: true, value: { session: null, user: null } };
  }

  return {
    ok: true,
    value: {
      session: { userId: parsed.userId, startedAt: parsed.startedAt },
      user,
    },
  };
}

export function signInAsDemo(userId: string): ActionResult<DemoUser> {
  if (!hasBrowserSessionStorage()) {
    return { ok: false, error: "Demo sign-in is only available in the browser." };
  }

  const users = readDemoCollection("users");
  if (!users.ok) return users;
  const user = users.value.find((candidate) => candidate.id === userId);

  if (!user) return { ok: false, error: "Choose a valid demo account." };
  if (user.status !== "active") {
    return { ok: false, error: "This demo account is suspended and cannot sign in." };
  }

  const session: DemoSession = {
    userId: user.id,
    startedAt: new Date().toISOString(),
  };

  const saved = writeStorage(SESSION_KEY, session, "session");
  if (!saved.ok) return saved;
  publishDemoSessionChange();

  return { ok: true, value: user };
}

export function signOut(): ActionResult<null> {
  if (!hasBrowserSessionStorage()) {
    return { ok: false, error: "Demo sign-out is only available in the browser." };
  }

  const session = removeStorage(SESSION_KEY, "session");
  if (!session.ok) return session;
  publishDemoSessionChange();
  const draft = removeStorage("sw_checkout_draft_v1", "session");
  if (!draft.ok) return draft;
  return { ok: true, value: null };
}

export function hasRole(user: DemoUser | null, role: UserRole): boolean {
  return user?.status === "active" && user.roles.includes(role);
}

export function requireRole(
  user: DemoUser | null,
  role: UserRole,
): ActionResult<DemoUser> {
  if (!user) return { ok: false, error: "Not signed in." };
  if (user.status !== "active") {
    return { ok: false, error: "This demo account is suspended." };
  }
  if (!user.roles.includes(role)) {
    return { ok: false, error: `This action requires the ${role} demo role.` };
  }
  return { ok: true, value: user };
}

export function requireCurrentRole(role: UserRole): ActionResult<DemoUser> {
  const current = getCurrentSession();
  if (!current.ok) return current;
  return requireRole(current.value.user, role);
}

export type DemoMutationRecord = {
  ownerId?: string;
  renterId?: string;
  status: string;
};

export function authorizeDemoMutation(
  role: UserRole,
  record: DemoMutationRecord | null | undefined,
  ownershipField: "ownerId" | "renterId",
  allowedStates: readonly string[],
): ActionResult<DemoUser> {
  const authorized = requireCurrentRole(role);
  if (!authorized.ok) return authorized;
  if (!record) {
    return { ok: false, error: "This record is no longer available." };
  }
  if (
    role !== "admin" &&
    record[ownershipField] !== authorized.value.id
  ) {
    return { ok: false, error: "You can only change records belonging to your account." };
  }
  if (!allowedStates.includes(record.status)) {
    return { ok: false, error: "This record can no longer be changed in its current state." };
  }
  return authorized;
}
