"use client";

import { useState } from "react";
import { adminToggleUserStatus } from "@/lib/demo/user-actions";
import { exportAdminUsersCsv } from "@/lib/demo/csv-export";
import type { DemoBooking, DemoCar, DemoUser } from "@/lib/demo/types";

export function AdminUserManager({
  currentAdmin,
  users,
  cars,
  bookings,
}: {
  currentAdmin: DemoUser;
  users: DemoUser[];
  cars: DemoCar[];
  bookings: DemoBooking[];
}) {
  const [filter, setFilter] = useState<"all" | "owner" | "renter" | "suspended">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const activeCount = users.filter((u) => u.status === "active").length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;
  const ownerCount = users.filter((u) => u.roles.includes("owner")).length;
  const renterCount = users.filter((u) => u.roles.includes("renter")).length;

  const filteredUsers = users.filter((u) => {
    if (filter === "owner" && !u.roles.includes("owner")) return false;
    if (filter === "renter" && !u.roles.includes("renter")) return false;
    if (filter === "suspended" && u.status !== "suspended") return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchId = u.id.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId) return false;
    }

    return true;
  });

  async function handleToggleStatus(targetUserId: string) {
    setActionError("");
    setActionSuccess("");
    setProcessingId(targetUserId);

    const result = adminToggleUserStatus(targetUserId);
    setProcessingId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    const action = result.value.status === "suspended" ? "suspended" : "reinstated to active status";
    setActionSuccess(`Account for "${result.value.name}" (${result.value.email}) has been ${action}.`);
  }

  function handleExportCsv() {
    exportAdminUsersCsv(users, cars, bookings);
  }

  return (
    <div className="admin-user-manager">
      <div className="listings-header-bar">
        <div>
          <h2>User Accounts &amp; Access Control</h2>
          <p>Inspect demo user records, assigned roles, fleet ownership, and enforce suspensions.</p>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={handleExportCsv}
        >
          ⬇ Export Users Report (CSV)
        </button>
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

      {/* METRICS ROW */}
      <section className="dashboard-metrics" aria-label="User metrics">
        <article className="dashboard-metric">
          <p>Total Registered Users</p>
          <strong>{users.length}</strong>
          <small>{activeCount} active · {suspendedCount} suspended</small>
        </article>
        <article className="dashboard-metric">
          <p>Vehicle Owners</p>
          <strong>{ownerCount}</strong>
          <small>Registered car providers</small>
        </article>
        <article className="dashboard-metric">
          <p>Renters</p>
          <strong>{renterCount}</strong>
          <small>Verified platform renters</small>
        </article>
        <article className="dashboard-metric">
          <p>Suspended Accounts</p>
          <strong className={suspendedCount > 0 ? "text-danger" : ""}>{suspendedCount}</strong>
          <small>Blocked from sign in &amp; booking</small>
        </article>
      </section>

      {/* CONTROLS */}
      <div className="moderation-controls-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${filter === "all" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Users ({users.length})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "owner" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("owner")}
          >
            Owners ({ownerCount})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "renter" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("renter")}
          >
            Renters ({renterCount})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "suspended" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("suspended")}
          >
            Suspended ({suspendedCount})
          </button>
        </div>

        <div className="search-wrap">
          <input
            type="search"
            className="form-input search-input-small"
            placeholder="Search user by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* USERS TABLE */}
      {filteredUsers.length === 0 ? (
        <div className="dashboard-panel dashboard-empty">
          <span aria-hidden="true">◉</span>
          <strong>No accounts found</strong>
          <p>No user accounts match the selected criteria.</p>
        </div>
      ) : (
        <div className="dashboard-panel">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Roles</th>
                  <th scope="col">Account Status</th>
                  <th scope="col">Activity &amp; Assets</th>
                  <th scope="col">Registered</th>
                  <th scope="col">Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const ownedCars = cars.filter((c) => c.ownerId === u.id);
                  const userBookings = bookings.filter((b) => b.renterId === u.id || b.ownerId === u.id);
                  const isCurrentAdmin = u.id === currentAdmin.id;
                  const isProcessing = processingId === u.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell-wrap">
                          <span className="user-avatar-badge" aria-hidden="true">
                            {u.name.slice(0, 1)}
                          </span>
                          <div>
                            <strong>{u.name} {isCurrentAdmin && <span className="you-pill">You</span>}</strong>
                            <small>{u.email} · {u.phone || "No phone"}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="role-pills-wrap">
                          {u.roles.map((r) => (
                            <span key={r} className={`role-pill role-${r}`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`dashboard-status ${
                            u.status === "active" ? "status-available" : "status-cancelled"
                          }`}
                        >
                          {u.status === "active" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td>
                        <strong>{ownedCars.length} vehicles owned</strong>
                        <small>{userBookings.length} total bookings</small>
                      </td>
                      <td>
                        <small>{u.createdAt.slice(0, 10)}</small>
                      </td>
                      <td>
                        {isCurrentAdmin ? (
                          <span className="admin-protected-label">
                            Protected Admin
                          </span>
                        ) : u.status === "active" ? (
                          <button
                            type="button"
                            className="button button-outline button-tiny button-danger"
                            disabled={isProcessing}
                            onClick={() => handleToggleStatus(u.id)}
                          >
                            {isProcessing ? "Updating..." : "Suspend Account"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button button-primary button-tiny"
                            disabled={isProcessing}
                            onClick={() => handleToggleStatus(u.id)}
                          >
                            {isProcessing ? "Updating..." : "Reinstate Account"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
