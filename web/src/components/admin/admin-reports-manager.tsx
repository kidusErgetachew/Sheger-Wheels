"use client";

import { useMemo } from "react";
import { formatEtb } from "@/lib/format";
import { exportAdminBookingsCsv, exportAdminFleetCsv, exportAdminUsersCsv } from "@/lib/demo/csv-export";
import type { DemoBooking, DemoCar, DemoUser } from "@/lib/demo/types";

export function AdminReportsManager({
  bookings,
  cars,
  users,
}: {
  bookings: DemoBooking[];
  cars: DemoCar[];
  users: DemoUser[];
}) {
  const metrics = useMemo(() => {
    const grossVolume = bookings.reduce((sum, b) => sum + b.total, 0);
    const platformFees = bookings.reduce((sum, b) => sum + b.fee, 0);
    const completedTrips = bookings.filter((b) =>
      ["completed", "reviewed"].includes(b.status),
    ).length;
    const activeTrips = bookings.filter((b) =>
      ["confirmed", "in_progress"].includes(b.status),
    ).length;
    const cancelledTrips = bookings.filter((b) => b.status === "cancelled").length;

    // Monthly breakdown
    const monthlyMap = new Map<string, { count: number; volume: number; fees: number }>();
    bookings.forEach((b) => {
      const month = b.startDate.slice(0, 7); // YYYY-MM
      const current = monthlyMap.get(month) ?? { count: 0, volume: 0, fees: 0 };
      monthlyMap.set(month, {
        count: current.count + 1,
        volume: current.volume + b.total,
        fees: current.fees + b.fee,
      });
    });

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => ({ month, ...data }));

    // Neighbourhood fleet breakdown
    const nMap = new Map<string, { totalCars: number; approvedCars: number }>();
    cars.forEach((c) => {
      const n = c.neighbourhood || "Addis Ababa";
      const current = nMap.get(n) ?? { totalCars: 0, approvedCars: 0 };
      nMap.set(n, {
        totalCars: current.totalCars + 1,
        approvedCars: current.approvedCars + (c.status === "approved" ? 1 : 0),
      });
    });

    const neighbourhoodBreakdown = Array.from(nMap.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));

    return {
      grossVolume,
      platformFees,
      completedTrips,
      activeTrips,
      cancelledTrips,
      monthlyBreakdown,
      neighbourhoodBreakdown,
    };
  }, [bookings, cars]);

  function handleExportUsers() {
    exportAdminUsersCsv(users, cars, bookings);
  }

  return (
    <div className="admin-reports-space">
      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">ADMIN · REPORTING &amp; ANALYTICS</p>
          <h2>Platform Performance Reports</h2>
          <p>
            Download audit CSV reports and review financial &amp; operational metrics across Addis Ababa.
          </p>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="dashboard-metrics">
        <article className="dashboard-metric">
          <p>Gross Marketplace Volume</p>
          <strong>{formatEtb(metrics.grossVolume)}</strong>
          <small>Across all booked transactions</small>
        </article>
        <article className="dashboard-metric">
          <p>Platform Commission (5%)</p>
          <strong style={{ color: "var(--color-primary, #059669)" }}>
            {formatEtb(metrics.platformFees)}
          </strong>
          <small>5% service fee collected</small>
        </article>
        <article className="dashboard-metric">
          <p>Trip Success Rate</p>
          <strong>
            {bookings.length > 0
              ? `${Math.round((metrics.completedTrips / bookings.length) * 100)}%`
              : "0%"}
          </strong>
          <small>
            {metrics.completedTrips} completed · {metrics.activeTrips} active · {metrics.cancelledTrips} cancelled
          </small>
        </article>
        <article className="dashboard-metric">
          <p>Fleet Listings</p>
          <strong>{cars.length}</strong>
          <small>{cars.filter((c) => c.status === "approved").length} live in catalog</small>
        </article>
      </section>

      {/* CSV Export Actions */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>CSV Data Exports</h2>
            <p>Export formatted comma-separated sheets for bookkeeping and auditing.</p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
          <button
            className="button button-outline"
            onClick={() => exportAdminBookingsCsv(bookings, cars, users)}
            type="button"
          >
            📥 Export All Bookings (CSV)
          </button>
          <button
            className="button button-outline"
            onClick={() => exportAdminFleetCsv(cars, users, bookings)}
            type="button"
          >
            📥 Export Fleet Roster (CSV)
          </button>
          <button
            className="button button-outline"
            onClick={handleExportUsers}
            type="button"
          >
            📥 Export Users Directory (CSV)
          </button>
        </div>
      </section>

      {/* Monthly Performance Table */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Monthly Performance Breakdown</h2>
            <p>Rental volume and platform fee totals by reservation start month.</p>
          </div>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Bookings</th>
                <th scope="col">Gross Volume</th>
                <th scope="col">Platform Fee (5%)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.monthlyBreakdown.map((row) => (
                <tr key={row.month}>
                  <td><strong>{row.month}</strong></td>
                  <td>{row.count} reservations</td>
                  <td>{formatEtb(row.volume)}</td>
                  <td><strong style={{ color: "var(--color-primary, #059669)" }}>{formatEtb(row.fees)}</strong></td>
                </tr>
              ))}
              {metrics.monthlyBreakdown.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>
                    No booking records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Neighbourhood Fleet Distribution */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Fleet by Neighbourhood</h2>
            <p>Vehicle listings density across Addis Ababa sub-cities.</p>
          </div>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Neighbourhood</th>
                <th scope="col">Total Listed Vehicles</th>
                <th scope="col">Approved / Live</th>
              </tr>
            </thead>
            <tbody>
              {metrics.neighbourhoodBreakdown.map((n) => (
                <tr key={n.name}>
                  <td><strong>{n.name}</strong></td>
                  <td>{n.totalCars}</td>
                  <td>{n.approvedCars}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

