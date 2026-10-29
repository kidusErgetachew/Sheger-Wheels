"use client";

import { useState } from "react";
import Link from "next/link";
import { replyToReview } from "@/lib/demo/review-actions";
import { CarImage } from "@/components/car-image";
import type { DemoBooking, DemoCar, DemoReview, DemoUser } from "@/lib/demo/types";

export function OwnerReviewsManager({
  user,
  cars,
  reviews,
  users,
}: {
  user: DemoUser;
  cars: DemoCar[];
  reviews: DemoReview[];
  users: DemoUser[];
}) {
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const ownerCars = cars.filter((c) => c.ownerId === user.id);
  const ownerCarIds = new Set(ownerCars.map((c) => c.id));
  const carReviews = reviews.filter((r) => ownerCarIds.has(r.carId) || r.ownerId === user.id);

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  function handleReplySubmit(reviewId: string) {
    setErrorMessage("");
    setSuccessMessage("");

    const result = replyToReview(reviewId, replyText);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage("Your reply has been published successfully.");
    setActiveReplyId(null);
    setReplyText("");
  }

  return (
    <div className="owner-reviews-space">
      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">OWNER · REPUTATION &amp; FEEDBACK</p>
          <h2>Customer Reviews ({carReviews.length})</h2>
          <p>
            Read reviews from renters who completed trips in your vehicles and reply with owner notes.
          </p>
        </div>
      </section>

      {errorMessage && (
        <p className="dashboard-alert" role="alert" style={{ marginBottom: "16px" }}>
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p
          className="dashboard-alert"
          style={{
            marginBottom: "16px",
            background: "rgba(16, 185, 129, 0.1)",
            borderColor: "var(--color-primary, #059669)",
            color: "var(--color-primary, #059669)",
          }}
        >
          {successMessage}
        </p>
      )}

      {carReviews.length === 0 ? (
        <div className="dashboard-empty">
          <span aria-hidden="true">★</span>
          <strong>No customer reviews yet</strong>
          <p>
            When renters complete trips with your vehicles and submit feedback, their ratings and reviews will appear here.
          </p>
          <Link href="/owner/listings" className="button button-primary">
            Manage listings
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {carReviews.map((rev) => {
            const car = carMap.get(rev.carId);
            const renter = userMap.get(rev.renterId);

            return (
              <article
                key={rev.id}
                className="dashboard-panel"
                style={{ display: "flex", flexDirection: "column", gap: "14px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {car?.photos?.[0] && (
                      <div style={{ width: 64, height: 48, position: "relative", borderRadius: 6, overflow: "hidden" }}>
                        <CarImage alt={car.model} fill sizes="64px" src={car.photos[0]} />
                      </div>
                    )}
                    <div>
                      <strong>{car ? `${car.year} ${car.make} ${car.model}` : "Vehicle"}</strong>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-ink-muted, #64748b)" }}>
                        Renter: <strong>{renter?.name ?? "Kidus E."}</strong> · {rev.createdAt.slice(0, 10)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        style={{
                          color: s <= rev.rating ? "#f59e0b" : "#cbd5e1",
                          fontSize: "1.2rem",
                        }}
                      >
                        ★
                      </span>
                    ))}
                    <span style={{ fontWeight: 700, marginLeft: "4px" }}>{rev.rating}.0</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--color-surface-sunken, #f8fafc)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border-subtle, #e2e8f0)",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                >
                  &ldquo;{rev.comment}&rdquo;
                </div>

                {rev.ownerReply ? (
                  <div
                    style={{
                      marginLeft: "18px",
                      padding: "10px 14px",
                      background: "rgba(5, 150, 105, 0.06)",
                      borderLeft: "3px solid var(--color-primary, #059669)",
                      borderRadius: "0 6px 6px 0",
                      fontSize: "0.9rem",
                    }}
                  >
                    <strong style={{ color: "var(--color-primary, #059669)", display: "block", marginBottom: "4px" }}>
                      Your Response:
                    </strong>
                    <span>{rev.ownerReply}</span>
                  </div>
                ) : (
                  <div>
                    {activeReplyId === rev.id ? (
                      <div style={{ marginTop: "8px" }}>
                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a polite response to this renter review…"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border, #cbd5e1)",
                            background: "var(--color-surface, #fff)",
                            color: "inherit",
                            fontFamily: "inherit",
                            fontSize: "0.9rem",
                            resize: "vertical",
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button
                            type="button"
                            className="button button-primary button-small"
                            onClick={() => handleReplySubmit(rev.id)}
                          >
                            Publish Reply
                          </button>
                          <button
                            type="button"
                            className="button button-outline button-small"
                            onClick={() => {
                              setActiveReplyId(null);
                              setReplyText("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="button button-outline button-small"
                        onClick={() => {
                          setActiveReplyId(rev.id);
                          setReplyText("");
                        }}
                      >
                        Reply to Renter
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

