"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBrowserLocationSearch } from "@/lib/browser-state";
import { useCurrentDemoSession } from "@/lib/demo/session-store";
import { useBookingData } from "@/lib/demo/booking-store";
import { getBookingDisplayStatus } from "@/lib/demo/dashboard";
import { transitionDemoBooking } from "@/lib/demo/booking-actions";
import { localIsoDate } from "@/lib/dates";
import { formatDemoDate, formatEtb } from "@/lib/format";

export function BookingRecord({
  receipt = false,
  bookingId: propBookingId,
}: {
  receipt?: boolean;
  bookingId?: string;
}) {
  const { user } = useCurrentDemoSession();
  const { bookings, cars, error: storageError } = useBookingData();
  const search = useBrowserLocationSearch();
  const bookingId = useMemo(
    () => propBookingId || (new URLSearchParams(search).get("bookingId") ?? ""),
    [propBookingId, search],
  );
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, setPending] = useState(false);

  const booking = user && bookingId
    ? bookings.find((item) => item.id === bookingId && item.renterId === user.id)
    : undefined;
  const car = booking && cars.find((item) => item.id === booking.carId);
  const status = booking && getBookingDisplayStatus(booking.status);
  const canCancel = booking &&
    ["requested", "confirmed"].includes(booking.status) &&
    booking.startDate > localIsoDate();

  async function cancelBooking() {
    if (!booking) return;
    setPending(true);
    setActionError("");
    setNotice("");
    const result = await transitionDemoBooking(booking.id, "cancelled");
    setPending(false);
    setConfirmCancel(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setNotice("Your demo booking was cancelled. No payment was taken.");
  }

  if (!bookingId) return <p className="checkout-state" role="status">Loading booking record…</p>;
  if (storageError) return <p className="form-message form-error" role="alert">{storageError}</p>;
  if (!booking || !car) {
    return (
      <section className="booking-recovery" role="alert">
        <h2>Booking not found</h2>
        <p>This booking is unavailable or does not belong to the signed-in renter.</p>
        <Link className="button button-primary" href="/renter/bookings">Return to your bookings</Link>
      </section>
    );
  }
  if (receipt && !booking.transactionReference) {
    return (
      <section className="booking-recovery">
        <h2>No checkout receipt for this seeded booking</h2>
        <p>This fictional sample record was not created through mock checkout and has no transaction reference.</p>
        <Link className="button button-primary" href={`/booking?bookingId=${encodeURIComponent(booking.id)}`}>View booking details</Link>
      </section>
    );
  }

  return (
    <section className="booking-record-panel">
      <div className="booking-record-heading">
        <div>
          <p className="eyebrow">{receipt ? "DEMO RECEIPT" : "BOOKING DETAILS"}</p>
          <h1>{car.year} {car.make} {car.model}</h1>
          <p>{car.neighbourhood}, Addis Ababa · Booking {booking.id}</p>
        </div>
        <span className={`dashboard-status status-${status?.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>
      </div>
      <dl className="checkout-summary">
        <div><dt>Pick-up date</dt><dd>{formatDemoDate(booking.startDate)}</dd></div>
        <div><dt>Return date</dt><dd>{formatDemoDate(booking.endDate)}</dd></div>
        <div><dt>Rental duration</dt><dd>{booking.days} {booking.days === 1 ? "day" : "days"}</dd></div>
        <div><dt>Daily rate · snapshotted</dt><dd>{formatEtb(booking.pricePerDay)} / day</dd></div>
        <div><dt>Rental subtotal</dt><dd>{formatEtb(booking.subtotal)}</dd></div>
        <div><dt>Demo service fee · 5%</dt><dd>{formatEtb(booking.fee)}</dd></div>
        <div className="checkout-total"><dt>Total · ETB</dt><dd>{formatEtb(booking.total)}</dd></div>
        <div>
          <dt>Mock payment status</dt>
          <dd>
            {!booking.transactionReference
              ? "No mock transaction · seeded example"
              : booking.paymentStatus === "refunded"
                ? "Simulated refund · no money moved"
                : "Mock checkout complete · no funds held"}
          </dd>
        </div>
        <div><dt>Mock TeleBirr reference</dt><dd>{booking.transactionReference ?? "Not applicable to this seeded demo record"}</dd></div>
      </dl>
      <p className="checkout-disclaimer">
        <strong>{receipt ? "Fictional demo receipt." : "Fictional demo booking details."}</strong> No TeleBirr service was contacted
        and no real payment or charge was made.
      </p>
      {notice && <p className="form-message form-notice" role="status">{notice}</p>}
      {actionError && <p className="form-message form-error" role="alert">{actionError}</p>}
      {confirmCancel && (
        <div className="booking-cancel-confirm" role="group" aria-label="Confirm cancellation">
          <p>Cancel this booking? This changes only your local demo record; no real payment was made.</p>
          <button className="button button-outline" disabled={pending} onClick={() => setConfirmCancel(false)} type="button">Keep booking</button>
          <button className="button button-danger" disabled={pending} onClick={cancelBooking} type="button">
            {pending ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </div>
      )}
      <div className="booking-record-actions">
        <Link className="button button-primary" href="/">
          ← Back to home page
        </Link>
        <Link className="button button-outline" href="/renter/bookings">
          My bookings
        </Link>
        <Link
          className="button button-outline"
          href={`/bookings/${encodeURIComponent(booking.id)}/track`}
        >
          ⌖ Track simulated trip
        </Link>
        {!receipt && booking.transactionReference && (
          <Link
            className="button button-outline"
            href={`/booking-confirmation?bookingId=${encodeURIComponent(booking.id)}`}
          >
            View receipt
          </Link>
        )}
        {canCancel && !confirmCancel && (
          <button className="button button-danger" onClick={() => setConfirmCancel(true)} type="button">
            Cancel booking
          </button>
        )}
      </div>
    </section>
  );
}
