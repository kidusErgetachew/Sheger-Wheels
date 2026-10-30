"use client";

import { Suspense, use, useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { ProtectedDemo } from "@/components/protected-demo";
import { readDemoCollection, DEMO_DATA_CHANGE_EVENT } from "@/lib/demo/storage";
import { adminToggleUserStatus } from "@/lib/demo/user-actions";
import { formatEtb } from "@/lib/format";
import type { DemoBooking, DemoCar, DemoUser } from "@/lib/demo/types";

function subscribe(onChange: () => void) {
  window.addEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  const users = readDemoCollection("users");
  const cars = readDemoCollection("cars");
  const bookings = readDemoCollection("bookings");
  return JSON.stringify({
    users: users.ok ? users.value : [],
    cars: cars.ok ? cars.value : [],
    bookings: bookings.ok ? bookings.value : [],
  });
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="protected-demo-state" role="status">Loading user details…</p>}>
      <AdminUserDetailRoute params={params} />
    </Suspense>
  );
}

function AdminUserDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  return (
    <ProtectedDemo role="admin">
      <AdminUserDetailContent userId={userId} />
    </ProtectedDemo>
  );
}

function AdminUserDetailContent({ userId }: { userId: string }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");
  const data = JSON.parse(raw) as {
    users: DemoUser[];
    cars: DemoCar[];
    bookings: DemoBooking[];
  };

  const user = data.users?.find((u) => u.id === userId);
  const userCars = data.cars?.filter((c) => c.ownerId === userId) ?? [];
  const userBookings = data.bookings?.filter((b) => b.renterId === userId) ?? [];

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  if (!user) {
    return (
      <main className="dashboard-content" style={{ padding: "40px 24px", maxWidth: 800, margin: "0 auto" }}>
        <p className="dashboard-alert" role="alert">Demo user &quot;{userId}&quot; was not found.</p>
        <Link href="/admin/users" className="button button-outline">← Back to users list</Link>
      </main>
    );
  }

  function handleToggle() {
    setActionError("");
    setActionSuccess("");
    const res = adminToggleUserStatus(userId);
    if (!res.ok) {
      setActionError(res.error);
      return;
    }
    const state = res.value.status === "suspended" ? "suspended" : "active";
    setActionSuccess(`User status updated to ${state}.`);
  }

  return (
    <main className="dashboard-content" style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/users" style={{ color: "var(--color-primary, #059669)", textDecoration: "none" }}>
          ← Back to user accounts
        </Link>
      </div>

      <header className="dashboard-welcome" style={{ marginBottom: 24 }}>
        <div>
          <p className="eyebrow">ADMIN · USER PROFILE INSPECTOR</p>
          <h2>{user.name}</h2>
          <p>{user.email} · Registered on {user.createdAt.slice(0, 10)}</p>
        </div>
        <div>
          <span
            className={`dashboard-status status-${user.status === "active" ? "available" : "cancelled"}`}
            style={{ fontSize: "1rem", padding: "6px 14px" }}
          >
            {user.status === "active" ? "Active" : "Suspended"}
          </span>
        </div>
      </header>

      {actionError && <p className="dashboard-alert" role="alert">{actionError}</p>}
      {actionSuccess && (
        <p
          className="dashboard-alert"
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            borderColor: "var(--color-primary, #059669)",
            color: "var(--color-primary, #059669)",
          }}
        >
          {actionSuccess}
        </p>
      )}

      {/* Account Info Details */}
      <section className="dashboard-panel" style={{ marginBottom: 24 }}>
        <div className="dashboard-panel-heading">
          <div>
            <h2>Account Details</h2>
            <p>Role assignments, contact info, and moderation controls.</p>
          </div>
          <button
            type="button"
            className={`button ${user.status === "active" ? "button-danger" : "button-primary"} button-small`}
            onClick={handleToggle}
          >
            {user.status === "active" ? "Suspend Account" : "Reinstate Account"}
          </button>
        </div>

        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 12 }}>
          <div>
            <dt style={{ color: "var(--color-ink-muted, #64748b)", fontSize: "0.85rem" }}>User ID</dt>
            <dd style={{ fontWeight: 600 }}>{user.id}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-ink-muted, #64748b)", fontSize: "0.85rem" }}>Phone Number</dt>
            <dd style={{ fontWeight: 600 }}>{user.phone || "Not recorded"}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-ink-muted, #64748b)", fontSize: "0.85rem" }}>Assigned Roles</dt>
            <dd style={{ fontWeight: 600 }}>{user.roles.join(", ")}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-ink-muted, #64748b)", fontSize: "0.85rem" }}>Current Status</dt>
            <dd style={{ fontWeight: 600, textTransform: "capitalize" }}>{user.status}</dd>
          </div>
        </dl>
      </section>

      {/* Associated Fleet if Owner */}
      {user.roles.includes("owner") && (
        <section className="dashboard-panel" style={{ marginBottom: 24 }}>
          <div className="dashboard-panel-heading">
            <div>
              <h2>Listed Fleet ({userCars.length})</h2>
              <p>Vehicles published by this owner account.</p>
            </div>
          </div>
          {userCars.length === 0 ? (
            <p style={{ color: "var(--color-ink-muted, #64748b)" }}>No vehicles listed yet.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Daily Rate</th>
                    <th scope="col">Neighbourhood</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userCars.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.year} {c.make} {c.model}</strong></td>
                      <td>{formatEtb(c.pricePerDay)}</td>
                      <td>{c.neighbourhood}</td>
                      <td><span className={`dashboard-status status-${c.status}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Associated Bookings if Renter */}
      {user.roles.includes("renter") && (
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Rented Trips ({userBookings.length})</h2>
              <p>Rental reservation history made by this user.</p>
            </div>
          </div>
          {userBookings.length === 0 ? (
            <p style={{ color: "var(--color-ink-muted, #64748b)" }}>No bookings recorded yet.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th scope="col">Booking ID</th>
                    <th scope="col">Dates</th>
                    <th scope="col">Total</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userBookings.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.id}</strong></td>
                      <td>{b.startDate} to {b.endDate}</td>
                      <td>{formatEtb(b.total)}</td>
                      <td><span className={`dashboard-status status-${b.status}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
