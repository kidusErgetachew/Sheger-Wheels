"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCurrentDemoSession } from "@/lib/demo/session-store";
import { useBookingData } from "@/lib/demo/booking-store";
import { getBookingDisplayStatus } from "@/lib/demo/dashboard";
import { signOut } from "@/lib/demo/session";
import { formatDemoDate, formatEtb } from "@/lib/format";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";

export function RenterDashboard({ section }: { section: "dashboard" | "bookings" }) {
  const router = useRouter();
  const { user } = useCurrentDemoSession();
  const { bookings, cars, error } = useBookingData();
  const [signOutError, setSignOutError] = useState("");
  const ownBookings = user
    ? bookings.filter((booking) => booking.renterId === user.id)
    : [];
  const activeCount = ownBookings.filter((booking) =>
    ["confirmed", "in_progress"].includes(booking.status),
  ).length;

  function handleSignOut() {
    const result = signOut();
    if (!result.ok) {
      setSignOutError(result.error);
      return;
    }
    router.push("/");
  }

  return (
    <div className="dashboard-app renter-dashboard">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/" aria-label="Sheggar Wheels home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span><strong>Sheggar Wheels</strong><small>Drive Addis</small></span>
        </Link>
        <p className="dashboard-sidebar-label">RENTER SPACE</p>
        <nav aria-label="Renter dashboard navigation" className="dashboard-nav">
          <Link aria-current={section === "dashboard" ? "page" : undefined} className={`dashboard-nav-link${section === "dashboard" ? " dashboard-nav-active" : ""}`} href="/renter">
            <span aria-hidden="true">▦</span> Dashboard
          </Link>
          <Link aria-current={section === "bookings" ? "page" : undefined} className={`dashboard-nav-link${section === "bookings" ? " dashboard-nav-active" : ""}`} href="/renter/bookings">
            <span aria-hidden="true">▤</span> My bookings
          </Link>
          <Link className="dashboard-nav-link" href="/cars">
            <span aria-hidden="true">⌕</span> Browse cars
          </Link>
        </nav>
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-sidebar-user">
            <span aria-hidden="true">{user?.name.slice(0, 1) ?? "R"}</span>
            <span><strong>{user?.name ?? "Demo renter"}</strong><small>Renter account</small></span>
          </div>
          <button className="dashboard-logout" onClick={handleSignOut} type="button">
            <span aria-hidden="true">↪</span> Log out
          </button>
          {signOutError && <p className="dashboard-logout-error" role="alert">{signOutError}</p>}
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="eyebrow">RENTER WORKSPACE</p>
            <h1>{section === "dashboard" ? "My rentals" : "Booking history"}</h1>
          </div>
          <div className="dashboard-topbar-actions">
            <NotificationCenter />
            <ThemeToggle variant="dashboard" showLabel={true} />
            <span className="dashboard-demo-label"><span /> Fictional demo data</span>
          </div>
        </header>
        <div className="dashboard-content">
          {error && <p className="dashboard-alert" role="alert">{error}</p>}
          {section === "dashboard" && (
            <>
              <section className="dashboard-welcome">
                <div>
                  <p className="eyebrow">ADDIS ABABA · RENTER OVERVIEW</p>
                  <h2>{user ? `Welcome, ${user.name.split(" ")[0]}.` : "Your rental overview."}</h2>
                  <p>Manage your fictional demo trips and find a car for your next journey.</p>
                </div>
                <Link className="button button-primary" href="/cars">Browse cars <span aria-hidden="true">→</span></Link>
              </section>
              <section className="dashboard-metrics" aria-label="Your demo booking summary">
                <article className="dashboard-metric"><p>Total bookings</p><strong>{ownBookings.length}</strong><small>Fictional saved trips</small></article>
                <article className="dashboard-metric"><p>Active trips</p><strong>{activeCount}</strong><small>Confirmed or in progress</small></article>
                <article className="dashboard-metric"><p>Demo spend</p><strong>{formatEtb(ownBookings.reduce((sum, booking) => sum + booking.total, 0))}</strong><small>Including demo service fees</small></article>
              </section>
            </>
          )}
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div><h2>{section === "dashboard" ? "Recent bookings" : "All your bookings"}</h2><p>Only bookings created by this signed-in renter are shown.</p></div>
              {section === "dashboard" && <Link href="/renter/bookings">View history <span aria-hidden="true">→</span></Link>}
            </div>
            {ownBookings.length === 0 ? (
              <div className="dashboard-empty">
                <span aria-hidden="true">▤</span>
                <strong>No bookings yet</strong>
                <p>Choose a car, select dates, and review the demo total to start a booking.</p>
                <Link className="button button-primary" href="/cars">Find a car</Link>
              </div>
            ) : (
              <ul className="renter-booking-list">
                {ownBookings
                  .slice()
                  .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
                  .map((booking) => {
                    const car = cars.find((item) => item.id === booking.carId);
                    return (
                      <li className="renter-booking-row" key={booking.id}>
                        <div className="renter-booking-copy">
                          <strong>{car ? `${car.make} ${car.model}` : "Demo vehicle"}</strong>
                          <span>{formatDemoDate(booking.startDate)} – {formatDemoDate(booking.endDate)} · {booking.days} {booking.days === 1 ? "day" : "days"}</span>
                          <span>{formatEtb(booking.total)} total</span>
                        </div>
                        <span className={`dashboard-status status-${getBookingDisplayStatus(booking.status).toLowerCase().replaceAll(" ", "-")}`}>
                          {getBookingDisplayStatus(booking.status)}
                        </span>
                        <Link className="button button-outline" href={`/booking?bookingId=${encodeURIComponent(booking.id)}`}>View booking</Link>
                      </li>
                    );
                  })
                  .slice(0, section === "dashboard" ? 4 : undefined)}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
