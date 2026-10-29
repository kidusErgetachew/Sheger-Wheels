import type { Metadata } from "next";
import { ProtectedDemo } from "@/components/protected-demo";
import { RenterDashboard } from "@/components/renter-dashboard";

export const metadata: Metadata = {
  title: "My Demo Bookings",
  description: "View and filter your demo booking history.",
  robots: { index: false, follow: false },
};

export default function BookingsAliasPage() {
  return (
    <ProtectedDemo role="renter">
      <RenterDashboard section="bookings" />
    </ProtectedDemo>
  );
}

