import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in to Sheggar Wheels",
  description:
    "Choose a fictional demo profile or register a demo renter account in Addis Ababa.",
  alternates: {
    canonical: "/signin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
