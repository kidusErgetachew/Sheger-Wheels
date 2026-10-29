"use client";

import { useState } from "react";
import {
  createDemoAnnouncement,
  deleteDemoAnnouncement,
  toggleDemoAnnouncement,
} from "@/lib/demo/announcement-actions";
import type { DemoAnnouncement } from "@/lib/demo/types";

export function AdminAnnouncementsManager({
  announcements,
}: {
  announcements: DemoAnnouncement[];
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!title.trim() || !message.trim()) {
      setActionError("Please provide both an announcement title and message.");
      return;
    }

    setIsSubmitting(true);
    const result = createDemoAnnouncement(title, message);
    setIsSubmitting(false);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    setActionSuccess("Announcement broadcast successfully!");
    setTitle("");
    setMessage("");
  }

  function handleToggle(id: string) {
    setActionError("");
    setActionSuccess("");
    const result = toggleDemoAnnouncement(id);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setActionSuccess(
      result.value.active
        ? `Announcement activated!`
        : `Announcement marked inactive.`,
    );
  }

  function handleDelete(id: string) {
    setActionError("");
    setActionSuccess("");
    const result = deleteDemoAnnouncement(id);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setActionSuccess("Announcement removed.");
  }

  return (
    <div className="admin-announcements-manager">
      <div className="listings-header-bar">
        <div>
          <h2>Marketplace Announcements</h2>
          <p>Post platform notices, holiday pickup hours, or policy updates for renters and vehicle owners.</p>
        </div>
      </div>

      {actionSuccess && (
        <div className="dashboard-alert alert-success" role="status">
          ✓ {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="dashboard-alert alert-error" role="alert">
          {actionError}
        </div>
      )}

      {/* CREATE ANNOUNCEMENT FORM */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Publish New Announcement</h2>
            <p>Active announcements are displayed to users across the platform.</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="announcement-form">
          <div className="form-field-group">
            <label htmlFor="ann-title">Announcement Headline *</label>
            <input
              id="ann-title"
              type="text"
              className="form-input"
              placeholder="e.g. Meskel Holiday Rental Guidelines & Office Hours"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-field-group">
            <label htmlFor="ann-msg">Announcement Message *</label>
            <textarea
              id="ann-msg"
              rows={3}
              className="form-textarea"
              placeholder="Provide complete details, date ranges, or guidance for owners and renters..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Broadcast Announcement"}
            </button>
          </div>
        </form>
      </section>

      {/* EXISTING ANNOUNCEMENTS */}
      <section className="dashboard-panel" style={{ marginTop: "20px" }}>
        <div className="dashboard-panel-heading">
          <div>
            <h2>Published Notices ({announcements.length})</h2>
            <p>Toggle active status or manage past platform announcements.</p>
          </div>
        </div>

        {announcements.length === 0 ? (
          <div className="dashboard-empty">
            <span aria-hidden="true">📢</span>
            <strong>No announcements published</strong>
            <p>Use the form above to publish your first announcement notice.</p>
          </div>
        ) : (
          <div className="announcements-list">
            {announcements.map((a) => (
              <div
                key={a.id}
                className={`announcement-card${a.active ? " announcement-card-active" : " announcement-card-inactive"}`}
              >
                <div className="announcement-card-header">
                  <div>
                    <span
                      className={`dashboard-status ${
                        a.active ? "status-available" : "status-inactive"
                      }`}
                    >
                      {a.active ? "Active" : "Archived / Inactive"}
                    </span>
                    <h3>{a.title}</h3>
                    <small>Posted on {a.createdAt.slice(0, 10)}</small>
                  </div>
                  <div className="announcement-card-actions">
                    <button
                      type="button"
                      className="button button-outline button-tiny"
                      onClick={() => handleToggle(a.id)}
                    >
                      {a.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="button button-outline button-tiny button-danger"
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="announcement-card-message">{a.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
