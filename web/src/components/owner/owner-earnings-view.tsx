"use client";

import { CarImage } from "@/components/car-image";
import { getOwnerUtilizationMetrics } from "@/lib/demo/dashboard";
import { exportOwnerEarningsCsv } from "@/lib/demo/csv-export";
import { formatDemoDate, formatEtb } from "@/lib/format";
import type { DemoBooking, DemoCar, DemoUser } from "@/lib/demo/types";

export function OwnerEarningsView({
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
  const ownerCars = cars.filter((c) => c.ownerId === user.id);
  const ownerBookings = bookings.filter((b) => b.ownerId === user.id);

  const metrics = getOwnerUtilizationMetrics(ownerCars, ownerBookings);

  const completedTrips = ownerBookings.filter((b) =>
    ["completed", "reviewed"].includes(b.status),
  );

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  function handleExportCsv() {
    exportOwnerEarningsCsv(user, ownerCars, ownerBookings);
  }

  return (
    <div className="owner-earnings-view">
      <div className="listings-header-bar">
        <div>
          <h2>Earnings &amp; Fleet Utilization</h2>
          <p>Financial ledger, payout summaries, and performance analytics for your listed vehicles.</p>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={handleExportCsv}
          disabled={ownerCars.length === 0}
        >
          ⬇ Export Earnings Summary (CSV)
        </button>
      </div>

      {/* METRICS CARDS */}
      <section className="dashboard-metrics" aria-label="Earnings metrics">
        <article className="dashboard-metric">
          <p>Completed Earnings</p>
          <strong>{formatEtb(metrics.completedEarnings)}</strong>
          <small>From {metrics.completedTrips} completed trips</small>
        </article>
        <article className="dashboard-metric">
          <p>Pending / Held Earnings</p>
          <strong>{formatEtb(metrics.pendingEarnings)}</strong>
          <small>Held in demo escrow for {metrics.activeTrips} active trips</small>
        </article>
        <article className="dashboard-metric">
          <p>Fleet Utilization Rate</p>
          <strong>{metrics.fleetUtilizationRate}%</strong>
          <small>{metrics.activeTrips} of {metrics.approvedCars} active cars on trip</small>
        </article>
        <article className="dashboard-metric">
          <p>Total Booked Days</p>
          <strong>{metrics.totalBookedDays} days</strong>
          <small>Avg duration: {metrics.averageTripDuration} days / rental</small>
        </article>
      </section>

      {/* BREAKDOWN BY VEHICLE */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Vehicle Performance &amp; Utilization</h2>
            <p>Rental activity and gross earnings breakdown per vehicle.</p>
          </div>
        </div>

        {ownerCars.length === 0 ? (
          <div className="dashboard-empty">
            <span aria-hidden="true">◈</span>
            <strong>No vehicles listed</strong>
            <p>Add a vehicle to view earnings analytics.</p>
          </div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Daily Rate</th>
                  <th scope="col">Total Trips</th>
                  <th scope="col">Days Rented</th>
                  <th scope="col">Completed Payout</th>
                  <th scope="col">Fleet Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.carBreakdown.map(({ car, bookingsCount, daysRented, completedEarnings, displayStatus }) => {
                  const statusClass = displayStatus.toLowerCase().replaceAll(" ", "-");
                  return (
                    <tr key={car.id}>
                      <td>
                        <div className="vehicle-cell-wrap">
                          <div className="vehicle-cell-thumb">
                            <CarImage
                              src={car.photos[0]}
                              alt={`${car.make} ${car.model}`}
                              fill
                              sizes="40px"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <div>
                            <strong>{car.make} {car.model} ({car.year})</strong>
                            <small>{car.neighbourhood}, Addis Ababa</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{formatEtb(car.pricePerDay)}</strong>
                        <small>/ day</small>
                      </td>
                      <td>
                        <strong>{bookingsCount}</strong>
                        <small>{bookingsCount === 1 ? "booking" : "bookings"}</small>
                      </td>
                      <td>
                        <strong>{daysRented}</strong>
                        <small>days on road</small>
                      </td>
                      <td>
                        <strong className="payout-amount">{formatEtb(completedEarnings)}</strong>
                      </td>
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
        )}
      </section>

      {/* COMPLETED TRIPS LEDGER */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Completed Trips Ledger</h2>
            <p>Official record of all completed and reviewed reservations for this account.</p>
          </div>
          <span>{completedTrips.length} completed records</span>
        </div>

        {completedTrips.length === 0 ? (
          <div className="dashboard-empty">
            <span aria-hidden="true">▤</span>
            <strong>No completed trips yet</strong>
            <p>When renters complete their trips, your earnings and payout records will appear here.</p>
          </div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Booking ID</th>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Renter</th>
                  <th scope="col">Rental Period</th>
                  <th scope="col">Days</th>
                  <th scope="col">Owner Net Subtotal</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedTrips.map((b) => {
                  const car = carMap.get(b.carId);
                  const renter = userMap.get(b.renterId);
                  return (
                    <tr key={b.id}>
                      <td>
                        <code>{b.id.slice(0, 16)}</code>
                        <small>{b.createdAt.slice(0, 10)}</small>
                      </td>
                      <td>
                        <strong>{car ? `${car.make} ${car.model}` : "Car"}</strong>
                        <small>{car?.neighbourhood}</small>
                      </td>
                      <td>
                        <strong>{renter?.name ?? "Demo Renter"}</strong>
                        <small>{renter?.email}</small>
                      </td>
                      <td>
                        <strong>{formatDemoDate(b.startDate)} – {formatDemoDate(b.endDate)}</strong>
                      </td>
                      <td>{b.days}</td>
                      <td>
                        <strong className="payout-amount">{formatEtb(b.subtotal)}</strong>
                      </td>
                      <td>
                        <span className="dashboard-status status-completed">
                          Completed
                        </span>
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
