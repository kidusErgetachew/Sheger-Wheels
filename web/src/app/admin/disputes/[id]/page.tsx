"use client";

import { use, useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { ProtectedDemo } from "@/components/protected-demo";
import { readDemoCollection, DEMO_DATA_CHANGE_EVENT } from "@/lib/demo/storage";
import { resolveDemoDispute } from "@/lib/demo/dispute-actions";
import { formatEtb } from "@/lib/format";
import type { DemoBooking, DemoCar, DemoDispute, DemoUser } from "@/lib/demo/types";

function subscribe(onChange: () => void) {
  window.addEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  const disputes = readDemoCollection("disputes");
  const bookings = readDemoCollection("bookings");
  const cars = readDemoCollection("cars");
  const users = readDemoCollection("users");
  return JSON.stringify({
    disputes: disputes.ok ? disputes.value : [],
    bookings: bookings.ok ? bookings.value : [],
    cars: cars.ok ? cars.value : [],
    users: users.ok ? users.value : [],
  });
}

export default function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const disputeId = resolvedParams.id;

  return (
    <ProtectedDemo role="admin">
      <AdminDisputeDetailContent disputeId={disputeId} />
    </ProtectedDemo>
  );
}

function AdminDisputeDetailContent({ disputeId }: { disputeId: string }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");
  const data = JSON.parse(raw) as {
    disputes: DemoDispute[];
    bookings: DemoBooking[];
    cars: DemoCar[];
    users: DemoUser[];
  };

  const dispute = data.disputes?.find((d) => d.id === disputeId);
  const booking = data.bookings?.find((b) => b.id === dispute?.bookingId);
  const car = data.cars?.find((c) => c.id === booking?.carId);
  const openedByUser = data.users?.find((u) => u.id === dispute?.openedBy);

  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!dispute) {
    return (
      <main className="dashboard-content" style={{ padding: "40px 24px", maxWidth: 800, margin: "0 auto" }}>
        <p className="dashboard-alert" role="alert">Dispute &quot;{disputeId}&quot; was not found.</p>
        <Link href="/admin/disputes" className="button button-outline">← Back to disputes</Link>
      </main>
    );
  }

  function handleResolve() {
    setErrorMessage("");
    setSuccessMessage("");

    const result = resolveDemoDispute(disputeId, notes);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage("Dispute has been resolved and resolution notes recorded.");
    setNotes("");
  }

  return (
    <main className="dashboard-content" style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/disputes" style={{ color: "var(--color-primary, #059669)", textDecoration: "none" }}>
          ← Back to disputes list
        </Link>
      </div>

      <header className="dashboard-welcome" style={{ marginBottom: 24 }}>
        <div>
          <p className="eyebrow">ADMIN · DISPUTE MEDIATION</p>
          <h2>Dispute Case: {dispute.reason}</h2>
          <p>Filed on {dispute.createdAt.slice(0, 10)} by {openedByUser?.name ?? dispute.openedBy}</p>
        </div>
        <div>
          <span
            className={`dashboard-status status-${dispute.status === "open" ? "maintenance" : "available"}`}
            style={{ fontSize: "1rem", padding: "6px 14px" }}
          >
            {dispute.status === "open" ? "Open Dispute" : "Resolved"}
          </span>
        </div>
      </header>

      {errorMessage && <p className="dashboard-alert" role="alert">{errorMessage}</p>}
      {successMessage && (
        <p
          className="dashboard-alert"
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            borderColor: "var(--color-primary, #059669)",
            color: "var(--color-primary, #059669)",
          }}
        >
          {successMessage}
        </p>
      )}

      {/* Case Details */}
      <section className="dashboard-panel" style={{ marginBottom: 24 }}>
        <div className="dashboard-panel-heading">
          <div>
            <h2>Case Claim &amp; Context</h2>
            <p>Details reported by the claimant regarding this reservation.</p>
          </div>
        </div>
        <div style={{ padding: "14px", background: "var(--color-surface-sunken, #f8fafc)", borderRadius: 8, marginTop: 12 }}>
          <strong style={{ display: "block", marginBottom: 6 }}>Claimant Description:</strong>
          <p style={{ lineHeight: 1.6, margin: 0 }}>&ldquo;{dispute.description}&rdquo;</p>
        </div>

        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 20 }}>
          <div>
            <dt style={{ color: "var(--color-ink-muted, #64748b)", fontSize: "0.85rem" }}>Associated Booking</dt>
            <dd style={{ fontWeight: 600 }}>{dispute.bookingId}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-ink-muted, #64748b)", fontSize: "0.85rem" }}>Vehicle Involved</dt>
            <dd style={{ fontWeight: 600 }}>{car ? `${car.year} ${car.make} ${car.model}` : "Demo vehicle"}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-ink-muted, #64748b)", fontSize: "0.85rem" }}>Trip Total</dt>
            <dd style={{ fontWeight: 600 }}>{booking ? formatEtb(booking.total) : "N/A"}</dd>
          </div>
          <div>
            <dt style={{ color: "var(--color-ink-muted, #64748b)", fontSize: "0.85rem" }}>Booking Status</dt>
            <dd style={{ fontWeight: 600, textTransform: "capitalize" }}>{booking?.status ?? "N/A"}</dd>
          </div>
        </dl>
      </section>

      {/* Resolution Section */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Resolution &amp; Outcome Notes</h2>
            <p>Official arbitration record by platform administrator.</p>
          </div>
        </div>

        {dispute.status === "resolved" ? (
          <div style={{ marginTop: 14, padding: "16px", background: "rgba(5, 150, 105, 0.08)", borderLeft: "4px solid var(--color-primary, #059669)", borderRadius: "0 8px 8px 0" }}>
            <strong style={{ color: "var(--color-primary, #059669)", display: "block", marginBottom: 6 }}>
              Arbitration Ruling Recorded:
            </strong>
            <p style={{ lineHeight: 1.6, margin: "0 0 8px 0" }}>{dispute.resolutionNotes}</p>
            <small style={{ color: "var(--color-ink-muted, #64748b)" }}>
              Resolved at: {dispute.resolvedAt ? dispute.resolvedAt.replace("T", " ").slice(0, 19) : "Recorded"}
            </small>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <label htmlFor="res-notes" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Arbitration Outcome Notes (minimum 5 characters):
            </label>
            <textarea
              id="res-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain the outcome, e.g. Owner verified cleanliness; renter refunded 500 ETB cleaning allowance..."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 6,
                border: "1px solid var(--color-border, #cbd5e1)",
                background: "var(--color-surface, #fff)",
                color: "inherit",
                fontFamily: "inherit",
                fontSize: "0.95rem",
              }}
            />
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="button button-primary"
                onClick={handleResolve}
              >
                Record Notes &amp; Resolve Dispute
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

