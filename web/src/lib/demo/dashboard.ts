import type { DemoBooking, DemoCar } from "./types";

export type DashboardStatus =
  | "Available"
  | "Booked"
  | "Pending"
  | "Cancelled"
  | "Maintenance"
  | "Completed"
  | "Confirmed"
  | "In progress"
  | "Declined"
  | "Disputed"
  | "Resolved"
  | "Inactive"
  | "Rejected";

export function getVehicleListingStatus(
  car: DemoCar,
  bookings: DemoBooking[],
): DashboardStatus {
  if (car.status === "pending") return "Pending";
  if (car.status === "inactive") return "Maintenance";
  if (car.status === "rejected") return "Rejected";
  if (car.status !== "approved") return "Inactive";
  const carBookings = bookings.filter(
    (booking) =>
      booking.carId === car.id,
  );
  if (carBookings.some((booking) => ["confirmed", "in_progress"].includes(booking.status))) {
    return "Booked";
  }
  if (carBookings.some((booking) => ["requested", "disputed"].includes(booking.status))) {
    return "Pending";
  }
  return "Available";
}

export function getBookingDisplayStatus(
  status: DemoBooking["status"],
): DashboardStatus {
  switch (status) {
    case "requested":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "In progress";
    case "completed":
    case "reviewed":
      return "Completed";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    case "disputed":
      return "Disputed";
    case "resolved":
      return "Resolved";
  }
}

export function getOwnerEarnings(bookings: DemoBooking[]): number {
  return bookings
    .filter((booking) => booking.status === "completed" || booking.status === "reviewed")
    .reduce((total, booking) => total + booking.subtotal, 0);
}

export type OwnerUtilizationMetrics = {
  totalCars: number;
  approvedCars: number;
  pendingCars: number;
  inactiveCars: number;
  totalBookedDays: number;
  completedTrips: number;
  activeTrips: number;
  pendingRequests: number;
  completedEarnings: number;
  pendingEarnings: number;
  averageTripDuration: number;
  fleetUtilizationRate: number; // percentage
  carBreakdown: {
    car: DemoCar;
    bookingsCount: number;
    daysRented: number;
    completedEarnings: number;
    displayStatus: DashboardStatus;
  }[];
};

export function getOwnerUtilizationMetrics(
  ownerCars: DemoCar[],
  ownerBookings: DemoBooking[],
): OwnerUtilizationMetrics {
  const approvedCars = ownerCars.filter((c) => c.status === "approved").length;
  const pendingCars = ownerCars.filter((c) => c.status === "pending").length;
  const inactiveCars = ownerCars.filter((c) => c.status === "inactive" || c.status === "rejected").length;

  const validBookings = ownerBookings.filter((b) =>
    ["confirmed", "in_progress", "completed", "reviewed"].includes(b.status),
  );

  const totalBookedDays = validBookings.reduce((sum, b) => sum + b.days, 0);
  const completedTrips = ownerBookings.filter((b) =>
    ["completed", "reviewed"].includes(b.status),
  ).length;
  const activeTrips = ownerBookings.filter((b) =>
    ["confirmed", "in_progress"].includes(b.status),
  ).length;
  const pendingRequests = ownerBookings.filter((b) => b.status === "requested").length;

  const completedEarnings = ownerBookings
    .filter((b) => ["completed", "reviewed"].includes(b.status))
    .reduce((sum, b) => sum + b.subtotal, 0);

  const pendingEarnings = ownerBookings
    .filter((b) => ["confirmed", "in_progress"].includes(b.status))
    .reduce((sum, b) => sum + b.subtotal, 0);

  const averageTripDuration =
    validBookings.length > 0
      ? Math.round((totalBookedDays / validBookings.length) * 10) / 10
      : 0;

  // Utilization: active cars in service or booked vs total approved cars
  const currentlyRentedCars = new Set(
    ownerBookings
      .filter((b) => ["confirmed", "in_progress"].includes(b.status))
      .map((b) => b.carId),
  ).size;

  const fleetUtilizationRate =
    approvedCars > 0
      ? Math.min(100, Math.round((currentlyRentedCars / approvedCars) * 100))
      : 0;

  const carBreakdown = ownerCars.map((car) => {
    const carBookings = ownerBookings.filter((b) => b.carId === car.id);
    const daysRented = carBookings
      .filter((b) => ["confirmed", "in_progress", "completed", "reviewed"].includes(b.status))
      .reduce((sum, b) => sum + b.days, 0);
    const carEarnings = carBookings
      .filter((b) => ["completed", "reviewed"].includes(b.status))
      .reduce((sum, b) => sum + b.subtotal, 0);

    return {
      car,
      bookingsCount: carBookings.length,
      daysRented,
      completedEarnings: carEarnings,
      displayStatus: getVehicleListingStatus(car, ownerBookings),
    };
  });

  return {
    totalCars: ownerCars.length,
    approvedCars,
    pendingCars,
    inactiveCars,
    totalBookedDays,
    completedTrips,
    activeTrips,
    pendingRequests,
    completedEarnings,
    pendingEarnings,
    averageTripDuration,
    fleetUtilizationRate,
    carBreakdown,
  };
}

