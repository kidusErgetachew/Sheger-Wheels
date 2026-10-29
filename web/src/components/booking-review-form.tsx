"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBookingData } from "@/lib/demo/booking-store";
import { useCurrentDemoSession } from "@/lib/demo/session-store";
import { submitBookingReview } from "@/lib/demo/review-actions";
import { formatDemoDate } from "@/lib/format";

export function BookingReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { user } = useCurrentDemoSession();
  const { bookings, cars, error: storageError } = useBookingData();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const booking = user
    ? bookings.find((b) => b.id === bookingId && b.renterId === user.id)
    : undefined;
  const car = booking ? cars.find((c) => c.id === booking.carId) : undefined;

  if (storageError) return <p className="form-message form-error" role="alert">{storageError}</p>;
  if (!booking || !car) {
    return (
      <section className="booking-recovery" role="alert">
        <h2>Booking not found</h2>
        <p>This trip record does not exist or does not belong to your account.</p>
        <Link className="button button-primary" href="/renter/bookings">View your rentals</Link>
      </section>
    );
  }

  if (booking.status !== "completed" && booking.status !== "reviewed") {
    return (
      <section className="booking-recovery">
        <h2>Trip not eligible for review</h2>
        <p>You can only review rentals that have reached completed status.</p>
        <Link className="button button-primary" href="/renter/bookings">Return to rentals</Link>
      </section>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = submitBookingReview(bookingId, rating, comment);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
  }

  if (submitted || booking.status === "reviewed") {
    return (
      <div className="checkout-panel review-success-panel">
        <div className="payment-success-badge" aria-hidden="true">✓</div>
        <h2>Review Submitted!</h2>
        <p>Thank you for rating your rental of the <strong>{car.year} {car.make} {car.model}</strong>.</p>
        <div className="booking-record-actions">
          <Link className="button button-primary" href="/">← Back to home page</Link>
          <Link className="button button-outline" href="/renter/bookings">My rentals</Link>
          <Link className="button button-outline" href={`/cars/${encodeURIComponent(car.id)}`}>View car listing</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <section className="checkout-panel">
        <p className="eyebrow">POST-TRIP EVALUATION</p>
        <h2>Rate your trip with the {car.make} {car.model}.</h2>
        <p className="checkout-intro">
          Trip completed on {formatDemoDate(booking.endDate)}. Your review helps future renters in Addis Ababa.
        </p>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="form-group">
            <label className="form-label">Overall Rating</label>
            <div className="star-rating-row" role="radiogroup" aria-label="Select star rating from 1 to 5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  aria-pressed={rating >= star}
                  className={`star-btn ${rating >= star ? "is-filled" : ""}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
              <span className="star-count-label">{rating} of 5 Stars</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="review-comment">
              Your Feedback & Experience
            </label>
            <textarea
              className="form-control"
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the vehicle condition, fuel efficiency, and owner handoff in Addis Ababa?"
              required
            />
          </div>

          {error && <p className="form-message form-error" role="alert">{error}</p>}

          <div className="review-form-actions">
            <Link className="button button-outline" href="/renter/bookings">Cancel</Link>
            <button className="button button-primary" type="submit">Submit review</button>
          </div>
        </form>
      </section>
    </div>
  );
}

