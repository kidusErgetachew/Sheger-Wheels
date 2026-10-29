import type { Metadata } from "next";
import SignInPage from "../signin/page";

export const metadata: Metadata = {
  title: "Create Demo Renter Account",
  description: "Register a demo renter account for Sheggar Wheels.",
};

export default function SignUpPage() {
  return <SignInPage />;
}

