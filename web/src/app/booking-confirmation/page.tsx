import type { Metadata } from "next";
import { BookingRecord } from "@/components/booking-record";
import { ProtectedDemo } from "@/components/protected-demo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Demo booking confirmation",
  description: "View the fictional confirmation and receipt for your Sheggar Wheels demo booking.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingConfirmationPage() {
  return (
    <>
      <SiteHeader />
      <main className="booking-page booking-page-narrow">
        <ProtectedDemo role="renter"><BookingRecord receipt /></ProtectedDemo>
      </main>
      <SiteFooter />
    </>
  );
}
