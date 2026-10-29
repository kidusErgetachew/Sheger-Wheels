import { Suspense } from "react";
import type { Metadata } from "next";
import { CarCatalogue } from "@/components/car-catalogue";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCars, filtersFromSearchParams } from "@/lib/demo/catalog";
import { DEMO_DATA } from "@/lib/demo/seed";

export const metadata: Metadata = {
  title: "Browse cars in Addis Ababa",
  description:
    "Search fictional Addis Ababa car listings by vehicle type, transmission, daily price range, location, seats, and travel dates.",
  alternates: {
    canonical: "/cars",
  },
  openGraph: {
    title: "Browse cars in Addis Ababa | Sheggar Wheels",
    description:
      "Filter and compare fictional rental vehicles across Addis Ababa neighbourhoods.",
    url: "/cars",
    type: "website",
  },
};

type CataloguePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function CatalogueResults({ searchParams }: CataloguePageProps) {
  const params = await searchParams;
  const initialFilters = filtersFromSearchParams(params);
  const cars = getPublicCars(DEMO_DATA);
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const initialPage =
    Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return (
    <CarCatalogue
      cars={cars}
      key={`${JSON.stringify(initialFilters)}:${initialPage}`}
      initialFilters={initialFilters}
      initialPage={initialPage}
    />
  );
}

export default function CataloguePage({ searchParams }: CataloguePageProps) {
  return (
    <>
      <SiteHeader />
      <main className="catalogue-main">
        <section className="catalogue-intro">
          <div>
            <p className="eyebrow">Fictional local listings</p>
            <h1>Find your ride in Addis.</h1>
            <p>Filter by vehicle type, transmission, ETB price range, and Addis location.</p>
          </div>
          <span className="catalogue-location"><span aria-hidden="true">⌖</span> Addis Ababa, Ethiopia</span>
        </section>
        <Suspense fallback={<p className="catalogue-loading" role="status">Loading available cars…</p>}>
          <CatalogueResults searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
