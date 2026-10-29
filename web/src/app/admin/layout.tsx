import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Platform Administration",
    template: "%s | Sheggar Wheels Admin",
  },
  description:
    "Oversee marketplace listings, users, reservations, and dispute resolution for Sheggar Wheels.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
