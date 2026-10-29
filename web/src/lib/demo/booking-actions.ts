import { addIsoDays, isIsoDate, localIsoDate } from "../dates";
import { initializeDemoData, writeDemoCollection } from "./storage";
import { getCurrentSession, requireCurrentRole, requireRole } from "./session";
import { dateRangesOverlap, requiredBookingTransitionRole } from "./booking-rules";
import type {
  ActionResult,
  BookingStatus,
  DemoBooking,
  DemoCar,
  DemoData,
} from "./types";

export const DEMO_SERVICE_FEE_RATE = 0.05;
const BOOKING_LOCK = "sheggar-wheels-booking-write-v1";
const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = [
  "requested",
  "confirmed",
  "in_progress",
  "disputed",
];

export type BookingQuote = {
  carId: string;
  startDate: string;
  endDate: string;
  days: number;
  pricePerDay: number;
  subtotal: number;
  fee: number;
  total: number;
};

export function calculateBookingQuote(
  car: DemoCar,
  startDate: string,
  endDate: string,
  today = localIsoDate(),
): ActionResult<BookingQuote> {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return { ok: false, error: "Choose valid pick-up and return dates." };
  }
  if (!isIsoDate(today) || startDate < today) {
    return { ok: false, error: "Pick-up must be today or a future date." };
  }
  if (endDate <= startDate) {
    return { ok: false, error: "Return date must be after the pick-up date." };
  }
  if (car.status !== "approved" || !Number.isFinite(car.pricePerDay) || car.pricePerDay <= 0) {
    return { ok: false, error: "This vehicle is not currently available to book." };
  }

  const days = Math.round(
    (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
      86_400_000,
  );
  if (!Number.isInteger(days) || days < 1 || addIsoDays(startDate, days) !== endDate) {
    return { ok: false, error: "Choose a valid rental period of at least one day." };
  }

  if (car.unavailableDates.some((date) => isIsoDate(date) && date >= startDate && date < endDate)) {
    return { ok: false, error: "This vehicle is marked unavailable for one or more selected dates." };
  }

  const subtotal = days * car.pricePerDay;
  const fee = Math.round(subtotal * DEMO_SERVICE_FEE_RATE);
  return {
    ok: true,
    value: {
      carId: car.id,
      startDate,
      endDate,
      days,
      pricePerDay: car.pricePerDay,
      subtotal,
      fee,
      total: subtotal + fee,
    },
  };
}

function records(): ActionResult<DemoData> {
  const initialized = initializeDemoData();
  if (!initialized.ok) return initialized;
  return { ok: true, value: initialized.value };
}

function findEligibleCar(data: DemoData, carId: string): DemoCar | null {
  const car = data.cars.find((item) => item.id === carId);
  const owner = car && data.users.find((item) => item.id === car.ownerId);
  if (!car || car.status !== "approved" || !owner || owner.status !== "active") return null;
  return car;
}

export function hasBookingConflict(
  bookings: DemoBooking[],
  quote: BookingQuote,
): boolean {
  return bookings.some(
    (booking) =>
      booking.carId === quote.carId &&
      ACTIVE_BOOKING_STATUSES.includes(booking.status) &&
      dateRangesOverlap(
        booking.startDate,
        booking.endDate,
        quote.startDate,
        quote.endDate,
      ),
  );
}

function sameQuote(left: BookingQuote, right: BookingQuote): boolean {
  return (
    left.carId === right.carId &&
    left.startDate === right.startDate &&
    left.endDate === right.endDate &&
    left.days === right.days &&
    left.pricePerDay === right.pricePerDay &&
    left.subtotal === right.subtotal &&
    left.fee === right.fee &&
    left.total === right.total
  );
}

