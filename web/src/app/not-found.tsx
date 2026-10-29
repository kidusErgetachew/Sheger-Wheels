import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="not-found-main">
        <p className="eyebrow">Listing unavailable</p>
        <h1>We couldn&apos;t find that car.</h1>
        <p>
          The listing may have been removed or the link may be incorrect.
          Browse the available demo cars to find another ride.
        </p>
        <div className="not-found-actions">
          <Link className="button button-primary" href="/cars">
            Browse available cars <span aria-hidden="true">→</span>
          </Link>
          <Link className="button button-outline" href="/">
            Return home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
