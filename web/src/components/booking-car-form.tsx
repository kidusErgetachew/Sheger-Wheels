"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addIsoDays } from "@/lib/dates";
import { useLocalToday } from "@/lib/browser-state";
import { calculateBookingQuote } from "@/lib/demo/booking-actions";
import type { DemoCar } from "@/lib/demo/types";
import { formatEtb } from "@/lib/format";

export function BookingCarForm({ car }: { car: DemoCar }) {
  const router = useRouter();
  const today = useLocalToday();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const selectedStart = startDate || today;
  const selectedEnd = endDate || addIsoDays(selectedStart, 1);

  function reviewBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const quote = calculateBookingQuote(car, selectedStart, selectedEnd);
    if (!quote.ok) {
      setError(quote.error);
      return;
    }
    const query = new URLSearchParams({
      carId: car.id,
      startDate: selectedStart,
      endDate: selectedEnd,
    });
    router.push(`/checkout?${query.toString()}`);
  }

  return (
    <form className="booking-car-form" onSubmit={reviewBooking}>
      <label htmlFor="booking-start-date">Pick-up date</label>
      <input
        id="booking-start-date"
        min={today || undefined}
        onChange={(event) => setStartDate(event.target.value)}
        required
        type="date"
        value={selectedStart}
      />
      <label htmlFor="booking-end-date">Return date</label>
      <input
        id="booking-end-date"
        min={selectedStart ? addIsoDays(selectedStart, 1) : today || undefined}
        onChange={(event) => setEndDate(event.target.value)}
        required
        type="date"
        value={selectedEnd}
      />
      <p className="booking-form-hint">Rental dates use the return date as the end of the trip.</p>
      {error && <p className="form-message form-error" role="alert">{error}</p>}
      <button className="button button-primary detail-primary-action" type="submit">
        Review dates and price <span aria-hidden="true">→</span>
      </button>
      <p className="detail-demo-notice">
        <strong>Demo checkout only</strong>
        No real TeleBirr connection, payment credentials, or charges.
      </p>
      <p className="booking-form-rate">{formatEtb(car.pricePerDay)} per day · fictional rate</p>
    </form>
  );
}
