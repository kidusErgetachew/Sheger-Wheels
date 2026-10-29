"use client";

import { useState } from "react";
import { resolveDemoDispute } from "@/lib/demo/dispute-actions";
import type { DemoBooking, DemoCar, DemoDispute, DemoUser } from "@/lib/demo/types";

export function AdminDisputeManager({
  disputes,
  bookings,
  cars,
  users,
}: {
  disputes: DemoDispute[];
  bookings: DemoBooking[];
  cars: DemoCar[];
  users: DemoUser[];
}) {
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const bookingMap = new Map(bookings.map((b) => [b.id, b]));
  const carMap = new Map(cars.map((c) => [c.id, c]));

  const openDisputes = disputes.filter((d) => d.status === "open");
  const resolvedDisputes = disputes.filter((d) => d.status === "resolved");

  async function handleResolve(disputeId: string) {
    setActionError("");
    setActionSuccess("");
    const notes = resolutionNotes[disputeId] || "";

    if (!notes.trim() || notes.trim().length < 5) {
      setActionError("Please enter resolution notes explaining how this dispute was settled (minimum 5 characters).");
      return;
    }

    setProcessingId(disputeId);
    const result = resolveDemoDispute(disputeId, notes);
    setProcessingId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    setActionSuccess(`Dispute "${disputeId}" has been resolved and the reservation updated.`);
    setResolutionNotes((prev) => ({ ...prev, [disputeId]: "" }));
  }

  return (
    <div className="admin-dispute-manager">
      <div className="listings-header-bar">
        <div>
          <h2>Marketplace Dispute Resolution</h2>
          <p>Review customer claims, mediation requests, and record formal resolution notes.</p>
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

      {/* OPEN DISPUTES */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2 className="highlight-title">Open Disputes ({openDisputes.length})</h2>
            <p>Cases requiring administrator review and resolution.</p>
          </div>
        </div>

        {openDisputes.length === 0 ? (
          <div className="dashboard-empty">
            <span aria-hidden="true">✓</span>
            <strong>No active disputes</strong>
            <p>All reported claims have been resolved. The marketplace is running smoothly!</p>
          </div>
        ) : (
          <div className="disputes-list">
            {openDisputes.map((d) => {
              const opener = userMap.get(d.openedBy);
              const booking = bookingMap.get(d.bookingId);
              const car = booking ? carMap.get(booking.carId) : null;
              const isProcessing = processingId === d.id;

              return (
                <div key={d.id} className="dispute-card dispute-card-open">
                  <div className="dispute-card-header">
                    <div>
                      <span className="dashboard-status status-disputed">OPEN DISPUTE</span>
                      <h3>{d.reason}</h3>
                      <small>Opened on {d.createdAt.slice(0, 10)} by {opener?.name ?? d.openedBy}</small>
                    </div>
                    <div className="dispute-target-details">
                      <strong>Booking: <code>{d.bookingId}</code></strong>
                      <small>{car ? `${car.year} ${car.make} ${car.model}` : "Vehicle"}</small>
                    </div>
                  </div>

                  <div className="dispute-description-box">
                    <p><strong>Claim details:</strong> {d.description}</p>
                  </div>

                  <div className="dispute-resolution-form">
                    <label htmlFor={`res-${d.id}`}>
                      <strong>Resolution Outcome &amp; Notes:</strong>
                    </label>
                    <textarea
                      id={`res-${d.id}`}
                      rows={3}
                      className="form-textarea"
                      placeholder="e.g. Reviewed inspection photos and fuel receipt. Reimbursed 850 ETB from deposit to renter; matter settled amicably."
                      value={resolutionNotes[d.id] || ""}
                      onChange={(e) =>
                        setResolutionNotes((prev) => ({
                          ...prev,
                          [d.id]: e.target.value,
                        }))
                      }
                    />
                    <div style={{ marginTop: "10px" }}>
                      <button
                        type="button"
                        className="button button-primary button-small"
                        disabled={isProcessing}
                        onClick={() => handleResolve(d.id)}
                      >
                        {isProcessing ? "Saving resolution..." : "✓ Mark Resolved & Settle Claim"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* RESOLVED DISPUTES */}
      {resolvedDisputes.length > 0 && (
        <section className="dashboard-panel" style={{ marginTop: "20px" }}>
          <div className="dashboard-panel-heading">
            <div>
              <h2>Resolved Cases ({resolvedDisputes.length})</h2>
              <p>Historical record of settled dispute decisions.</p>
            </div>
          </div>

          <div className="disputes-list">
            {resolvedDisputes.map((d) => {
              const opener = userMap.get(d.openedBy);
              const resolver = d.resolvedBy ? userMap.get(d.resolvedBy) : null;

              return (
                <div key={d.id} className="dispute-card dispute-card-resolved">
                  <div className="dispute-card-header">
                    <div>
                      <span className="dashboard-status status-resolved">RESOLVED</span>
                      <h3>{d.reason}</h3>
                      <small>Opened by {opener?.name ?? d.openedBy} on {d.createdAt.slice(0, 10)}</small>
                    </div>
                    <div className="dispute-target-details">
                      <code>{d.id}</code>
                    </div>
                  </div>

                  <p className="claim-copy"><strong>Original Claim:</strong> {d.description}</p>

                  <div className="resolution-notes-callout">
                    <strong>Resolution Decision:</strong>
                    <p>{d.resolutionNotes || "Resolved by administrator."}</p>
                    <small>Settled by {resolver?.name ?? "Administrator"} on {d.resolvedAt?.slice(0, 10)}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
