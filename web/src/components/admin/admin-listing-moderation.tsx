"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { adminModerateCar } from "@/lib/demo/car-actions";
import { exportAdminFleetCsv } from "@/lib/demo/csv-export";
import { formatEtb } from "@/lib/format";
import { getVehicleType } from "@/lib/demo/catalog";
import type { DemoBooking, DemoCar, DemoUser } from "@/lib/demo/types";

export function AdminListingModeration({
  cars,
  users,
  bookings,
}: {
  cars: DemoCar[];
  users: DemoUser[];
  bookings: DemoBooking[];
}) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "inactive" | "all">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const userMap = new Map(users.map((u) => [u.id, u]));

  const pendingCount = cars.filter((c) => c.status === "pending").length;
  const approvedCount = cars.filter((c) => c.status === "approved").length;
  const rejectedCount = cars.filter((c) => c.status === "rejected").length;
  const inactiveCount = cars.filter((c) => c.status === "inactive").length;

  const filteredCars = cars.filter((car) => {
    if (filter !== "all" && car.status !== filter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const owner = userMap.get(car.ownerId);
      const matchVehicle = `${car.make} ${car.model} ${car.neighbourhood}`.toLowerCase().includes(q);
      const matchOwner = owner && `${owner.name} ${owner.email}`.toLowerCase().includes(q);
      const matchId = car.id.toLowerCase().includes(q);
      if (!matchVehicle && !matchOwner && !matchId) return false;
    }

    return true;
  });

  async function handleModerate(carId: string, newStatus: "approved" | "rejected") {
    setActionError("");
    setActionSuccess("");
    setProcessingId(carId);

    const result = adminModerateCar(carId, newStatus);
    setProcessingId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    const actionWord = newStatus === "approved" ? "approved" : "rejected";
    setActionSuccess(`Vehicle "${result.value.make} ${result.value.model}" was ${actionWord} successfully.`);
  }

  function handleExportCsv() {
    exportAdminFleetCsv(cars, users, bookings);
  }

  return (
    <div className="admin-listing-moderation">
      <div className="listings-header-bar">
        <div>
          <h2>Vehicle Listing Moderation</h2>
          <p>Review newly submitted vehicles, approve verified listings, and revoke non-compliant entries.</p>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={handleExportCsv}
        >
          ⬇ Export Platform Fleet (CSV)
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

      <div className="moderation-controls-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${filter === "pending" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "approved" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("approved")}
          >
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "rejected" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "inactive" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("inactive")}
          >
            Inactive ({inactiveCount})
          </button>
          <button
            type="button"
            className={`filter-tab${filter === "all" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Vehicles ({cars.length})
          </button>
        </div>

        <div className="search-wrap">
          <input
            type="search"
            className="form-input search-input-small"
            placeholder="Search make, model, owner, neighbourhood..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredCars.length === 0 ? (
        <div className="dashboard-panel dashboard-empty">
          <span aria-hidden="true">▣</span>
          <strong>No vehicles found</strong>
          <p>
            {filter === "pending"
              ? "All submitted vehicles have been reviewed! There are no pending listings awaiting approval."
              : `No vehicles match the "${filter}" filter criteria.`}
          </p>
        </div>
      ) : (
        <div className="dashboard-panel">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Specifications</th>
                  <th scope="col">Daily Rate</th>
                  <th scope="col">Status</th>
                  <th scope="col">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map((car) => {
                  const owner = userMap.get(car.ownerId);
                  const isProcessing = processingId === car.id;

                  let statusClass = "status-available";
                  let statusText = "Approved";
                  if (car.status === "pending") {
                    statusClass = "status-pending";
                    statusText = "Pending Review";
                  } else if (car.status === "rejected") {
                    statusClass = "status-cancelled";
                    statusText = "Rejected";
                  } else if (car.status === "inactive") {
                    statusClass = "status-inactive";
                    statusText = "Inactive";
                  }

                  return (
                    <tr key={car.id}>
                      <td>
                        <div className="vehicle-cell-wrap">
                          <div className="vehicle-cell-thumb">
                            <Image
                              src={car.photos[0]}
                              alt={`${car.make} ${car.model}`}
                              fill
                              sizes="48px"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <div>
                            <strong>{car.year} {car.make} {car.model}</strong>
                            <small>{car.neighbourhood}, Addis Ababa · <code>{car.id}</code></small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{owner?.name ?? "Unknown Owner"}</strong>
                        <small>
                          {owner?.email} · {owner?.status === "suspended" ? <span className="text-danger">Suspended</span> : "Active"}
                        </small>
                      </td>
                      <td>
                        <strong>{getVehicleType(car)} · {car.transmission}</strong>
                        <small>{car.seats} seats · {car.unavailableDates.length} blocked dates</small>
                      </td>
                      <td>
                        <strong>{formatEtb(car.pricePerDay)}</strong>
                        <small>/ day</small>
                      </td>
                      <td>
                        <span className={`dashboard-status ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td>
                        <div className="table-row-actions">
                          {car.status !== "approved" && (
                            <button
                              type="button"
                              className="button button-primary button-tiny"
                              disabled={isProcessing}
                              onClick={() => handleModerate(car.id, "approved")}
                            >
                              {isProcessing ? "Saving..." : "✓ Approve"}
                            </button>
                          )}
                          {car.status !== "rejected" && (
                            <button
                              type="button"
                              className="button button-outline button-tiny button-danger"
                              disabled={isProcessing}
                              onClick={() => handleModerate(car.id, "rejected")}
                            >
                              {isProcessing ? "Saving..." : "✕ Reject"}
                            </button>
                          )}
                          <Link
                            className="button button-outline button-tiny"
                            href={`/cars/${car.id}`}
                            target="_blank"
                          >
                            Preview
                          </Link>
                        </div>
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
