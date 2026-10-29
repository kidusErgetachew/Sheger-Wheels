import type { Metadata } from "next";
import { BookingRecord } from "@/components/booking-record";
import { ProtectedDemo } from "@/components/protected-demo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type BookingDetailProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Demo booking details",
  description: "View your Sheggar Wheels booking details and allowed lifecycle actions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BookingDetailPage({ params }: BookingDetailProps) {
  const { id } = await params;

  return (
    <>
      <SiteHeader />
      <main className="booking-page booking-page-narrow">
        <ProtectedDemo role="renter">
          <BookingRecord bookingId={id} />
        </ProtectedDemo>
      </main>
      <SiteFooter />
    </>
  );
}
