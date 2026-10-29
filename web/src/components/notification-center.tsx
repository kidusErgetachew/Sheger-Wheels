"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  useNotifications,
  TOAST_NOTIFICATION_EVENT,
  type ToastPayload,
} from "@/lib/demo/notifications";

export function NotificationCenter({ className = "" }: { className?: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click or escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(iso).toLocaleDateString("en-ET", { month: "short", day: "numeric" });
  }

  function getIcon(type: string) {
    switch (type) {
      case "payment":
        return "💳";
      case "booking":
        return "🚗";
      case "favorite":
        return "❤️";
      case "announcement":
        return "📢";
      default:
        return "🔔";
    }
  }

  return (
    <div className={`notification-center ${className}`} ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications center"
        }
        className={`notification-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="notification-bell-svg"
          fill="none"
          height="18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="18"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" role="region" aria-label="Notifications panel">
          <div className="notification-header">
            <div className="notification-header-title">
              <strong>Notifications</strong>
              {unreadCount > 0 && (
                <span className="notification-unread-pill">{unreadCount} new</span>
              )}
            </div>
            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button
                  className="notification-text-action"
                  onClick={markAllAsRead}
                  type="button"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="notification-text-action"
                  onClick={clearNotifications}
                  type="button"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="notification-empty-icon" aria-hidden="true">📭</span>
                <p>No notifications yet</p>
                <small>Updates on bookings, mock TeleBirr receipts, and alerts appear here.</small>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notification-item ${item.read ? "is-read" : "is-unread"}`}
                  onClick={() => !item.read && markAsRead(item.id)}
                >
                  <span className="notification-item-icon" aria-hidden="true">
                    {getIcon(item.type)}
                  </span>
                  <div className="notification-item-body">
                    <div className="notification-item-top">
                      <strong className="notification-item-title">{item.title}</strong>
                      <span className="notification-item-time">{formatTime(item.createdAt)}</span>
                    </div>
                    <p className="notification-item-message">{item.message}</p>
                    {item.link && (
                      <Link
                        className="notification-item-link"
                        href={item.link}
                        onClick={() => {
                          markAsRead(item.id);
                          setIsOpen(false);
                        }}
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                  {!item.read && (
                    <span className="notification-unread-dot" title="Unread" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Global Toast Container that surfaces transient notification cards
 */
export function ToastNotificationContainer() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    function handleToast(e: Event) {
      const customEvent = e as CustomEvent<ToastPayload>;
      const payload = customEvent.detail;
      if (!payload) return;

      setToasts((prev) => [...prev.slice(-3), payload]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== payload.id));
      }, payload.durationMs ?? 4500);
    }

    window.addEventListener(TOAST_NOTIFICATION_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_NOTIFICATION_EVENT, handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type ?? "info"}`}>
          <div className="toast-icon" aria-hidden="true">
            {toast.type === "success"
              ? "✓"
              : toast.type === "warning"
                ? "⚠️"
                : toast.type === "error"
                  ? "✕"
                  : "ℹ️"}
          </div>
          <div className="toast-content">
            <strong className="toast-title">{toast.title}</strong>
            <p className="toast-message">{toast.message}</p>
          </div>
          <button
            aria-label="Close notification"
            className="toast-close-btn"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

