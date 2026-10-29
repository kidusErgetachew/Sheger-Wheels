import { requireCurrentRole } from "./session";
import { readDemoCollection, writeDemoCollection } from "./storage";
import type { ActionResult, DemoBooking, DemoDispute } from "./types";

export function resolveDemoDispute(
  disputeId: string,
  resolutionNotes: string,
): ActionResult<DemoDispute> {
  const authorized = requireCurrentRole("admin");
  if (!authorized.ok) return authorized;

  const notes = resolutionNotes.trim();
  if (notes.length < 5) {
    return {
      ok: false,
      error: "Please provide resolution notes explaining the outcome (at least 5 characters).",
    };
  }

  const storedDisputes = readDemoCollection("disputes");
  if (!storedDisputes.ok) return storedDisputes;

  const dispute = storedDisputes.value.find((d) => d.id === disputeId);
  if (!dispute) {
    return { ok: false, error: `Dispute "${disputeId}" was not found.` };
  }

  const now = new Date().toISOString();
  const updatedDispute: DemoDispute = {
    ...dispute,
    status: "resolved",
    resolutionNotes: notes,
    resolvedBy: authorized.value.id,
    resolvedAt: now,
  };

  const savedDisputes = writeDemoCollection(
    "disputes",
    storedDisputes.value.map((d) => (d.id === disputeId ? updatedDispute : d)),
  );
  if (!savedDisputes.ok) return savedDisputes;

  // Also transition the related booking if it's currently marked as disputed
  const storedBookings = readDemoCollection("bookings");
  if (storedBookings.ok) {
    const booking = storedBookings.value.find((b) => b.id === dispute.bookingId);
    if (booking && booking.status === "disputed") {
      const updatedBooking: DemoBooking = {
        ...booking,
        status: "resolved",
        updatedAt: now,
      };
      writeDemoCollection(
        "bookings",
        storedBookings.value.map((b) =>
          b.id === booking.id ? updatedBooking : b,
        ),
      );
    }
  }

  return { ok: true, value: updatedDispute };
}
