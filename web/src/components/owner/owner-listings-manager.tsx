"use client";

import Link from "next/link";
import { useState } from "react";
import { CarImage } from "@/components/car-image";
import { toggleDemoCarStatus } from "@/lib/demo/car-actions";
import { formatEtb } from "@/lib/format";
import { getVehicleType } from "@/lib/demo/catalog";
import type { DemoBooking, DemoCar, DemoUser } from "@/lib/demo/types";

export function OwnerListingsManager({
  user,
  cars,
  bookings,
}: {
  user: DemoUser;
  cars: DemoCar[];
  bookings: DemoBooking[];
}) {
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "inactive" | "rejected">("all");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const ownerCars = cars.filter((c) => c.ownerId === user.id);

  const filteredCars = ownerCars.filter((car) => {
    if (filter === "all") return true;
    return car.status === filter;
  });

  async function handleToggleStatus(carId: string) {
    setActionError("");
    setActionSuccess("");
    setProcessingId(carId);

    const result = toggleDemoCarStatus(carId);
    setProcessingId(null);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    const newStatus = result.value.status;
    setActionSuccess(
      newStatus === "inactive"
        ? `Listing for ${result.value.make} ${result.value.model} has been deactivated.`
        : `Listing for ${result.value.make} ${result.value.model} is now active and approved for booking!`,
    );
  }

  return (
    <div className="owner-listings-manager">
      <div className="listings-header-bar">
        <div>
          <h2>Vehicle Fleet Management</h2>
          <p>Create, update specs, and control availability for your listed vehicles.</p>
        </div>
        <Link className="button button-primary" href="/owner/listings/new">
          + Add New Vehicle
        </Link>
      </div>

      {actionError && (
        <div className="dashboard-alert alert-error" role="alert">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="dashboard-alert alert-success" role="status">
          ✓ {actionSuccess}
        </div>
      )}

      <div className="filter-tabs">
        <button
          type="button"
          className={`filter-tab${filter === "all" ? " filter-tab-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({ownerCars.length})
        </button>
        <button
          type="button"
          className={`filter-tab${filter === "approved" ? " filter-tab-active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          Active / Approved ({ownerCars.filter((c) => c.status === "approved").length})
        </button>
        <button
          type="button"
          className={`filter-tab${filter === "pending" ? " filter-tab-active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending Review ({ownerCars.filter((c) => c.status === "pending").length})
        </button>
        <button
          type="button"
          className={`filter-tab${filter === "inactive" ? " filter-tab-active" : ""}`}
          onClick={() => setFilter("inactive")}
        >
          Deactivated ({ownerCars.filter((c) => c.status === "inactive").length})
        </button>
        {ownerCars.some((c) => c.status === "rejected") && (
          <button
            type="button"
            className={`filter-tab${filter === "rejected" ? " filter-tab-active" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            Rejected ({ownerCars.filter((c) => c.status === "rejected").length})
          </button>
        )}
      </div>

      {filteredCars.length === 0 ? (
        <div className="dashboard-panel dashboard-empty">
          <span aria-hidden="true">▣</span>
          <strong>No vehicles in this section</strong>
          <p>
            {ownerCars.length === 0
              ? "You haven't listed any vehicles yet. Click '+ Add New Vehicle' above to list your first car."
              : `No vehicles currently match the "${filter}" filter tab.`}
          </p>
          {ownerCars.length === 0 && (
            <Link className="button button-primary" href="/owner/listings/new">
              List a Vehicle Now
            </Link>
          )}
        </div>
      ) : (
        <div className="owner-cars-grid">
          {filteredCars.map((car) => {
            const carBookings = bookings.filter((b) => b.carId === car.id);
            const activeReservations = carBookings.filter((b) =>
              ["requested", "confirmed", "in_progress"].includes(b.status),
            ).length;
            const isProcessing = processingId === car.id;

            let statusLabel = "Approved";
            let statusClass = "status-available";
            if (car.status === "pending") {
              statusLabel = "Pending Admin Review";
              statusClass = "status-pending";
            } else if (car.status === "inactive") {
              statusLabel = "Deactivated";
              statusClass = "status-inactive";
            } else if (car.status === "rejected") {
              statusLabel = "Rejected";
              statusClass = "status-cancelled";
            }

            return (
              <article key={car.id} className="owner-car-card">
                <div className="owner-car-card-media">
                  <CarImage
                    src={car.photos[0]}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    style={{ objectFit: "cover" }}
                  />
                  <span className={`dashboard-status ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="owner-car-card-body">
                  <div className="owner-car-title-row">
                    <div>
                      <h3>{car.year} {car.make} {car.model}</h3>
                      <p className="owner-car-specs">
                        {getVehicleType(car)} · {car.transmission} · {car.seats} seats · {car.neighbourhood}
                      </p>
                    </div>
                    <div className="owner-car-price">
                      <strong>{formatEtb(car.pricePerDay)}</strong>
                      <small>/ day</small>
                    </div>
                  </div>

                  <p className="owner-car-desc">{car.description}</p>

                  <div className="owner-car-stats-bar">
                    <span><strong>{carBookings.length}</strong> total bookings</span>
                    <span><strong>{activeReservations}</strong> active / pending</span>
                  </div>

                  {car.status === "pending" && (
                    <div className="owner-car-status-tip tip-pending">
                      ⏳ Awaiting administrator review. Once approved, it will be visible in public search.
                    </div>
                  )}
                  {car.status === "rejected" && (
                    <div className="owner-car-status-tip tip-rejected">
                      ✕ Listing rejected by admin. Edit details and re-submit for review.
                    </div>
                  )}
                  {car.status === "inactive" && (
                    <div className="owner-car-status-tip tip-inactive">
                      ⏸ Listing is deactivated. Renters cannot see or book this car.
                    </div>
                  )}

                  <div className="owner-car-card-actions">
                    <Link
                      className="button button-outline button-small"
                      href={`/owner/listings/edit?id=${encodeURIComponent(car.id)}`}
                    >
                      ✎ Edit Details
                    </Link>

                    {car.status === "approved" && (
                      <button
                        type="button"
                        className="button button-outline button-small button-danger"
                        disabled={isProcessing}
                        onClick={() => handleToggleStatus(car.id)}
                      >
                        {isProcessing ? "Processing..." : "Deactivate Listing"}
                      </button>
                    )}

                    {car.status === "inactive" && (
                      <button
                        type="button"
                        className="button button-primary button-small"
                        disabled={isProcessing}
                        onClick={() => handleToggleStatus(car.id)}
                      >
                        {isProcessing ? "Processing..." : "Reactivate Listing"}
                      </button>
                    )}

                    <Link
                      className="owner-view-public"
                      href={`/cars/${car.id}`}
                      target="_blank"
                    >
                      View public card ↗
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
