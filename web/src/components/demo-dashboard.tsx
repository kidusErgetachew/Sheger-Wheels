"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useSyncExternalStore } from "react";
import { CarImage } from "@/components/car-image";
import { useCurrentDemoSession } from "@/lib/demo/session-store";
import { signOut } from "@/lib/demo/session";
import {
  getAdminPlatformMetrics,
  getBookingDisplayStatus,
  getOwnerEarnings,
  getOwnerUtilizationMetrics,
  getVehicleListingStatus,
  type DashboardStatus,
} from "@/lib/demo/dashboard";
import { getVehicleType } from "@/lib/demo/catalog";
import {
  DEMO_DATA_CHANGE_EVENT,
  initializeDemoData,
  readDemoCollection,
} from "@/lib/demo/storage";
import { DEMO_DATA } from "@/lib/demo/seed";
import { formatEtb } from "@/lib/format";
import { localIsoDate } from "@/lib/dates";
import { OwnerCarForm } from "@/components/owner/owner-car-form";
import { OwnerListingsManager } from "@/components/owner/owner-listings-manager";
import { OwnerRequestsManager } from "@/components/owner/owner-requests-manager";
import { OwnerEarningsView } from "@/components/owner/owner-earnings-view";
import { AdminListingModeration } from "@/components/admin/admin-listing-moderation";
import { AdminUserManager } from "@/components/admin/admin-user-manager";
import { AdminBookingOverview } from "@/components/admin/admin-booking-overview";
import { AdminDisputeManager } from "@/components/admin/admin-dispute-manager";
import { AdminAnnouncementsManager } from "@/components/admin/admin-announcements-manager";
import { AdminReportsManager } from "@/components/admin/admin-reports-manager";
import { OwnerReviewsManager } from "@/components/owner/owner-reviews-manager";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";
import type { DashboardSection } from "@/components/dashboard-route";
import type {
  DemoBooking,
  DemoCar,
  DemoData,
  DemoUser,
  UserRole,
} from "@/lib/demo/types";

type DashboardSnapshot = {
  data: DemoData;
  error: string;
};

function getSnapshot(): string {
  const users = readDemoCollection("users");
  const cars = readDemoCollection("cars");
  const bookings = readDemoCollection("bookings");
  const disputes = readDemoCollection("disputes");
  const announcements = readDemoCollection("announcements");
  const reviews = readDemoCollection("reviews");
  const errors = [users, cars, bookings, disputes, announcements, reviews]
    .filter((result) => !result.ok)
    .map((result) => result.error);

  return JSON.stringify({
    data: {
      ...DEMO_DATA,
      users: users.ok ? users.value : DEMO_DATA.users,
      cars: cars.ok ? cars.value : DEMO_DATA.cars,
      bookings: bookings.ok ? bookings.value : DEMO_DATA.bookings,
      disputes: disputes.ok ? disputes.value : DEMO_DATA.disputes,
      announcements: announcements.ok ? announcements.value : DEMO_DATA.announcements,
      reviews: reviews.ok ? reviews.value : DEMO_DATA.reviews,
    },
    error: errors.join(" "),
  } satisfies DashboardSnapshot);
}

