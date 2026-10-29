import { DemoDashboard } from "@/components/demo-dashboard";
import { ProtectedDemo } from "@/components/protected-demo";

export type DashboardSection =
  | "dashboard"
  | "listings"
  | "new-listing"
  | "edit-listing"
  | "bookings"
  | "earnings"
  | "users"
  | "disputes"
  | "announcements"
  | "reports"
  | "reviews"
  | "profile"
  | "settings";

export function DashboardRoute({
  role,
  section,
}: {
  role: "owner" | "admin";
  section: DashboardSection;
}) {
  return (
    <ProtectedDemo role={role}>
      <DemoDashboard role={role} section={section} />
    </ProtectedDemo>
  );
}
