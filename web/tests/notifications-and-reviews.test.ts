import test from "node:test";
import assert from "node:assert/strict";
import { setupMockBrowserEnvironment } from "./setup-mock-browser";
import {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from "../src/lib/demo/notifications";
import { submitBookingReview } from "../src/lib/demo/review-actions";
import { signInAsDemo } from "../src/lib/demo/session";
import { writeDemoCollection } from "../src/lib/demo/storage";
import { DEMO_DATA } from "../src/lib/demo/seed";

test("Notifications System: addition, read state toggling, and persistence", () => {
  const env = setupMockBrowserEnvironment();

  // 1. Initial notifications exist
  const initial = getNotifications();
  assert.ok(initial.length > 0);

  // 2. Add a notification
  const added = addNotification(
    {
      title: "TeleBirr Mock Paid",
      message: "ETB 15,000 paid for Toyota RAV4",
      type: "payment",
    },
    false,
  );
  assert.equal(added.title, "TeleBirr Mock Paid");
  assert.equal(added.read, false);

  const listAfterAdd = getNotifications();
  assert.equal(listAfterAdd[0].id, added.id);
  assert.equal(listAfterAdd[0].read, false);

  // 3. Mark as read
  markAsRead(added.id);
  const listAfterRead = getNotifications();
  assert.equal(listAfterRead[0].read, true);

  // 4. Mark all as read
  markAllAsRead();
  const allRead = getNotifications();
  assert.ok(allRead.every((n) => n.read === true));

  // 5. Clear all
  clearNotifications();
  assert.deepEqual(getNotifications(), []);

  env.reset();
});

test("Review System: validates eligible booking and status transition", () => {
  const env = setupMockBrowserEnvironment();

  // Seed users, cars, bookings, reviews
  writeDemoCollection("users", DEMO_DATA.users);
  writeDemoCollection("cars", DEMO_DATA.cars);

  // Sign in as Kidus (renter)
  signInAsDemo("user-renter-kidus");

  // Create a completed demo booking
  const testBooking = {
    ...DEMO_DATA.bookings[0],
    id: "booking-review-test-1",
    renterId: "user-renter-kidus",
    status: "completed" as const,
  };
  writeDemoCollection("bookings", [testBooking]);
  writeDemoCollection("reviews", []);

  // 1. Submit valid review
  const reviewResult = submitBookingReview("booking-review-test-1", 5, "Great driving experience around Bole!");
  assert.equal(reviewResult.ok, true);
  if (reviewResult.ok) {
    assert.equal(reviewResult.value.rating, 5);
    assert.equal(reviewResult.value.comment, "Great driving experience around Bole!");
  }

  // 2. Reject duplicate review for same booking
  const duplicateResult = submitBookingReview("booking-review-test-1", 4, "Trying again");
  assert.equal(duplicateResult.ok, false);
  if (!duplicateResult.ok) {
    assert.match(duplicateResult.error, /already submitted/i);
  }

  // 3. Reject invalid star rating
  const invalidStar = submitBookingReview("booking-review-test-1", 10, "Invalid star");
  assert.equal(invalidStar.ok, false);

  env.reset();
});
