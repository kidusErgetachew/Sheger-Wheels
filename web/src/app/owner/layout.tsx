import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Owner Workspace",
    template: "%s | Sheggar Wheels Owner",
  },
  description:
    "Manage your vehicle fleet, review customer booking requests, and inspect earnings in Addis Ababa.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
