import { Suspense } from "react";
import type { Metadata } from "next";
import { ProtectedDemo } from "@/components/protected-demo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TripTracking } from "@/components/trip-tracking";

type TrackPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Simulated Trip Tracking",
  description: "Animated frontend trip tracking simulation in Addis Ababa for Sheggar Wheels.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingTrackPage({ params }: TrackPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="booking-page">
        <Suspense fallback={<p className="protected-demo-state" role="status">Loading trip details…</p>}>
          <BookingTrackContent params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function BookingTrackContent({ params }: TrackPageProps) {
  const { id } = await params;

  return (
    <ProtectedDemo role="renter">
      <TripTracking bookingId={id} />
    </ProtectedDemo>
  );
}