function createBookingUnderLock(expected: BookingQuote): ActionResult<DemoBooking> {
  const authorized = requireCurrentRole("renter");
  if (!authorized.ok) return authorized;
  const initialized = records();
  if (!initialized.ok) return initialized;

  const data = initialized.value;
  const car = findEligibleCar(data, expected.carId);
  if (!car) return { ok: false, error: "This listing is no longer available to book." };

  const calculated = calculateBookingQuote(car, expected.startDate, expected.endDate);
  if (!calculated.ok) return calculated;
  if (!sameQuote(calculated.value, expected)) {
    return { ok: false, error: "The price or rental details changed. Review your booking again." };
  }
  if (hasBookingConflict(data.bookings, calculated.value)) {
    return { ok: false, error: "These dates have just been booked. Choose different dates." };
  }

  const now = new Date().toISOString();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const booking: DemoBooking = {
    id: `booking-demo-${Date.now().toString(36)}-${suffix.toLowerCase()}`,
    carId: car.id,
    renterId: authorized.value.id,
    ownerId: car.ownerId,
    startDate: calculated.value.startDate,
    endDate: calculated.value.endDate,
    days: calculated.value.days,
    pricePerDay: calculated.value.pricePerDay,
    subtotal: calculated.value.subtotal,
    fee: calculated.value.fee,
    total: calculated.value.total,
    transactionReference: `TB-DEMO-${Date.now().toString(36).toUpperCase()}-${suffix}`,
    paymentStatus: "held",
    status: "confirmed",
    createdAt: now,
    updatedAt: now,
  };
  const saved = writeDemoCollection("bookings", [...data.bookings, booking]);
  if (!saved.ok) return saved;
  return { ok: true, value: booking };
}

export async function createDemoBooking(
  expected: BookingQuote,
): Promise<ActionResult<DemoBooking>> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Demo checkout is only available in the browser." };
  }
  if (!navigator.locks) {
    return {
      ok: false,
      error: "This browser cannot safely coordinate demo bookings between tabs. Please use an up-to-date browser.",
    };
  }

  return navigator.locks.request(BOOKING_LOCK, () => createBookingUnderLock(expected));
}

function transitionUnderLock(
  bookingId: string,
  nextStatus: BookingStatus,
): ActionResult<DemoBooking> {
  const current = getCurrentSession();
  if (!current.ok) return current;
  if (!current.value.user) return { ok: false, error: "Not signed in." };

  const initialized = records();
  if (!initialized.ok) return initialized;
  const data = initialized.value;
  const booking = data.bookings.find((item) => item.id === bookingId);
  if (!booking) return { ok: false, error: "This booking could not be found." };

  const requiredRole = requiredBookingTransitionRole(booking.status, nextStatus);
  if (!requiredRole) {
    return { ok: false, error: `A booking cannot move from ${booking.status} to ${nextStatus}.` };
  }

  const authorized = requireRole(current.value.user, requiredRole);
  if (!authorized.ok) return authorized;
  if (
    requiredRole !== "admin" &&
    (requiredRole === "renter"
      ? booking.renterId !== authorized.value.id
      : booking.ownerId !== authorized.value.id)
  ) {
    return { ok: false, error: "You can only update bookings belonging to your account." };
  }
  if (nextStatus === "cancelled" && booking.startDate <= localIsoDate()) {
    return { ok: false, error: "A booking can only be cancelled before its pick-up date." };
  }

  const updated: DemoBooking = {
    ...booking,
    status: nextStatus,
    paymentStatus:
      nextStatus === "cancelled" || nextStatus === "declined"
        ? booking.paymentStatus === "held" ? "refunded" : booking.paymentStatus
        : booking.paymentStatus,
    updatedAt: new Date().toISOString(),
  };
  const saved = writeDemoCollection(
    "bookings",
    data.bookings.map((item) => item.id === bookingId ? updated : item),
  );
  if (!saved.ok) return saved;
  return { ok: true, value: updated };
}

export async function transitionDemoBooking(
  bookingId: string,
  nextStatus: BookingStatus,
): Promise<ActionResult<DemoBooking>> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Booking changes are only available in the browser." };
  }
  if (!navigator.locks) {
    return { ok: false, error: "This browser cannot safely coordinate booking changes." };
  }
  return navigator.locks.request(BOOKING_LOCK, () =>
    transitionUnderLock(bookingId, nextStatus),
  );
}
