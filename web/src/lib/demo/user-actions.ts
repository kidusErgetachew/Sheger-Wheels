import { requireCurrentRole } from "./session";
import { readDemoCollection, writeDemoCollection } from "./storage";
import type { ActionResult, DemoUser } from "./types";

export function adminToggleUserStatus(targetUserId: string): ActionResult<DemoUser> {
  const authorized = requireCurrentRole("admin");
  if (!authorized.ok) return authorized;

  const currentAdmin = authorized.value;
  if (currentAdmin.id === targetUserId) {
    return {
      ok: false,
      error: "Security rule: You cannot suspend your own active administrator account.",
    };
  }

  const storedUsers = readDemoCollection("users");
  if (!storedUsers.ok) return storedUsers;

  const user = storedUsers.value.find((u) => u.id === targetUserId);
  if (!user) {
    return { ok: false, error: `Demo user with ID "${targetUserId}" was not found.` };
  }

  const nextStatus = user.status === "active" ? "suspended" : "active";
  const updatedUser: DemoUser = {
    ...user,
    status: nextStatus,
  };

  const saved = writeDemoCollection(
    "users",
    storedUsers.value.map((u) => (u.id === targetUserId ? updatedUser : u)),
  );
  if (!saved.ok) return saved;

  return { ok: true, value: updatedUser };
}
