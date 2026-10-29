"use client";

import { useState } from "react";
import Image from "next/image";
import { transitionDemoBooking } from "@/lib/demo/booking-actions";
import { getBookingDisplayStatus, type DashboardStatus } from "@/lib/demo/dashboard";
import { exportOwnerBookingsCsv } from "@/lib/demo/csv-export";
import { formatDemoDate, formatEtb } from "@/lib/format";
import type { DemoBooking, DemoCar, DemoUser } from "@/lib/demo/types";

export function OwnerRequestsManager({
  user,
  cars,
  bookings,
  users,
}: {
  user: DemoUser;
  cars: DemoCar[];
  bookings: DemoBooking[];
  users: DemoUser[];
}) {
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Strictly filter bookings to only those for this owner's vehicles
  const ownerBookings = bookings.filter((b) => b.ownerId === user.id);

  const pendingRequests = ownerBookings.filter((b) => b.status === "requested");

  async function handleBookingAction(bookingId: string, nextStatus: "confirmed" | "declined" | "in_progress" | "completed") {
    setActionNotice("");
    setActionError("");
    setProcessingId(bookingId);

    const result = await transitionDemoBooking(bookingId, nextStatus);
    setProcessingId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    if (nextStatus === "confirmed") {
      setActionNotice(`Booking ${bookingId.slice(0, 16)} approved successfully! Status is now Confirmed.`);
    } else if (nextStatus === "declined") {
      setActionNotice(`Booking request declined. The renter will see the declined status.`);
    } else if (nextStatus === "in_progress") {
      setActionNotice(`Trip marked in progress. Drive safely!`);
    } else if (nextStatus === "completed") {
      setActionNotice(`Trip marked completed! Earnings added to your ledger.`);
    }
  }

  const filteredBookings = ownerBookings.filter((b) => {
    if (filter === "requested" && b.status !== "requested") return false;
    if (filter === "confirmed" && b.status !== "confirmed") return false;
    if (filter === "in_progress" && b.status !== "in_progress") return false;
    if (filter === "completed" && !["completed", "reviewed"].includes(b.status)) return false;
    if (filter === "declined_cancelled" && !["declined", "cancelled"].includes(b.status)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const car = carMap.get(b.carId);
      const renter = userMap.get(b.renterId);
      const matchCar = car && `${car.make} ${car.model}`.toLowerCase().includes(q);
      const matchRenter = renter && renter.name.toLowerCase().includes(q);
      const matchId = b.id.toLowerCase().includes(q);
      if (!matchCar && !matchRenter && !matchId) return false;
    }

    return true;
  });

  function handleExportCsv() {
    exportOwnerBookingsCsv(user, ownerBookings, cars, users);
  }

  return (
    <div className="owner-requests-manager">
      <div className="listings-header-bar">
        <div>
          <h2>Booking Requests &amp; Reservations</h2>
          <p>Review customer booking requests, manage confirmed reservations, and track trip status.</p>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={handleExportCsv}
          disabled={ownerBookings.length === 0}
        >
          ⬇ Export Bookings (CSV)
        </button>
      </div>

      {actionNotice && (
        <div className="dashboard-alert alert-success" role="status">
          ✓ {actionNotice}
        </div>
      )}
      {actionError && (
        <div className="dashboard-alert alert-error" role="alert">
          {actionError}
        </div>
      )}

      {/* PENDING REQUESTS ACTION CARDS */}
      {pendingRequests.length > 0 && (
        <section className="dashboard-panel pending-requests-highlight">
          <div className="dashboard-panel-heading">
            <div>
              <h2 className="highlight-title">⚠️ Action Required: Pending Booking Requests ({pendingRequests.length})</h2>
              <p>Renters are waiting for your approval before pickup can proceed.</p>
            </div>
          </div>

          <div className="pending-requests-list">
            {pendingRequests.map((request) => {
              const car = carMap.get(request.carId);
              const renter = userMap.get(request.renterId);
              const isProcessing = processingId === request.id;

              return (
                <div key={request.id} className="pending-request-card">
                  <div className="pending-card-car">
                    {car?.photos[0] && (
                      <div className="pending-car-thumb">
                        <Image
                          src={car.photos[0]}
                          alt={car ? `${car.make} ${car.model}` : "Car"}
                          fill
                          sizes="80px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div>
                      <strong>{car ? `${car.year} ${car.make} ${car.model}` : "Vehicle"}</strong>
                      <small>{car?.neighbourhood}, Addis Ababa</small>
                    </div>
                  </div>

                  <div className="pending-card-renter">
                    <span className="pending-meta-label">Renter</span>
                    <strong>{renter?.name ?? "Demo Renter"}</strong>
                    <small>{renter?.email}</small>
                  </div>

                  <div className="pending-card-dates">
                    <span className="pending-meta-label">Trip Duration</span>
                    <strong>{formatDemoDate(request.startDate)} – {formatDemoDate(request.endDate)}</strong>
                    <small>{request.days} {request.days === 1 ? "day" : "days"} ({formatEtb(request.pricePerDay)}/day)</small>
                  </div>

                  <div className="pending-card-payout">
                    <span className="pending-meta-label">Your Payout</span>
                    <strong className="payout-amount">{formatEtb(request.subtotal)}</strong>
                    <small>Held in demo escrow</small>
                  </div>

                  <div className="pending-card-actions">
                    <button
                      type="button"
                      className="button button-primary button-small"
                      disabled={isProcessing}
                      onClick={() => handleBookingAction(request.id, "confirmed")}
                    >
                      {isProcessing ? "Updating..." : "✓ Approve Request"}
                    </button>
                    <button
                      type="button"
                      className="button button-outline button-small button-danger"
                      disabled={isProcessing}
                      onClick={() => handleBookingAction(request.id, "declined")}
                    >
                      {isProcessing ? "Updating..." : "✕ Decline"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ALL BOOKINGS TABLE */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>All Reservations for Your Vehicles</h2>
            <p>Showing records strictly assigned to vehicles owned by {user.name}.</p>
          </div>
          <div className="search-wrap">
            <input
              type="search"
              className="form-input search-input-small"
              placeholder="Search renter, car, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${filter === "all" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Bookings ({ownerBookings.length})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "requested" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("requested")}
          >
            Requests ({pendingRequests.length})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "confirmed" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("confirmed")}
          >
            Confirmed ({ownerBookings.filter((b) => b.status === "confirmed").length})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "in_progress" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("in_progress")}
          >
            In Progress ({ownerBookings.filter((b) => b.status === "in_progress").length})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "completed" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed ({ownerBookings.filter((b) => ["completed", "reviewed"].includes(b.status)).length})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "declined_cancelled" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("declined_cancelled")}
          >
            Declined / Cancelled ({ownerBookings.filter((b) => ["declined", "cancelled"].includes(b.status)).length})
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="dashboard-empty">
            <span aria-hidden="true">▤</span>
            <strong>No booking records found</strong>
            <p>
              {ownerBookings.length === 0
                ? "Your listed vehicles have not received any booking requests yet."
                : "No bookings match the selected filters or search terms."}
            </p>
          </div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Renter</th>
                  <th scope="col">Rental Period</th>
                  <th scope="col">Owner Subtotal</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const car = carMap.get(b.carId);
                  const renter = userMap.get(b.renterId);
                  const displayStatus: DashboardStatus = getBookingDisplayStatus(b.status);
                  const statusClass = displayStatus.toLowerCase().replaceAll(" ", "-");
                  const isProcessing = processingId === b.id;

                  return (
                    <tr key={b.id}>
                      <td>
                        <strong>{car ? `${car.make} ${car.model}` : "Car"}</strong>
                        <small>{car ? `${car.year} · ${car.neighbourhood}` : b.carId}</small>
                      </td>
                      <td>
                        <strong>{renter?.name ?? "Demo Renter"}</strong>
                        <small>{renter?.email}</small>
                      </td>
                      <td>
                        <strong>{formatDemoDate(b.startDate)} – {formatDemoDate(b.endDate)}</strong>
                        <small>{b.days} {b.days === 1 ? "day" : "days"} @ {formatEtb(b.pricePerDay)}/d</small>
                      </td>
                      <td>
                        <strong>{formatEtb(b.subtotal)}</strong>
                        <small>Total: {formatEtb(b.total)}</small>
                      </td>
                      <td>
                        <span className={`dashboard-status status-${statusClass}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td>
                        {b.status === "requested" && (
                          <div className="table-row-actions">
                            <button
                              type="button"
                              className="button button-primary button-tiny"
                              disabled={isProcessing}
                              onClick={() => handleBookingAction(b.id, "confirmed")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="button button-outline button-tiny button-danger"
                              disabled={isProcessing}
                              onClick={() => handleBookingAction(b.id, "declined")}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {b.status === "confirmed" && (
                          <button
                            type="button"
                            className="button button-outline button-tiny"
                            disabled={isProcessing}
                            onClick={() => handleBookingAction(b.id, "in_progress")}
                          >
                            Start Trip
                          </button>
                        )}
                        {b.status === "in_progress" && (
                          <button
                            type="button"
                            className="button button-primary button-tiny"
                            disabled={isProcessing}
                            onClick={() => handleBookingAction(b.id, "completed")}
                          >
                            Complete Trip
                          </button>
                        )}
                        {["completed", "reviewed", "cancelled", "declined", "resolved"].includes(b.status) && (
                          <span className="table-done-label">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
