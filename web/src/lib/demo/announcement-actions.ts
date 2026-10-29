import { requireCurrentRole } from "./session";
import { readDemoCollection, writeDemoCollection } from "./storage";
import type { ActionResult, DemoAnnouncement } from "./types";

export function createDemoAnnouncement(
  title: string,
  message: string,
): ActionResult<DemoAnnouncement> {
  const authorized = requireCurrentRole("admin");
  if (!authorized.ok) return authorized;

  const cleanTitle = title.trim();
  const cleanMessage = message.trim();

  if (cleanTitle.length < 3 || cleanTitle.length > 100) {
    return { ok: false, error: "Title must be between 3 and 100 characters." };
  }
  if (cleanMessage.length < 5 || cleanMessage.length > 500) {
    return { ok: false, error: "Message must be between 5 and 500 characters." };
  }

  const stored = readDemoCollection("announcements");
  if (!stored.ok) return stored;

  const announcement: DemoAnnouncement = {
    id: `announcement-${Date.now().toString(36)}`,
    title: cleanTitle,
    message: cleanMessage,
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: authorized.value.id,
  };

  const saved = writeDemoCollection("announcements", [
    announcement,
    ...stored.value,
  ]);
  if (!saved.ok) return saved;

  return { ok: true, value: announcement };
}

export function toggleDemoAnnouncement(
  id: string,
): ActionResult<DemoAnnouncement> {
  const authorized = requireCurrentRole("admin");
  if (!authorized.ok) return authorized;

  const stored = readDemoCollection("announcements");
  if (!stored.ok) return stored;

  const existing = stored.value.find((a) => a.id === id);
  if (!existing) {
    return { ok: false, error: `Announcement "${id}" not found.` };
  }

  const updated: DemoAnnouncement = {
    ...existing,
    active: !existing.active,
  };

  const saved = writeDemoCollection(
    "announcements",
    stored.value.map((a) => (a.id === id ? updated : a)),
  );
  if (!saved.ok) return saved;

  return { ok: true, value: updated };
}

export function deleteDemoAnnouncement(id: string): ActionResult<null> {
  const authorized = requireCurrentRole("admin");
  if (!authorized.ok) return authorized;

  const stored = readDemoCollection("announcements");
  if (!stored.ok) return stored;

  const filtered = stored.value.filter((a) => a.id !== id);
  const saved = writeDemoCollection("announcements", filtered);
  if (!saved.ok) return saved;

  return { ok: true, value: null };
}
