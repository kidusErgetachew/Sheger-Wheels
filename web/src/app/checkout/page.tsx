import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout-flow";
import { ProtectedDemo } from "@/components/protected-demo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Review your demo booking",
  description: "Review fictional Sheggar Wheels rental dates and ETB pricing.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="booking-page">
        <div className="booking-page-heading">
          <p className="eyebrow">SHEGGAR WHEELS · FICTIONAL DEMO</p>
          <h1>Review your booking.</h1>
          <p>Check dates and the full ETB total before completing a mock checkout.</p>
        </div>
        <ProtectedDemo role="renter"><CheckoutFlow /></ProtectedDemo>
      </main>
      <SiteFooter />
    </>
  );
}
