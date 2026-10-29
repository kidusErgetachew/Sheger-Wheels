import type { BookingStatus, UserRole } from "./types";

const TRANSITIONS: Partial<
  Record<BookingStatus, Partial<Record<BookingStatus, UserRole>>>
> = {
  requested: { confirmed: "owner", declined: "owner", cancelled: "renter" },
  confirmed: { in_progress: "owner", cancelled: "renter" },
  in_progress: { completed: "owner", disputed: "renter" },
  completed: { reviewed: "renter" },
  disputed: { resolved: "admin" },
};

export function requiredBookingTransitionRole(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus,
): UserRole | null {
  return TRANSITIONS[currentStatus]?.[nextStatus] ?? null;
}

export function dateRangesOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
): boolean {
  return firstStart < secondEnd && secondStart < firstEnd;
}
