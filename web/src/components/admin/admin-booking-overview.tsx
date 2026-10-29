"use client";

import { useState } from "react";
import Image from "next/image";
import { getBookingDisplayStatus, type DashboardStatus } from "@/lib/demo/dashboard";
import { exportAdminBookingsCsv } from "@/lib/demo/csv-export";
import { formatDemoDate, formatEtb } from "@/lib/format";
import type { DemoBooking, DemoCar, DemoUser } from "@/lib/demo/types";

export function AdminBookingOverview({
  bookings,
  cars,
  users,
}: {
  bookings: DemoBooking[];
  cars: DemoCar[];
  users: DemoUser[];
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const statusCounts: Record<string, number> = {
    all: bookings.length,
    requested: bookings.filter((b) => b.status === "requested").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    in_progress: bookings.filter((b) => b.status === "in_progress").length,
    completed: bookings.filter((b) => ["completed", "reviewed"].includes(b.status)).length,
    disputed: bookings.filter((b) => b.status === "disputed").length,
    resolved: bookings.filter((b) => b.status === "resolved").length,
    cancelled: bookings.filter((b) => ["cancelled", "declined"].includes(b.status)).length,
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "requested" && b.status !== "requested") return false;
    if (statusFilter === "confirmed" && b.status !== "confirmed") return false;
    if (statusFilter === "in_progress" && b.status !== "in_progress") return false;
    if (statusFilter === "completed" && !["completed", "reviewed"].includes(b.status)) return false;
    if (statusFilter === "disputed" && b.status !== "disputed") return false;
    if (statusFilter === "resolved" && b.status !== "resolved") return false;
    if (statusFilter === "cancelled" && !["cancelled", "declined"].includes(b.status)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const car = carMap.get(b.carId);
      const owner = userMap.get(b.ownerId);
      const renter = userMap.get(b.renterId);

      const matchCar = car && `${car.make} ${car.model}`.toLowerCase().includes(q);
      const matchOwner = owner && `${owner.name} ${owner.email}`.toLowerCase().includes(q);
      const matchRenter = renter && `${renter.name} ${renter.email}`.toLowerCase().includes(q);
      const matchId = b.id.toLowerCase().includes(q);

      if (!matchCar && !matchOwner && !matchRenter && !matchId) return false;
    }

    return true;
  });

  function handleExportCsv() {
    exportAdminBookingsCsv(bookings, cars, users);
  }

  return (
    <div className="admin-booking-overview">
      <div className="listings-header-bar">
        <div>
          <h2>Platform Booking Ledger</h2>
          <p>Master overview of all car reservations, fee calculations, and transaction records.</p>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={handleExportCsv}
        >
          ⬇ Export Platform Bookings (CSV)
        </button>
      </div>

      {/* QUICK STATUS PILLS ROW */}
      <div className="admin-status-counts-row">
        {[
          { key: "all", label: "All Bookings", count: statusCounts.all },
          { key: "requested", label: "Requested", count: statusCounts.requested, pill: "status-pending" },
          { key: "confirmed", label: "Confirmed", count: statusCounts.confirmed, pill: "status-confirmed" },
          { key: "in_progress", label: "In Progress", count: statusCounts.in_progress, pill: "status-in-progress" },
          { key: "completed", label: "Completed", count: statusCounts.completed, pill: "status-completed" },
          { key: "disputed", label: "Disputed", count: statusCounts.disputed, pill: "status-disputed" },
          { key: "resolved", label: "Resolved", count: statusCounts.resolved, pill: "status-resolved" },
          { key: "cancelled", label: "Cancelled", count: statusCounts.cancelled, pill: "status-cancelled" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={`admin-status-card${statusFilter === item.key ? " admin-status-card-active" : ""}`}
            onClick={() => setStatusFilter(item.key)}
          >
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </div>

      <div className="moderation-controls-bar">
        <div className="search-wrap" style={{ maxWidth: "420px" }}>
          <input
            type="search"
            className="form-input search-input-small"
            placeholder="Search booking ID, car, owner, or renter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span>{filteredBookings.length} bookings matching</span>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="dashboard-panel dashboard-empty">
          <span aria-hidden="true">▤</span>
          <strong>No bookings found</strong>
          <p>No platform reservations match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="dashboard-panel">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Booking</th>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Participants</th>
                  <th scope="col">Rental Period</th>
                  <th scope="col">Subtotal</th>
                  <th scope="col">Fee (5%)</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const car = carMap.get(b.carId);
                  const owner = userMap.get(b.ownerId);
                  const renter = userMap.get(b.renterId);
                  const displayStatus: DashboardStatus = getBookingDisplayStatus(b.status);
                  const statusClass = displayStatus.toLowerCase().replaceAll(" ", "-");

                  return (
                    <tr key={b.id}>
                      <td>
                        <code>{b.id.slice(0, 18)}</code>
                        <small>{b.createdAt.slice(0, 10)}</small>
                      </td>
                      <td>
                        <div className="vehicle-cell-wrap">
                          {car?.photos[0] && (
                            <div className="vehicle-cell-thumb">
                              <Image
                                src={car.photos[0]}
                                alt={car ? `${car.make} ${car.model}` : "Car"}
                                fill
                                sizes="36px"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          )}
                          <div>
                            <strong>{car ? `${car.make} ${car.model}` : "Car"}</strong>
                            <small>{car?.neighbourhood}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>Renter: {renter?.name ?? "Renter"}</strong>
                        <small>Owner: {owner?.name ?? "Owner"}</small>
                      </td>
                      <td>
                        <strong>{formatDemoDate(b.startDate)} – {formatDemoDate(b.endDate)}</strong>
                        <small>{b.days} {b.days === 1 ? "day" : "days"}</small>
                      </td>
                      <td>{formatEtb(b.subtotal)}</td>
                      <td className="text-accent">{formatEtb(b.fee)}</td>
                      <td><strong>{formatEtb(b.total)}</strong></td>
                      <td>
                        <span className={`dashboard-status status-${statusClass}`}>
                          {displayStatus}
                        </span>
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
