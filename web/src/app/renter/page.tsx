import type { Metadata } from "next";
import { ProtectedDemo } from "@/components/protected-demo";
import { RenterDashboard } from "@/components/renter-dashboard";

export const metadata: Metadata = {
  title: "Renter dashboard",
  description: "Review your fictional Sheggar Wheels rental bookings.",
};

export default function RenterPage() {
  return <ProtectedDemo role="renter"><RenterDashboard section="dashboard" /></ProtectedDemo>;
}
