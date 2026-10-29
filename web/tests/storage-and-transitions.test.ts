import test from "node:test";
import assert from "node:assert/strict";
import { setupMockBrowserEnvironment } from "./setup-mock-browser";
import {
  readStorage,
  STORAGE_KEYS,
  initializeDemoData,
  readDemoCollection,
} from "../src/lib/demo/storage";
import {
  signInAsDemo,
  signOut,
  getCurrentSession,
  SESSION_KEY,
} from "../src/lib/demo/session";
import {
  calculateBookingQuote,
  hasBookingConflict,
  DEMO_SERVICE_FEE_RATE,
} from "../src/lib/demo/booking-actions";
import {
  dateRangesOverlap,
  requiredBookingTransitionRole,
} from "../src/lib/demo/booking-rules";
import { DEMO_DATA } from "../src/lib/demo/seed";
import type { DemoCar } from "../src/lib/demo/types";

const env = setupMockBrowserEnvironment();

test.beforeEach(() => {
  env.reset();
  initializeDemoData();
});

test("Storage Resilience: Malformed JSON recovery", () => {
  // Intentionally inject invalid, corrupt JSON string into localStorage
  window.localStorage.setItem(STORAGE_KEYS.cars, "{\"corrupted_json_syntax: [missing brackets");

  // Reading via readStorage should detect malformed JSON and return recovered=true with fallback
  const result = readStorage(STORAGE_KEYS.cars, DEMO_DATA.cars);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.recovered, true);
    assert.equal(Array.isArray(result.value), true);
    assert.equal(result.value.length, DEMO_DATA.cars.length);
  }

  // readDemoCollection should also restore seed cars and recover
  const collectionResult = readDemoCollection("cars");
  assert.equal(collectionResult.ok, true);
  if (collectionResult.ok) {
    assert.equal(collectionResult.recovered, true);
    assert.ok(collectionResult.value.length > 0);
  }
});

test("Storage Resilience: Malformed schema shape recovery", () => {
  // Inject valid JSON that has an invalid schema (e.g. array of numbers instead of DemoCar)
  window.localStorage.setItem(STORAGE_KEYS.cars, JSON.stringify([123, 456, "bad-car"]));

  const collectionResult = readDemoCollection("cars");
  assert.equal(collectionResult.ok, true);
  if (collectionResult.ok) {
    assert.equal(collectionResult.recovered, true);
    assert.equal(collectionResult.value[0].make, DEMO_DATA.cars[0].make);
  }
});

test("Session Management: Sign-in, session storage, and Sign-out", () => {
  const signInResult = signInAsDemo("user-renter-kidus");
  assert.equal(signInResult.ok, true);

  // Verify sessionStorage contains valid session
  const rawSession = window.sessionStorage.getItem(SESSION_KEY);
  assert.ok(rawSession);
  const parsedSession = JSON.parse(rawSession!);
  assert.equal(parsedSession.userId, "user-renter-kidus");

  const session = getCurrentSession();
  assert.equal(session.ok, true);
  if (session.ok) {
    assert.equal(session.value.user?.id, "user-renter-kidus");
    assert.equal(session.value.user?.email, "kidus@example.test");
  }

  // Sign out
  const signOutResult = signOut();
  assert.equal(signOutResult.ok, true);

  // Verify sessionStorage was cleared
  assert.equal(window.sessionStorage.getItem(SESSION_KEY), null);
  const afterSignOut = getCurrentSession();
  assert.equal(afterSignOut.ok, true);
  if (afterSignOut.ok) {
    assert.equal(afterSignOut.value.user, null);
    assert.equal(afterSignOut.value.session, null);
  }
});

test("Booking Rules: Date range overlap detection", () => {
  // Exact same range overlaps
  assert.equal(dateRangesOverlap("2026-11-01", "2026-11-05", "2026-11-01", "2026-11-05"), true);
  // Partial overlap inside
  assert.equal(dateRangesOverlap("2026-11-01", "2026-11-05", "2026-11-02", "2026-11-04"), true);
  // Straddling start
  assert.equal(dateRangesOverlap("2026-11-01", "2026-11-05", "2026-10-28", "2026-11-02"), true);
  // Straddling end
  assert.equal(dateRangesOverlap("2026-11-01", "2026-11-05", "2026-11-04", "2026-11-08"), true);
  // Adjacent touching dates (same day drop-off / pick-up) do NOT overlap
  assert.equal(dateRangesOverlap("2026-11-01", "2026-11-05", "2026-11-05", "2026-11-08"), false);
  assert.equal(dateRangesOverlap("2026-11-05", "2026-11-08", "2026-11-01", "2026-11-05"), false);
  // Completely separate dates
  assert.equal(dateRangesOverlap("2026-11-01", "2026-11-05", "2026-11-10", "2026-11-15"), false);
});

