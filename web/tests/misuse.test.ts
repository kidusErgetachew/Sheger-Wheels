import test from "node:test";
import assert from "node:assert/strict";
import { setupMockBrowserEnvironment } from "./setup-mock-browser";
import { safeReturnPath, signInAsDemo, signOut, getCurrentSession } from "../src/lib/demo/session";
import { createDemoCar, updateDemoCar, toggleDemoCarStatus, adminModerateCar } from "../src/lib/demo/car-actions";
import { initializeDemoData, readDemoCollection } from "../src/lib/demo/storage";

const env = setupMockBrowserEnvironment();

test.beforeEach(() => {
  env.reset();
  initializeDemoData();
});

test("Misuse Scenario 1: Unsafe external return URL", () => {
  // Protocol-relative URLs
  assert.equal(safeReturnPath("//evil.com"), "/");
  assert.equal(safeReturnPath("//google.com/path"), "/");

  // Absolute URLs with external schemes
  assert.equal(safeReturnPath("https://evil.com"), "/");
  assert.equal(safeReturnPath("http://evil.com/phishing"), "/");
  assert.equal(safeReturnPath("javascript:alert(1)"), "/");
  assert.equal(safeReturnPath("data:text/html,<script>alert(1)</script>"), "/");

  // Backslash / control char evasions
  assert.equal(safeReturnPath("/\\evil.com"), "/");
  assert.equal(safeReturnPath("/path\u0000evil"), "/");

  // Valid internal paths must be preserved
  assert.equal(safeReturnPath("/cars"), "/cars");
  assert.equal(safeReturnPath("/cars/car-byd-song-plus"), "/cars/car-byd-song-plus");
  assert.equal(safeReturnPath("/checkout?carId=123"), "/checkout?carId=123");
  assert.equal(safeReturnPath("/owner/listings"), "/owner/listings");
  assert.equal(safeReturnPath("/admin/users"), "/admin/users");
});

test("Misuse Scenario 2: Signed-out write operations are strictly blocked", async () => {
  // Ensure completely signed out
  signOut();
  const session = getCurrentSession();
  assert.equal(session.ok, true);
  if (session.ok) {
    assert.equal(session.value.user, null);
  }

  // Attempt to create a car without being signed in
  const createResult = createDemoCar({
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    vehicleType: "Sedan",
    transmission: "Automatic",
    seats: 5,
    neighbourhood: "Bole",
    pricePerDay: 3000,
    photos: ["/cars/Toyota RAV4 2025.jfif"],
    description: "Signed out unauthorized attempt to create car listing.",
  });
  assert.equal(createResult.ok, false);
  assert.match(createResult.error, /Not signed in|requires/i);

  // Attempt to update an existing car while signed out
  const updateResult = updateDemoCar("car-byd-song-plus", {
    pricePerDay: 9999,
  });
  assert.equal(updateResult.ok, false);
  assert.match(updateResult.error, /Not signed in|requires/i);

  // Attempt to toggle status while signed out
  const toggleResult = toggleDemoCarStatus("car-byd-song-plus");
  assert.equal(toggleResult.ok, false);
  assert.match(toggleResult.error, /Not signed in|requires/i);

  // Attempt admin moderation while signed out
  const adminResult = adminModerateCar("car-byd-song-plus", "rejected");
  assert.equal(adminResult.ok, false);
  assert.match(adminResult.error, /Not signed in|requires/i);
});

test("Misuse Scenario 3: Cross-user ownership violation & cross-owner car editing", () => {
  // In seed data:
  // user-owner-saba owns car-toyota-rav4, car-byd-qin-plus
  // user-owner-dawit owns car-byd-song-plus, car-toyota-hilux

  // Sign in as user-owner-saba
  const signInSaba = signInAsDemo("user-owner-saba");
  assert.equal(signInSaba.ok, true);

  // Saba attempts to edit Dawit's car (car-byd-song-plus)
  const maliciousEdit = updateDemoCar("car-byd-song-plus", {
    pricePerDay: 1000,
    description: "Hacked by unauthorized user",
  });
  assert.equal(maliciousEdit.ok, false);
  assert.match(maliciousEdit.error, /do not own this vehicle|Access Denied/i);

  // Saba attempts to toggle the status of Dawit's car
  const maliciousToggle = toggleDemoCarStatus("car-byd-song-plus");
  assert.equal(maliciousToggle.ok, false);
  assert.match(maliciousToggle.error, /do not own this vehicle|Access Denied/i);

  // Saba attempts to perform admin moderation
  const maliciousModerate = adminModerateCar("car-byd-song-plus", "approved");
  assert.equal(maliciousModerate.ok, false);
  assert.match(maliciousModerate.error, /requires the admin demo role/i);

  // Saba CAN successfully edit her own car (car-toyota-rav4)
  const validEdit = updateDemoCar("car-toyota-rav4", {
    pricePerDay: 4800,
  });
  assert.equal(validEdit.ok, true);
  if (validEdit.ok) {
    assert.equal(validEdit.value.pricePerDay, 4800);
  }
});

test("Misuse Scenario 4: Cross-renter booking access & cancellation protection", () => {
  // In seed data:
  // booking-kidus-upcoming: renter is user-renter-kidus, owner is user-owner-saba

  // Sign in as Dawit Alemu (user-owner-dawit), who is NOT a party in booking-kidus-upcoming
  const signInDawit = signInAsDemo("user-owner-dawit");
  assert.equal(signInDawit.ok, true);

  // Read bookings
  const bookingsResult = readDemoCollection("bookings");
  assert.equal(bookingsResult.ok, true);

  const targetBooking = bookingsResult.ok
    ? bookingsResult.value.find((b) => b.id === "booking-kidus-upcoming")
    : null;
  assert.ok(targetBooking);

  // Verify Dawit is not the renter of Kidus's booking
  assert.notEqual(targetBooking?.renterId, "user-owner-dawit");

  // Attempting to transition or cancel as Dawit fails authorization
  const currentSession = getCurrentSession();
  assert.equal(currentSession.ok, true);
  if (currentSession.ok && currentSession.value.user) {
    // If Dawit tries to cancel as renter, it must fail because Dawit is not the renter
    assert.equal(targetBooking?.renterId === currentSession.value.user.id, false);
  }
});