function subscribe(onChange: () => void): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key.startsWith("sw_")) onChange();
  }
  window.addEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  initializeDemoData();
  return () => {
    window.removeEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

const OWNER_NAVIGATION: { section: DashboardSection; label: string; icon: string }[] = [
  { section: "dashboard", label: "Dashboard", icon: "▦" },
  { section: "listings", label: "My listings", icon: "▣" },
  { section: "bookings", label: "Bookings & requests", icon: "▤" },
  { section: "earnings", label: "Earnings & utilization", icon: "◈" },
  { section: "reviews", label: "Reviews & feedback", icon: "★" },
  { section: "profile", label: "Profile", icon: "◉" },
  { section: "settings", label: "Settings", icon: "⚙" },
];

const ADMIN_NAVIGATION: { section: DashboardSection; label: string; icon: string }[] = [
  { section: "dashboard", label: "Dashboard", icon: "▦" },
  { section: "listings", label: "Listing approvals", icon: "▣" },
  { section: "users", label: "User accounts", icon: "👥" },
  { section: "bookings", label: "Platform bookings", icon: "▤" },
  { section: "disputes", label: "Disputes", icon: "⚖" },
  { section: "announcements", label: "Announcements", icon: "📢" },
  { section: "reports", label: "Reports & exports", icon: "📊" },
  { section: "profile", label: "Profile", icon: "◉" },
  { section: "settings", label: "Settings", icon: "⚙" },
];

const STATUS_GUIDE: DashboardStatus[] = [
  "Available",
  "Booked",
  "Pending",
  "Cancelled",
  "Maintenance",
];

function sectionHref(role: UserRole, section: DashboardSection): string {
  if (section === "dashboard") return `/${role}`;
  if (section === "new-listing") return `/${role}/listings/new`;
  if (section === "edit-listing") return `/${role}/listings/edit`;
  return `/${role}/${section}`;
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-ET", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayBookingPeriod(booking: DemoBooking): string {
  return `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`;
}

function StatusPill({ status }: { status: DashboardStatus }) {
  const className = status.toLocaleLowerCase().replaceAll(" ", "-");
  return <span className={`dashboard-status status-${className}`}>{status}</span>;
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <article className="dashboard-metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function DashboardSidebar({
  role,
  section,
  user,
}: {
  role: "owner" | "admin";
  section: DashboardSection;
  user: DemoUser;
}) {
  const router = useRouter();
  const [signOutError, setSignOutError] = useState("");
  const navigation = role === "owner" ? OWNER_NAVIGATION : ADMIN_NAVIGATION;

  function handleSignOut() {
    const result = signOut();
    if (!result.ok) {
      setSignOutError(result.error);
      return;
    }
    router.push("/");
  }

  return (
    <aside className="dashboard-sidebar">
      <Link className="dashboard-brand" href="/" aria-label="Sheggar Wheels home">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span><strong>Sheggar Wheels</strong><small>Drive Addis</small></span>
      </Link>
      <p className="dashboard-sidebar-label">{role === "owner" ? "OWNER SPACE" : "ADMIN SPACE"}</p>
      <nav aria-label={`${role} dashboard navigation`} className="dashboard-nav">
        {navigation.map((item) => {
          const active =
            item.section === section ||
            (item.section === "listings" && (section === "new-listing" || section === "edit-listing"));
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`dashboard-nav-link${active ? " dashboard-nav-active" : ""}`}
              href={sectionHref(role, item.section)}
              key={item.section}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="dashboard-sidebar-bottom">
        <div className="dashboard-sidebar-user">
          <span aria-hidden="true">{user.name.slice(0, 1)}</span>
          <span><strong>{user.name}</strong><small>{role === "admin" ? "Demo administrator" : "Vehicle owner"}</small></span>
        </div>
        <button className="dashboard-logout" onClick={handleSignOut} type="button">
          <span aria-hidden="true">↪</span> Log out
        </button>
        {signOutError && <p className="dashboard-logout-error" role="alert">{signOutError}</p>}
      </div>
    </aside>
  );
}

function VehicleRow({
  car,
  bookings,
}: {
  car: DemoCar;
  bookings: DemoBooking[];
}) {
  return (
    <li className="dashboard-vehicle-row">
      <div className="dashboard-vehicle-image">
        <CarImage
          alt={`${car.year} ${car.make} ${car.model}`}
          fill
          sizes="76px"
          src={car.photos[0]}
        />
      </div>
      <div className="dashboard-vehicle-copy">
        <strong>{car.make} {car.model}</strong>
        <small>{getVehicleType(car)} · {formatEtb(car.pricePerDay)} / day · {car.neighbourhood}</small>
      </div>
      <StatusPill status={getVehicleListingStatus(car, bookings)} />
    </li>
  );
}

function BookingTable({
  bookings,
  cars,
  users,
  role,
}: {
  bookings: DemoBooking[];
  cars: DemoCar[];
  users: DemoUser[];
  role: "owner" | "admin";
}) {
  if (bookings.length === 0) {
    return (
      <div className="dashboard-empty">
        <span aria-hidden="true">▤</span>
        <strong>No demo bookings yet</strong>
        <p>Booking records shown here are fictional examples from the seed data.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th scope="col">Vehicle</th>
            <th scope="col">{role === "owner" ? "Renter" : "Customer / ID"}</th>
            <th scope="col">Trip dates</th>
            <th scope="col">Total</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const car = cars.find((item) => item.id === booking.carId);
            const renter = users.find((item) => item.id === booking.renterId);
            return (
              <tr key={booking.id}>
                <td>
                  <strong>{car ? `${car.make} ${car.model}` : "Demo vehicle"}</strong>
                  <small>{car?.neighbourhood ?? "Addis Ababa"}</small>
                </td>
                <td>{role === "owner" ? renter?.name ?? "Demo renter" : `${renter?.name ?? "Renter"} (${booking.id.replace("booking-", "").slice(0, 8)})`}</td>
                <td>{displayBookingPeriod(booking)}</td>
                <td>{formatEtb(booking.total)}</td>
                <td><StatusPill status={getBookingDisplayStatus(booking.status)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusGuide() {
  return (
    <section className="dashboard-panel status-guide" aria-labelledby="status-guide-heading">
      <div className="dashboard-panel-heading">
        <div><h2 id="status-guide-heading">Status labels</h2><p>Vehicle availability at a glance</p></div>
      </div>
      <div className="status-guide-list">
        {STATUS_GUIDE.map((status) => <StatusPill key={status} status={status} />)}
      </div>
    </section>
  );
}

function OwnerEditParamReader({
  user,
  cars,
}: {
  user: DemoUser;
  cars: DemoCar[];
}) {
  const searchParams = useSearchParams();
  const carId = searchParams.get("id") ?? "";
  const existingCar = cars.find((c) => c.id === carId);

  return (
    <OwnerCarForm
      user={user}
      existingCar={existingCar}
      targetCarId={carId}
      isEdit={true}
    />
  );
}

function DashboardContent({
  role,
  section,
  user,
  data,
  error,
}: {
  role: "owner" | "admin";
  section: DashboardSection;
  user: DemoUser;
  data: DemoData;
  error: string;
}) {
  const ownerCars = useMemo(
    () => data.cars.filter((car) => car.ownerId === user.id),
    [data.cars, user.id],
  );
  const relevantBookings = useMemo(
    () => role === "owner"
      ? data.bookings.filter((booking) => booking.ownerId === user.id)
      : data.bookings,
    [data.bookings, role, user.id],
  );

  const earnings = role === "owner" ? getOwnerEarnings(relevantBookings) : 0;
  const pendingRequestsCount = relevantBookings.filter((b) => b.status === "requested").length;
  const upcomingBookings = relevantBookings.filter(
    (booking) =>
      booking.endDate > localIsoDate() &&
      ["requested", "confirmed"].includes(booking.status),
  );

  const ownerUtilization = useMemo(
    () => getOwnerUtilizationMetrics(ownerCars, relevantBookings),
    [ownerCars, relevantBookings],
  );

  const adminMetrics = useMemo(
    () => getAdminPlatformMetrics(data),
    [data],
  );

  let title = "Dashboard";
  if (section === "listings") title = role === "owner" ? "My listings" : "Listing approvals";
  if (section === "new-listing") title = "List a new vehicle";
  if (section === "edit-listing") title = "Edit vehicle listing";
  if (section === "bookings") title = role === "owner" ? "Bookings & requests" : "Platform bookings";
  if (section === "earnings") title = "Earnings & utilization";
  if (section === "users") title = "User accounts";
  if (section === "disputes") title = "Disputes";
  if (section === "announcements") title = "Announcements";
  if (section === "profile") title = "Profile";
  if (section === "settings") title = "Settings";

  return (
    <div className="dashboard-main">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">{role === "owner" ? "OWNER WORKSPACE" : "ADMIN WORKSPACE"}</p>
          <h1>{title}</h1>
        </div>
        <div className="dashboard-topbar-actions">
          <NotificationCenter />
          <ThemeToggle variant="dashboard" showLabel={true} />
          <span className="dashboard-demo-label"><span /> Fictional demo data</span>
        </div>
      </header>
      <main className="dashboard-content">
        {error && <p className="dashboard-alert" role="status">{error}</p>}

        {/* OWNER SECTIONS */}
        {role === "owner" && (
          <>
            {section === "dashboard" && (
              <>
                <section className="dashboard-welcome">
                  <div>
                    <p className="eyebrow">ADDIS ABABA · OWNER OVERVIEW</p>
                    <h2>Good morning, {user.name.split(" ")[0]}.</h2>
                    <p>Track your fleet utilization, review pending booking requests, and inspect earnings.</p>
                  </div>
                  <Link className="button button-primary" href="/owner/listings/new">
                    + Add New Vehicle
                  </Link>
                </section>

                <section className="dashboard-metrics" aria-label="Demo summary">
                  <MetricCard
                    label="Owned vehicles"
                    value={ownerCars.length}
                    note={`${ownerUtilization.approvedCars} active · ${ownerUtilization.pendingCars} pending review`}
                  />
                  <MetricCard
                    label="Active bookings"
                    value={relevantBookings.filter((b) => ["confirmed", "in_progress"].includes(b.status)).length}
                    note="Currently booked or in progress"
                  />
                  <MetricCard
                    label="Booking requests"
                    value={pendingRequestsCount}
                    note={pendingRequestsCount > 0 ? "⚠️ Requires your approval" : "No pending requests"}
                  />
                  <MetricCard
                    label="Completed earnings"
                    value={formatEtb(earnings)}
                    note="Gross revenue from finished trips"
                  />
                </section>

                {/* Utilization Metrics Callout */}
                <section className="dashboard-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Fleet Utilization &amp; Performance</h2>
                      <p>Utilization metrics computed across your vehicle fleet.</p>
                    </div>
                    <Link href="/owner/earnings">Detailed analytics →</Link>
                  </div>
                  <div className="dashboard-metrics" style={{ margin: 0 }}>
                    <MetricCard
                      label="Fleet utilization"
                      value={`${ownerUtilization.fleetUtilizationRate}%`}
                      note="Active cars in service vs total listed"
                    />
                    <MetricCard
                      label="Total days booked"
                      value={`${ownerUtilization.totalBookedDays} days`}
                      note="Sum across all confirmed & completed trips"
                    />
                    <MetricCard
                      label="Average trip length"
                      value={`${ownerUtilization.averageTripDuration} days`}
                      note="Average duration per customer trip"
                    />
                    <MetricCard
                      label="Pending / escrow revenue"
                      value={formatEtb(ownerUtilization.pendingEarnings)}
                      note="Held in demo escrow"
                    />
                  </div>
                </section>

                {/* Pending requests alert if any */}
                {pendingRequestsCount > 0 && (
                  <section className="dashboard-panel pending-requests-highlight">
                    <div className="dashboard-panel-heading">
                      <div>
                        <h2 className="highlight-title">Pending Booking Requests ({pendingRequestsCount})</h2>
                        <p>Customer requests waiting for your approval before trip confirmation.</p>
                      </div>
                      <Link href="/owner/bookings">Review and respond →</Link>
                    </div>
                    <BookingTable
                      bookings={relevantBookings.filter((b) => b.status === "requested")}
                      cars={data.cars}
                      users={data.users}
                      role="owner"
                    />
                  </section>
                )}

                <section className="dashboard-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>My vehicle fleet</h2>
                      <p>Your demo listings and their real-time availability status.</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <Link href="/owner/listings/new" className="button button-outline button-small">
                        + Add vehicle
                      </Link>
                      <Link href="/owner/listings">View all ({ownerCars.length}) →</Link>
                    </div>
                  </div>
                  {ownerCars.length ? (
                    <ul className="dashboard-vehicle-list">
                      {ownerCars.slice(0, 5).map((car) => (
                        <VehicleRow car={car} bookings={relevantBookings} key={car.id} />
                      ))}
                    </ul>
                  ) : (
                    <div className="dashboard-empty">
                      <strong>No demo vehicles for this account</strong>
                      <p>Click &apos;+ Add New Vehicle&apos; to list your first car.</p>
                      <Link href="/owner/listings/new" className="button button-primary">
                        List a Vehicle
                      </Link>
                    </div>
                  )}
                </section>

                <section className="dashboard-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Upcoming reservations</h2>
                      <p>Scheduled reservations tied to your fleet.</p>
                    </div>
                    <Link href="/owner/bookings">View all →</Link>
                  </div>
                  <BookingTable bookings={upcomingBookings.slice(0, 4)} cars={data.cars} users={data.users} role="owner" />
                </section>

                <StatusGuide />
              </>
            )}

            {section === "listings" && (
              <OwnerListingsManager user={user} cars={data.cars} bookings={data.bookings} />
            )}

            {section === "new-listing" && (
              <OwnerCarForm user={user} />
            )}

            {section === "edit-listing" && (
              <Suspense fallback={<p className="protected-demo-state">Loading vehicle editor…</p>}>
                <OwnerEditParamReader user={user} cars={data.cars} />
              </Suspense>
            )}

            {section === "bookings" && (
              <OwnerRequestsManager
                user={user}
                cars={data.cars}
                bookings={data.bookings}
                users={data.users}
              />
            )}

            {section === "earnings" && (
              <OwnerEarningsView
                user={user}
                cars={data.cars}
                bookings={data.bookings}
                users={data.users}
              />
            )}

            {section === "reviews" && (
              <OwnerReviewsManager
                user={user}
                cars={data.cars}
                reviews={data.reviews}
                users={data.users}
              />
            )}
          </>
        )}

        {/* ADMIN SECTIONS */}
        {role === "admin" && (
          <>
            {section === "dashboard" && (
              <>
                <section className="dashboard-welcome">
                  <div>
                    <p className="eyebrow">ADDIS ABABA · PLATFORM CONTROL CENTER</p>
                    <h2>Marketplace Administration</h2>
                    <p>Live health summary of listings, users, reservations, and dispute resolution.</p>
                  </div>
                  <span className="dashboard-welcome-mark" aria-hidden="true">⚙</span>
                </section>

                <section className="dashboard-metrics" aria-label="Admin summary">
                  <MetricCard
                    label="Platform users"
                    value={adminMetrics.totalUsers}
                    note={`${adminMetrics.activeUsers} active · ${adminMetrics.suspendedUsers} suspended`}
                  />
                  <MetricCard
                    label="Total fleet"
                    value={adminMetrics.totalCars}
                    note={`${adminMetrics.approvedCars} approved · ${adminMetrics.pendingCars} pending review`}
                  />
                  <MetricCard
                    label="Total bookings volume"
                    value={adminMetrics.totalBookings}
                    note={`Gross volume: ${formatEtb(adminMetrics.grossRentalVolume)}`}
                  />
                  <MetricCard
                    label="Platform demo revenue"
                    value={formatEtb(adminMetrics.platformFeesCollected)}
                    note="5% platform fee collected"
                  />
                </section>

                {/* Booking Status Counts Grid */}
                <section className="dashboard-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Reservation Status Breakdown</h2>
                      <p>Real-time booking counts across all marketplace states.</p>
                    </div>
                    <Link href="/admin/bookings">Open bookings ledger →</Link>
                  </div>
                  <div className="admin-status-counts-row">
                    <div className="admin-status-card">
                      <span>Requested</span>
                      <strong>{adminMetrics.statusCounts.requested}</strong>
                    </div>
                    <div className="admin-status-card">
                      <span>Confirmed</span>
                      <strong>{adminMetrics.statusCounts.confirmed}</strong>
                    </div>
                    <div className="admin-status-card">
                      <span>In Progress</span>
                      <strong>{adminMetrics.statusCounts.in_progress}</strong>
                    </div>
                    <div className="admin-status-card">
                      <span>Completed</span>
                      <strong>{adminMetrics.statusCounts.completed + adminMetrics.statusCounts.reviewed}</strong>
                    </div>
                    <div className="admin-status-card">
                      <span>Declined</span>
                      <strong>{adminMetrics.statusCounts.declined}</strong>
                    </div>
                    <div className="admin-status-card">
                      <span>Cancelled</span>
                      <strong>{adminMetrics.statusCounts.cancelled}</strong>
                    </div>
                    <div className="admin-status-card">
                      <span>Disputed</span>
                      <strong className={adminMetrics.statusCounts.disputed > 0 ? "text-danger" : ""}>
                        {adminMetrics.statusCounts.disputed}
                      </strong>
                    </div>
                    <div className="admin-status-card">
                      <span>Resolved</span>
                      <strong>{adminMetrics.statusCounts.resolved}</strong>
                    </div>
                  </div>
                </section>

                {/* Quick Action Shortcuts */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                  <div className="dashboard-panel">
                    <div className="dashboard-panel-heading" style={{ marginBottom: "6px" }}>
                      <div>
                        <h2>Vehicle Moderation</h2>
                        <p>{adminMetrics.pendingCars} listings awaiting admin approval</p>
                      </div>
                    </div>
                    <Link className="button button-outline button-small" href="/admin/listings">
                      Review Listings →
                    </Link>
                  </div>

                  <div className="dashboard-panel">
                    <div className="dashboard-panel-heading" style={{ marginBottom: "6px" }}>
                      <div>
                        <h2>Dispute Resolution</h2>
                        <p>{adminMetrics.openDisputes} customer claim cases open</p>
                      </div>
                    </div>
                    <Link className="button button-outline button-small" href="/admin/disputes">
                      Mediate Disputes →
                    </Link>
                  </div>

                  <div className="dashboard-panel">
                    <div className="dashboard-panel-heading" style={{ marginBottom: "6px" }}>
                      <div>
                        <h2>User Management</h2>
                        <p>{adminMetrics.totalUsers} registered demo accounts</p>
                      </div>
                    </div>
                    <Link className="button button-outline button-small" href="/admin/users">
                      Manage Accounts →
                    </Link>
                  </div>

                  <div className="dashboard-panel">
                    <div className="dashboard-panel-heading" style={{ marginBottom: "6px" }}>
                      <div>
                        <h2>Announcements</h2>
                        <p>{adminMetrics.activeAnnouncements} active broadcast notices</p>
                      </div>
                    </div>
                    <Link className="button button-outline button-small" href="/admin/announcements">
                      Post Announcements →
                    </Link>
                  </div>
                </div>

                <section className="dashboard-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Recent platform reservations</h2>
                      <p>Latest reservations across Addis Ababa.</p>
                    </div>
                    <Link href="/admin/bookings">View all records →</Link>
                  </div>
                  <BookingTable bookings={relevantBookings.slice(0, 6)} cars={data.cars} users={data.users} role="admin" />
                </section>

                <StatusGuide />
              </>
            )}

            {section === "listings" && (
              <AdminListingModeration
                cars={data.cars}
                users={data.users}
                bookings={data.bookings}
              />
            )}

            {section === "users" && (
              <AdminUserManager
                currentAdmin={user}
                users={data.users}
                cars={data.cars}
                bookings={data.bookings}
              />
            )}

            {section === "bookings" && (
              <AdminBookingOverview
                bookings={data.bookings}
                cars={data.cars}
                users={data.users}
              />
            )}

            {section === "disputes" && (
              <AdminDisputeManager
                disputes={data.disputes}
                bookings={data.bookings}
                cars={data.cars}
                users={data.users}
              />
            )}

            {section === "announcements" && (
              <AdminAnnouncementsManager announcements={data.announcements} />
            )}

            {section === "reports" && (
              <AdminReportsManager
                bookings={data.bookings}
                cars={data.cars}
                users={data.users}
              />
            )}
          </>
        )}

        {/* SHARED SECTIONS */}
        {section === "profile" && (
          <section className="dashboard-panel dashboard-profile">
            <div className="dashboard-profile-avatar" aria-hidden="true">{user.name.slice(0, 1)}</div>
            <div>
              <p className="eyebrow">DEMO ACCOUNT</p>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
            <dl>
              <div><dt>Assigned roles</dt><dd>{user.roles.join(" · ")}</dd></div>
              <div><dt>Account status</dt><dd><StatusPill status={user.status === "active" ? "Available" : "Inactive"} /></dd></div>
              <div><dt>Phone</dt><dd>{user.phone || "Not provided"}</dd></div>
              <div><dt>Account created</dt><dd>{formatDate(user.createdAt.slice(0, 10))}</dd></div>
            </dl>
          </section>
        )}

        {section === "settings" && (
          <section className="dashboard-panel dashboard-settings">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Demo preferences &amp; storage</h2>
                <p>Storage and security details for this browser-based demo showcase.</p>
              </div>
            </div>
            <div className="dashboard-setting-row">
              <span>
                <strong>Persistent marketplace records</strong>
                <small>Fictional users, vehicles, bookings, and notices are stored in browser local storage.</small>
              </span>
              <span className="setting-value">Local storage (HTML5)</span>
            </div>
            <div className="dashboard-setting-row">
              <span>
                <strong>Current demo session</strong>
                <small>Signing out clears the active session for this browser tab.</small>
              </span>
              <span className="setting-value">Session storage</span>
            </div>
            <p className="dashboard-security-note">
              This is a client-side architecture demo. Frontend role checks and browser storage simulate backend access control for evaluation purposes.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export function DemoDashboard({
  role,
  section,
}: {
  role: "owner" | "admin";
  section: DashboardSection;
}) {
  const serialized = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => JSON.stringify({ data: DEMO_DATA, error: "" } satisfies DashboardSnapshot),
  );
  const snapshot = JSON.parse(serialized) as DashboardSnapshot;
  const { user, ready, error: sessionError } = useCurrentDemoSession();

  if (!ready) return <p className="protected-demo-state" role="status">Loading your dashboard…</p>;
  if (sessionError || snapshot.error) {
    return <p className="protected-demo-state" role="alert">{sessionError || snapshot.error}</p>;
  }
  if (!user) return null;

  return (
    <div className="dashboard-app">
      <DashboardSidebar role={role} section={section} user={user} />
      <DashboardContent role={role} section={section} user={user} data={snapshot.data} error={snapshot.error} />
    </div>
  );
}
