import type { Metadata } from "next";
import { BookingRecord } from "@/components/booking-record";
import { ProtectedDemo } from "@/components/protected-demo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Your booking details",
  description: "View or cancel your Sheggar Wheels demo booking.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingPage() {
  return (
    <>
      <SiteHeader />
      <main className="booking-page booking-page-narrow">
        <ProtectedDemo role="renter"><BookingRecord /></ProtectedDemo>
      </main>
      <SiteFooter />
    </>
  );
}
