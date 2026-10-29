"use client";

import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "./storage";

export const NOTIFICATIONS_STORAGE_KEY = "sw_notifications_v1";
export const NOTIFICATIONS_CHANGE_EVENT = "sw:notifications-change";
export const TOAST_NOTIFICATION_EVENT = "sw:toast-notification";

export type DemoNotification = {
  id: string;
  title: string;
  message: string;
  type: "payment" | "booking" | "favorite" | "announcement" | "system";
  read: boolean;
  createdAt: string;
  link?: string;
};

export type ToastPayload = {
  id: string;
  title: string;
  message: string;
  type?: "success" | "info" | "warning" | "error";
  durationMs?: number;
};

const SEED_NOTIFICATIONS: DemoNotification[] = [
  {
    id: "notif-welcome-1",
    title: "Welcome to Sheggar Wheels",
    message: "Explore cars in Addis Ababa or list your vehicle to start earning.",
    type: "system",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    link: "/cars",
  },
  {
    id: "notif-telebirr-ready",
    title: "TeleBirr Demo Simulation Ready",
    message: "Experience our mock TeleBirr checkout flow with instant confirmations and zero real charges.",
    type: "payment",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    link: "/cars",
  },
  {
    id: "notif-addis-expansion",
    title: "Addis Ababa Fleet Expansion",
    message: "New electric and hybrid vehicles added across Bole, CMC, and Kazanchis.",
    type: "announcement",
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    link: "/cars",
  },
];

export function getNotifications(): DemoNotification[] {
  const result = readStorage<DemoNotification[]>(NOTIFICATIONS_STORAGE_KEY, SEED_NOTIFICATIONS);
  if (!result.ok || !Array.isArray(result.value)) return SEED_NOTIFICATIONS;
  return result.value;
}

export function saveNotifications(items: DemoNotification[]): void {
  writeStorage(NOTIFICATIONS_STORAGE_KEY, items);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGE_EVENT));
  }
}

export function addNotification(
  notification: Omit<DemoNotification, "id" | "createdAt" | "read">,
  showToast = true,
): DemoNotification {
  const current = getNotifications();
  const newNotif: DemoNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };

  saveNotifications([newNotif, ...current]);

  if (showToast && typeof window !== "undefined") {
    emitToast({
      id: newNotif.id,
      title: newNotif.title,
      message: newNotif.message,
      type: newNotif.type === "payment" ? "success" : "info",
    });
  }

  return newNotif;
}

export function markAsRead(id: string): void {
  const current = getNotifications();
  const next = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(next);
}

export function markAllAsRead(): void {
  const current = getNotifications();
  const next = current.map((n) => ({ ...n, read: true }));
  saveNotifications(next);
}

export function clearNotifications(): void {
  saveNotifications([]);
}

export function emitToast(toast: ToastPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_NOTIFICATION_EVENT, { detail: toast }),
  );
}

function subscribeNotifications(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getNotificationsSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return JSON.stringify(getNotifications());
}

export function useNotifications() {
  const serialized = useSyncExternalStore(
    subscribeNotifications,
    getNotificationsSnapshot,
    () => "[]",
  );

  let notifications: DemoNotification[] = [];
  try {
    notifications = JSON.parse(serialized) as DemoNotification[];
  } catch {
    notifications = [];
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

