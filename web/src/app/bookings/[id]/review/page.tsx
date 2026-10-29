import type { Metadata } from "next";
import { BookingReviewForm } from "@/components/booking-review-form";
import { ProtectedDemo } from "@/components/protected-demo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type ReviewPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Review your completed trip",
  description: "Leave a customer review and rating for your Sheggar Wheels rental.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BookingReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;

  return (
    <>
      <SiteHeader />
      <main className="booking-page booking-page-narrow">
        <ProtectedDemo role="renter">
          <BookingReviewForm bookingId={id} />
        </ProtectedDemo>
      </main>
      <SiteFooter />
    </>
  );
}

