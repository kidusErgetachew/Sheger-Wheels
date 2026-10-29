import type { Metadata } from "next";
import { ProtectedDemo } from "@/components/protected-demo";
import { RenterDashboard } from "@/components/renter-dashboard";

export const metadata: Metadata = {
  title: "Renter booking history",
  description: "View all demo bookings belonging to your Sheggar Wheels renter account.",
};

export default function RenterBookingsPage() {
  return <ProtectedDemo role="renter"><RenterDashboard section="bookings" /></ProtectedDemo>;
}
