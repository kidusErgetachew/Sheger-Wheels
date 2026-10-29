import type { DemoBooking, DemoCar, DemoUser } from "./types";

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): void {
  if (typeof window === "undefined") return;

  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (
      str.includes('"') ||
      str.includes(",") ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replaceAll('"', '""')}"`;
    }
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportOwnerBookingsCsv(
  owner: DemoUser,
  bookings: DemoBooking[],
  cars: DemoCar[],
  users: DemoUser[],
): void {
  const headers = [
    "Booking ID",
    "Vehicle Make & Model",
    "Vehicle Year",
    "Pickup Location",
    "Renter Name",
    "Renter Email",
    "Start Date",
    "End Date",
    "Duration (Days)",
    "Rate / Day (ETB)",
    "Subtotal (ETB)",
    "Service Fee (ETB)",
    "Total (ETB)",
    "Payment Status",
    "Booking Status",
    "Created Date",
  ];

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows = bookings.map((b) => {
    const car = carMap.get(b.carId);
    const renter = userMap.get(b.renterId);
    return [
      b.id,
      car ? `${car.make} ${car.model}` : "Unknown Car",
      car ? car.year : "",
      car ? car.neighbourhood : "Addis Ababa",
      renter ? renter.name : "Demo Renter",
      renter ? renter.email : "",
      b.startDate,
      b.endDate,
      b.days,
      b.pricePerDay,
      b.subtotal,
      b.fee,
      b.total,
      b.paymentStatus,
      b.status,
      b.createdAt.slice(0, 10),
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = owner.name.toLowerCase().replaceAll(/\s+/g, "-");
  downloadCsv(`sheggar-owner-bookings-${safeName}-${dateStr}.csv`, headers, rows);
}

export function exportOwnerEarningsCsv(
  owner: DemoUser,
  ownerCars: DemoCar[],
  ownerBookings: DemoBooking[],
): void {
  const headers = [
    "Vehicle ID",
    "Vehicle",
    "Year",
    "Neighbourhood",
    "Daily Rate (ETB)",
    "Listing Status",
    "Total Bookings",
    "Completed Trips",
    "Total Days Rented",
    "Gross Completed Earnings (ETB)",
    "Pending / Held Earnings (ETB)",
  ];

  const rows = ownerCars.map((car) => {
    const carBookings = ownerBookings.filter((b) => b.carId === car.id);
    const completed = carBookings.filter((b) =>
      ["completed", "reviewed"].includes(b.status),
    );
    const pendingHeld = carBookings.filter((b) =>
      ["confirmed", "in_progress"].includes(b.status),
    );
    const totalDays = carBookings.reduce((sum, b) => sum + b.days, 0);
    const completedEarnings = completed.reduce((sum, b) => sum + b.subtotal, 0);
    const pendingEarnings = pendingHeld.reduce((sum, b) => sum + b.subtotal, 0);

    return [
      car.id,
      `${car.make} ${car.model}`,
      car.year,
      car.neighbourhood,
      car.pricePerDay,
      car.status,
      carBookings.length,
      completed.length,
      totalDays,
      completedEarnings,
      pendingEarnings,
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = owner.name.toLowerCase().replaceAll(/\s+/g, "-");
  downloadCsv(`sheggar-owner-earnings-${safeName}-${dateStr}.csv`, headers, rows);
}

export function exportAdminBookingsCsv(
  bookings: DemoBooking[],
  cars: DemoCar[],
  users: DemoUser[],
): void {
  const headers = [
    "Booking ID",
    "Vehicle",
    "Vehicle Year",
    "Owner Name",
    "Owner Email",
    "Renter Name",
    "Renter Email",
    "Start Date",
    "End Date",
    "Rental Days",
    "Daily Rate (ETB)",
    "Rental Subtotal (ETB)",
    "Platform Fee 5% (ETB)",
    "Total Transaction (ETB)",
    "Payment Status",
    "Booking Status",
    "Transaction Reference",
    "Created Date",
  ];

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows = bookings.map((b) => {
    const car = carMap.get(b.carId);
    const owner = userMap.get(b.ownerId);
    const renter = userMap.get(b.renterId);
    return [
      b.id,
      car ? `${car.make} ${car.model}` : "Unknown Car",
      car ? car.year : "",
      owner ? owner.name : "Unknown Owner",
      owner ? owner.email : "",
      renter ? renter.name : "Unknown Renter",
      renter ? renter.email : "",
      b.startDate,
      b.endDate,
      b.days,
      b.pricePerDay,
      b.subtotal,
      b.fee,
      b.total,
      b.paymentStatus,
      b.status,
      b.transactionReference ?? "N/A",
      b.createdAt.slice(0, 10),
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`sheggar-admin-bookings-report-${dateStr}.csv`, headers, rows);
}

export function exportAdminFleetCsv(
  cars: DemoCar[],
  users: DemoUser[],
  bookings: DemoBooking[],
): void {
  const headers = [
    "Vehicle ID",
    "Make",
    "Model",
    "Year",
    "Vehicle Type",
    "Transmission",
    "Seats",
    "City",
    "Neighbourhood",
    "Daily Rate (ETB)",
    "Owner Name",
    "Owner Email",
    "Owner Status",
    "Listing Status",
    "Total Bookings",
    "Total Completed Trips",
    "Total Revenue Generated (ETB)",
    "Created Date",
  ];

  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows = cars.map((car) => {
    const owner = userMap.get(car.ownerId);
    const carBookings = bookings.filter((b) => b.carId === car.id);
    const completed = carBookings.filter((b) =>
      ["completed", "reviewed"].includes(b.status),
    );
    const revenue = completed.reduce((sum, b) => sum + b.total, 0);

    return [
      car.id,
      car.make,
      car.model,
      car.year,
      car.vehicleType ?? "Sedan",
      car.transmission,
      car.seats,
      car.city,
      car.neighbourhood,
      car.pricePerDay,
      owner ? owner.name : "Unknown",
      owner ? owner.email : "",
      owner ? owner.status : "unknown",
      car.status,
      carBookings.length,
      completed.length,
      revenue,
      car.createdAt.slice(0, 10),
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`sheggar-admin-fleet-report-${dateStr}.csv`, headers, rows);
}

export function exportAdminUsersCsv(
  users: DemoUser[],
  cars: DemoCar[],
  bookings: DemoBooking[],
): void {
  const headers = [
    "User ID",
    "Full Name",
    "Email Address",
    "Phone Number",
    "Assigned Roles",
    "Account Status",
    "Vehicles Owned",
    "Bookings as Renter",
    "Bookings as Owner",
    "Account Created Date",
  ];

  const rows = users.map((u) => {
    const ownedCars = cars.filter((c) => c.ownerId === u.id).length;
    const asRenter = bookings.filter((b) => b.renterId === u.id).length;
    const asOwner = bookings.filter((b) => b.ownerId === u.id).length;

    return [
      u.id,
      u.name,
      u.email,
      u.phone || "Not provided",
      u.roles.join("; "),
      u.status,
      ownedCars,
      asRenter,
      asOwner,
      u.createdAt.slice(0, 10),
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`sheggar-admin-users-report-${dateStr}.csv`, headers, rows);
}
