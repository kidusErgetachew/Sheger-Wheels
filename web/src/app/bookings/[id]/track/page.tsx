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

export default async function BookingTrackPage({ params }: TrackPageProps) {
  const { id } = await params;

  return (
    <>
      <SiteHeader />
      <main className="booking-page">
        <ProtectedDemo role="renter">
          <TripTracking bookingId={id} />
        </ProtectedDemo>
      </main>
      <SiteFooter />
    </>
  );
}