test("Booking Quote Calculation: 5% service fee and validation", () => {
  const sampleCar: DemoCar = {
    id: "car-test",
    ownerId: "user-owner-saba",
    make: "Toyota",
    model: "RAV4",
    year: 2023,
    vehicleType: "SUV",
    transmission: "Automatic",
    seats: 5,
    city: "Addis Ababa",
    neighbourhood: "Bole",
    latitude: 8.995,
    longitude: 38.787,
    pricePerDay: 4000,
    photos: ["/cars/Toyota RAV4 2025.jfif"],
    description: "Test vehicle",
    status: "approved",
    unavailableDates: ["2026-11-20"],
    createdAt: "2026-01-01T00:00:00Z",
  };

  // 3-day rental: 4000 * 3 = 12000 subtotal, 5% fee = 600, total = 12600
  const quote = calculateBookingQuote(sampleCar, "2026-11-10", "2026-11-13", "2026-11-01");
  assert.equal(quote.ok, true);
  if (quote.ok) {
    assert.equal(quote.value.days, 3);
    assert.equal(quote.value.subtotal, 12000);
    assert.equal(quote.value.fee, 600);
    assert.equal(quote.value.total, 12600);
    assert.equal(quote.value.fee / quote.value.subtotal, DEMO_SERVICE_FEE_RATE);
  }

  // Reject invalid return date before or equal to start date
  const invalidDates = calculateBookingQuote(sampleCar, "2026-11-10", "2026-11-10", "2026-11-01");
  assert.equal(invalidDates.ok, false);

  // Reject unavailable dates
  const unavailableQuote = calculateBookingQuote(sampleCar, "2026-11-19", "2026-11-22", "2026-11-01");
  assert.equal(unavailableQuote.ok, false);
  assert.match(unavailableQuote.error, /unavailable/i);

  // Test booking conflict detection
  if (quote.ok) {
    const existingBookings = DEMO_DATA.bookings;
    const hasConflict = hasBookingConflict(existingBookings, quote.value);
    // quote is for car-test, existingBookings don't have car-test
    assert.equal(hasConflict, false);

    // Now test with a conflicting booking
    const conflict = hasBookingConflict(
      [
        {
          id: "b-conflict",
          carId: sampleCar.id,
          renterId: "user-renter-kidus",
          ownerId: sampleCar.ownerId,
          startDate: "2026-11-11",
          endDate: "2026-11-15",
          days: 4,
          pricePerDay: 4000,
          subtotal: 16000,
          fee: 800,
          total: 16800,
          transactionReference: null,
          paymentStatus: "held",
          status: "confirmed",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      quote.value,
    );
    assert.equal(conflict, true);
  }
});

test("Booking State Transitions: Allowed roles and invalid transition rejection", () => {
  // Valid transitions
  assert.equal(requiredBookingTransitionRole("requested", "confirmed"), "owner");
  assert.equal(requiredBookingTransitionRole("requested", "declined"), "owner");
  assert.equal(requiredBookingTransitionRole("requested", "cancelled"), "renter");
  assert.equal(requiredBookingTransitionRole("confirmed", "in_progress"), "owner");
  assert.equal(requiredBookingTransitionRole("confirmed", "cancelled"), "renter");
  assert.equal(requiredBookingTransitionRole("in_progress", "completed"), "owner");
  assert.equal(requiredBookingTransitionRole("in_progress", "disputed"), "renter");
  assert.equal(requiredBookingTransitionRole("disputed", "resolved"), "admin");

  // Invalid transitions must return null
  assert.equal(requiredBookingTransitionRole("cancelled", "confirmed"), null);
  assert.equal(requiredBookingTransitionRole("declined", "confirmed"), null);
  assert.equal(requiredBookingTransitionRole("completed", "in_progress"), null);
  assert.equal(requiredBookingTransitionRole("resolved", "in_progress"), null);
  assert.equal(requiredBookingTransitionRole("requested", "completed"), null);
});
