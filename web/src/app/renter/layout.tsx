import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Renter Workspace",
    template: "%s | Sheggar Wheels Renter",
  },
  description: "Review and manage your demo vehicle bookings in Addis Ababa.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