export type AdminPlatformMetrics = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalOwners: number;
  totalRenters: number;
  totalCars: number;
  approvedCars: number;
  pendingCars: number;
  rejectedCars: number;
  inactiveCars: number;
  totalBookings: number;
  grossRentalVolume: number;
  platformFeesCollected: number;
  openDisputes: number;
  activeAnnouncements: number;
  statusCounts: Record<DemoBooking["status"], number>;
};

export function getAdminPlatformMetrics(data: {
  users: { status: string; roles: string[] }[];
  cars: { status: string }[];
  bookings: DemoBooking[];
  disputes: { status: string }[];
  announcements: { active: boolean }[];
}): AdminPlatformMetrics {
  const users = data.users;
  const cars = data.cars;
  const bookings = data.bookings;

  const activeUsers = users.filter((u) => u.status === "active").length;
  const suspendedUsers = users.filter((u) => u.status === "suspended").length;
  const totalOwners = users.filter((u) => u.roles.includes("owner")).length;
  const totalRenters = users.filter((u) => u.roles.includes("renter")).length;

  const approvedCars = cars.filter((c) => c.status === "approved").length;
  const pendingCars = cars.filter((c) => c.status === "pending").length;
  const rejectedCars = cars.filter((c) => c.status === "rejected").length;
  const inactiveCars = cars.filter((c) => c.status === "inactive").length;

  const statusCounts: Record<DemoBooking["status"], number> = {
    requested: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    reviewed: 0,
    declined: 0,
    cancelled: 0,
    disputed: 0,
    resolved: 0,
  };

  let grossRentalVolume = 0;
  let platformFeesCollected = 0;

  for (const b of bookings) {
    if (statusCounts[b.status] !== undefined) {
      statusCounts[b.status]++;
    }
    if (b.status !== "cancelled" && b.status !== "declined") {
      grossRentalVolume += b.subtotal;
    }
    if (["confirmed", "in_progress", "completed", "reviewed"].includes(b.status)) {
      platformFeesCollected += b.fee;
    }
  }

  const openDisputes = data.disputes.filter((d) => d.status === "open").length;
  const activeAnnouncements = data.announcements.filter((a) => a.active).length;

  return {
    totalUsers: users.length,
    activeUsers,
    suspendedUsers,
    totalOwners,
    totalRenters,
    totalCars: cars.length,
    approvedCars,
    pendingCars,
    rejectedCars,
    inactiveCars,
    totalBookings: bookings.length,
    grossRentalVolume,
    platformFeesCollected,
    openDisputes,
    activeAnnouncements,
    statusCounts,
  };
}
