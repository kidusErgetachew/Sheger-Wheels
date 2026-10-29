import type { Metadata } from "next";
import { ProtectedDemo } from "@/components/protected-demo";
import { RenterDashboard } from "@/components/renter-dashboard";

export const metadata: Metadata = {
  title: "Renter Overview",
  description: "View upcoming trips and demo bookings.",
  robots: { index: false, follow: false },
};

export default function DashboardAliasPage() {
  return (
    <ProtectedDemo role="renter">
      <RenterDashboard section="dashboard" />
    </ProtectedDemo>
  );
}

