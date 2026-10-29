"use client";

import { readDemoCollection, writeDemoCollection } from "./storage";
import { requireCurrentRole } from "./session";
import { addNotification } from "./notifications";
import type { ActionResult, DemoReview } from "./types";

export function submitBookingReview(
  bookingId: string,
  rating: number,
  comment: string,
): ActionResult<DemoReview> {
  const renterAuth = requireCurrentRole("renter");
  if (!renterAuth.ok) return renterAuth;

  const bookingsResult = readDemoCollection("bookings");
  if (!bookingsResult.ok) return bookingsResult;
  const bookings = bookingsResult.value;

  const booking = bookings.find(
    (b) => b.id === bookingId && b.renterId === renterAuth.value.id,
  );

  if (!booking) {
    return { ok: false, error: "Booking not found or not owned by the current renter." };
  }

  const reviewsResult = readDemoCollection("reviews");
  if (!reviewsResult.ok) return reviewsResult;
  const reviews = reviewsResult.value;

  // Check one review per booking rule
  const existingReview = reviews.find((r) => r.bookingId === bookingId);
  if (existingReview) {
    return { ok: false, error: "You have already submitted a review for this booking." };
  }

  if (booking.status !== "completed") {
    return { ok: false, error: "Only completed rentals can be reviewed." };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Please select a star rating between 1 and 5." };
  }

  if (!comment || comment.trim().length < 5) {
    return { ok: false, error: "Please provide a review comment of at least 5 characters." };
  }

  const newReview: DemoReview = {
    id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    bookingId: booking.id,
    carId: booking.carId,
    renterId: renterAuth.value.id,
    ownerId: booking.ownerId,
    rating,
    comment: comment.trim(),
    ownerReply: null,
    createdAt: new Date().toISOString(),
  };

  const saveResult = writeDemoCollection("reviews", [...reviews, newReview]);
  if (!saveResult.ok) return saveResult;

  // Transition booking to reviewed status
  const updatedBookings = bookings.map((b) =>
    b.id === booking.id
      ? { ...b, status: "reviewed" as const, updatedAt: new Date().toISOString() }
      : b,
  );
  writeDemoCollection("bookings", updatedBookings);

  addNotification({
    title: "Review Submitted",
    message: `Thank you for rating your trip (${rating} stars).`,
    type: "booking",
    link: `/renter/bookings`,
  });

  return { ok: true, value: newReview };
}

export function replyToReview(
  reviewId: string,
  replyText: string,
): ActionResult<DemoReview> {
  const ownerAuth = requireCurrentRole("owner");
  if (!ownerAuth.ok) return ownerAuth;

  const reviewsResult = readDemoCollection("reviews");
  if (!reviewsResult.ok) return reviewsResult;
  const reviews = reviewsResult.value;

  const review = reviews.find(
    (r) => r.id === reviewId && r.ownerId === ownerAuth.value.id,
  );

  if (!review) {
    return { ok: false, error: "Review not found or does not belong to your vehicles." };
  }

  if (!replyText || replyText.trim().length < 2) {
    return { ok: false, error: "Please enter a valid reply." };
  }

  const updatedReview: DemoReview = {
    ...review,
    ownerReply: replyText.trim(),
  };

  const nextReviews = reviews.map((r) => (r.id === reviewId ? updatedReview : r));
  const saveResult = writeDemoCollection("reviews", nextReviews);
  if (!saveResult.ok) return saveResult;

  return { ok: true, value: updatedReview };
}
