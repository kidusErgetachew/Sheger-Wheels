"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useCurrentDemoSession } from "@/lib/demo/session-store";
import { useBookingData } from "@/lib/demo/booking-store";
import { useBrowserLocationSearch } from "@/lib/browser-state";
import {
  calculateBookingQuote,
  createDemoBooking,
  hasBookingConflict,
  type BookingQuote,
} from "@/lib/demo/booking-actions";
import { formatDemoDate, formatEtb } from "@/lib/format";
import { addNotification } from "@/lib/demo/notifications";
import type { DemoBooking } from "@/lib/demo/types";

type CheckoutRequest = {
  carId: string;
  startDate: string;
  endDate: string;
};

type CheckoutStep = "review" | "telebirr_modal" | "processing" | "succeeded";

export function CheckoutFlow() {
  const { user } = useCurrentDemoSession();
  const data = useBookingData();
  const search = useBrowserLocationSearch();

  const [step, setStep] = useState<CheckoutStep>("review");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState(user?.phone || "0911223344");
  const [pin, setPin] = useState("1234");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "ussd">("wallet");
  const [createdBooking, setCreatedBooking] = useState<DemoBooking | null>(null);

  const request = useMemo<CheckoutRequest | null>(() => {
    if (!search) return null;
    const params = new URLSearchParams(search);
    return {
      carId: params.get("carId") ?? "",
      startDate: params.get("startDate") ?? "",
      endDate: params.get("endDate") ?? "",
    };
  }, [search]);

  const car = request && data.cars.find((item) => item.id === request.carId);
  const quoteResult = useMemo(
    () => (car && request ? calculateBookingQuote(car, request.startDate, request.endDate) : null),
    [car, request],
  );
  const quote: BookingQuote | null = quoteResult?.ok ? quoteResult.value : null;
  const conflict = quote ? hasBookingConflict(data.bookings, quote) : false;

  function openTelebirrModal(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!quote) {
      setError(quoteResult && !quoteResult.ok ? quoteResult.error : "The booking details are incomplete.");
      return;
    }
    if (conflict) {
      setError("These dates are no longer available. Return to the vehicle and choose other dates.");
      return;
    }
    setStep("telebirr_modal");
  }

  async function handleCompleteDemoPayment() {
    if (!quote || !car) return;
    setError("");
    setStep("processing");

    // Add a simulated network latency to mimic the real TeleBirr gateway round-trip
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const result = await createDemoBooking(quote);
    if (!result.ok) {
      setError(result.error);
      setStep("telebirr_modal");
      return;
    }

    setCreatedBooking(result.value);
    setStep("succeeded");

    // Record in-app notification
    addNotification({
      title: "TeleBirr Mock Payment Succeeded",
      message: `Reservation confirmed for ${car.year} ${car.make} ${car.model}. Mock Ref: ${result.value.transactionReference}`,
      type: "payment",
      link: `/booking-confirmation?bookingId=${encodeURIComponent(result.value.id)}`,
    });
  }

  if (!request) return <p className="checkout-state" role="status">Preparing your demo checkout…</p>;
  if (data.error) return <p className="form-message form-error" role="alert">{data.error}</p>;
  if (!car || !quote) {
    return (
      <div className="booking-recovery">
        <h2>We couldn’t prepare this booking.</h2>
        <p>{quoteResult && !quoteResult.ok ? quoteResult.error : "The selected vehicle or rental dates are missing."}</p>
        <Link className="button button-primary" href="/cars">Browse available cars</Link>
      </div>
    );
  }

  /* =========================================================================
     VIEW: PAYMENT SUCCEEDED
     ========================================================================= */
  if (step === "succeeded" && createdBooking) {
    return (
      <div className="checkout-layout">
        <section className="checkout-panel payment-succeeded-panel">
          <div className="payment-succeeded-header">
            <div className="payment-success-badge" aria-hidden="true">
              <svg fill="none" height="42" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="42">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="eyebrow">TRANSACTION CONFIRMED · DEMO ENVIRONMENT</p>
            <h1>Payment Succeeded!</h1>
            <p className="payment-success-subtitle">
              Your mock TeleBirr transaction was verified. Your trip with the{" "}
              <strong>{car.year} {car.make} {car.model}</strong> is confirmed.
            </p>
          </div>

          <div className="telebirr-receipt-box">
            <div className="telebirr-receipt-top">
              <div className="telebirr-logo-badge">
                <span className="telebirr-pill-text">telebirr</span>
                <span className="telebirr-ethio-text">ethio telecom</span>
              </div>
              <span className="telebirr-status-pill">SIMULATED PAYMENT</span>
            </div>

            <dl className="telebirr-receipt-grid">
              <div>
                <dt>Mock TeleBirr Reference</dt>
                <dd className="telebirr-mono-code">{createdBooking.transactionReference}</dd>
              </div>
              <div>
                <dt>Amount Paid</dt>
                <dd className="telebirr-paid-amount">{formatEtb(createdBooking.total)}</dd>
              </div>
              <div>
                <dt>Payer Account (Simulated)</dt>
                <dd>{phone || "Demo Wallet (+251 9...)"}</dd>
              </div>
              <div>
                <dt>Merchant</dt>
                <dd>Sheggar Wheels Marketplace (Demo)</dd>
              </div>
              <div>
                <dt>Rental Pick-up</dt>
                <dd>{formatDemoDate(createdBooking.startDate)} · {car.neighbourhood}</dd>
              </div>
              <div>
                <dt>Rental Return</dt>
                <dd>{formatDemoDate(createdBooking.endDate)}</dd>
              </div>
            </dl>
          </div>

          <div className="payment-success-actions">
            <Link className="button button-primary button-lg payment-home-btn" href="/">
              ← Back to home page
            </Link>
            <div className="payment-secondary-links">
              <Link
                className="button button-outline"
                href={`/booking-confirmation?bookingId=${encodeURIComponent(createdBooking.id)}`}
              >
                📄 View booking receipt
              </Link>
              <Link
                className="button button-outline"
                href={`/bookings/${encodeURIComponent(createdBooking.id)}/track`}
              >
                ⌖ Track simulated trip
              </Link>
              <Link className="button button-outline" href="/renter/bookings">
                🚘 My rentals
              </Link>
            </div>
          </div>

          <p className="checkout-disclaimer">
            <strong>Fictional demonstration only.</strong> No money was charged, no Ethio Telecom service
            was contacted, and no real payment credentials were collected.
          </p>
        </section>
      </div>
    );
  }

  /* =========================================================================
     VIEW: TRIP REVIEW & TELEBIRR TRIGGER
     ========================================================================= */
  return (
    <div className="checkout-layout">
      <section className="checkout-panel">
        <p className="eyebrow">STEP 2 · REVIEW AND CHECK OUT</p>
        <h2>Confirm your trip.</h2>
        <p className="checkout-intro">
          Signed in as <strong>{user?.name}</strong>. Review your snapshotted quote before opening the
          mock TeleBirr simulation gateway.
        </p>

        <dl className="checkout-summary">
          <div><dt>Vehicle</dt><dd>{car.year} {car.make} {car.model}</dd></div>
          <div><dt>Pick-up area</dt><dd>{car.neighbourhood}, Addis Ababa</dd></div>
          <div><dt>Pick-up date</dt><dd>{formatDemoDate(quote.startDate)}</dd></div>
          <div><dt>Return date</dt><dd>{formatDemoDate(quote.endDate)}</dd></div>
          <div><dt>Duration</dt><dd>{quote.days} {quote.days === 1 ? "day" : "days"}</dd></div>
          <div><dt>Daily rate · snapshotted</dt><dd>{formatEtb(quote.pricePerDay)} / day</dd></div>
          <div><dt>Rental subtotal</dt><dd>{formatEtb(quote.subtotal)}</dd></div>
          <div><dt>Demo service fee · 5%</dt><dd>{formatEtb(quote.fee)}</dd></div>
          <div className="checkout-total"><dt>Total · ETB</dt><dd>{formatEtb(quote.total)}</dd></div>
        </dl>

        {conflict && (
          <p className="form-message form-error" role="alert">
            These dates overlap an active booking. Choose another rental period.
          </p>
        )}
        {error && <p className="form-message form-error" role="alert">{error}</p>}

        <form onSubmit={openTelebirrModal}>
          <button className="button button-primary checkout-submit" disabled={conflict} type="submit">
            Pay with TeleBirr (Mock Demo) →
          </button>
        </form>

        <p className="checkout-disclaimer">
          <strong>Mock checkout — no real payment.</strong> This is a local demo
          simulation only. No TeleBirr service is contacted; no financial details
          are requested or stored, and no money is charged.
        </p>
        <Link className="text-link" href={`/cars/${encodeURIComponent(car.id)}`}>
          ← Change dates or choose another car
        </Link>
      </section>

      {/* =========================================================================
         MODAL: FAKE TELEBIRR PAYMENT SIMULATION
         ========================================================================= */}
      {step === "telebirr_modal" && (
        <div className="telebirr-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="telebirr-title">
          <div className="telebirr-modal-container">
            <div className="telebirr-modal-header">
              <div className="telebirr-brand-row">
                <span className="telebirr-logo-mark">telebirr</span>
                <span className="telebirr-submark">by ethio telecom</span>
              </div>
              <span className="telebirr-sandbox-pill">DEMO SANDBOX</span>
            </div>

            <div className="telebirr-alert-banner">
              ⚠️ <strong>DEMO ENVIRONMENT ONLY:</strong> No actual money is transferred. Do not enter real sensitive PINs or passwords.
            </div>

            <div className="telebirr-modal-body">
              <h2 id="telebirr-title">TeleBirr Payment Simulation</h2>
              <div className="telebirr-amount-display">
                <span>Total Payment</span>
                <strong>{formatEtb(quote.total)}</strong>
                <small>Merchant: Sheggar Wheels Car Rental PLC</small>
              </div>

              <div className="telebirr-methods">
                <label className={`telebirr-method-chip ${paymentMethod === "wallet" ? "active" : ""}`}>
                  <input
                    checked={paymentMethod === "wallet"}
                    name="telebirr-method"
                    onChange={() => setPaymentMethod("wallet")}
                    type="radio"
                  />
                  <span>📱 TeleBirr SuperApp Wallet</span>
                </label>
                <label className={`telebirr-method-chip ${paymentMethod === "ussd" ? "active" : ""}`}>
                  <input
                    checked={paymentMethod === "ussd"}
                    name="telebirr-method"
                    onChange={() => setPaymentMethod("ussd")}
                    type="radio"
                  />
                  <span>#️⃣ USSD Push (*127#)</span>
                </label>
              </div>

              <div className="telebirr-form-group">
                <label className="form-label" htmlFor="telebirr-phone">
                  Simulated TeleBirr Phone Number
                </label>
                <input
                  className="form-control"
                  id="telebirr-phone"
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0911223344"
                  type="tel"
                  value={phone}
                />
                <span className="telebirr-field-hint">Ethiopian mobile number prefix (09... / 07...)</span>
              </div>

              <div className="telebirr-form-group">
                <label className="form-label" htmlFor="telebirr-pin">
                  Simulated 4-Digit PIN
                </label>
                <input
                  className="form-control telebirr-pin-input"
                  id="telebirr-pin"
                  maxLength={4}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  type="password"
                  value={pin}
                />
                <span className="telebirr-field-hint">Any mock 4 digits (e.g. 1234) for evaluation</span>
              </div>

              {error && <p className="form-message form-error" role="alert">{error}</p>}
            </div>

            <div className="telebirr-modal-footer">
              <button
                className="button button-outline telebirr-cancel-btn"
                onClick={() => setStep("review")}
                type="button"
              >
                Cancel
              </button>
              <button
                className="button telebirr-submit-btn"
                onClick={handleCompleteDemoPayment}
                type="button"
              >
                Complete demo payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL: PROCESSING STATE
         ========================================================================= */}
      {step === "processing" && (
        <div className="telebirr-modal-overlay">
          <div className="telebirr-modal-container telebirr-processing-box">
            <div className="telebirr-spinner" aria-hidden="true" />
            <h3>Processing TeleBirr Simulation…</h3>
            <p>Connecting to simulated Ethio Telecom gateway. Validating demo credentials and recording reservation lock.</p>
          </div>
        </div>
      )}
    </div>
  );
}
