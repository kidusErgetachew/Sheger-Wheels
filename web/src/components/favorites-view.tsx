"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CarCard } from "@/components/car-card";
import { useFavorites } from "@/lib/demo/favorites";
import { DEMO_DATA } from "@/lib/demo/seed";
import { getPublicCars } from "@/lib/demo/catalog";
import type { DemoCar } from "@/lib/demo/types";
import { useSyncExternalStore } from "react";
import { subscribeToDemoData, getCatalogueSnapshot, type CatalogueSnapshot } from "@/lib/demo/browser-store";

export function FavoritesView() {
  const { favorites, count, clearFavorites } = useFavorites();

  const fallbackSnapshot = JSON.stringify({
    cars: getPublicCars(DEMO_DATA),
    bookings: DEMO_DATA.bookings,
    error: "",
  } satisfies CatalogueSnapshot);

  const serialized = useSyncExternalStore(
    subscribeToDemoData,
    getCatalogueSnapshot,
    () => fallbackSnapshot,
  );

  const allCars = useMemo<DemoCar[]>(() => {
    try {
      const parsed = JSON.parse(serialized) as CatalogueSnapshot;
      return parsed.cars || getPublicCars(DEMO_DATA);
    } catch {
      return getPublicCars(DEMO_DATA);
    }
  }, [serialized]);

  const savedCars = useMemo(() => {
    return allCars.filter((car) => favorites.includes(car.id));
  }, [allCars, favorites]);

  return (
    <main className="favorites-main detail-main">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/cars">Browse cars</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Saved vehicles</span>
      </nav>

      <section className="favorites-heading">
        <div>
          <p className="eyebrow">Your shortlist</p>
          <h1>Saved Vehicles</h1>
          <p className="favorites-subtitle">
            {count === 0
              ? "You haven't saved any cars yet."
              : `You have ${count} ${count === 1 ? "car" : "cars"} saved for your trips in Addis Ababa.`}
          </p>
        </div>
        {count > 0 && (
          <button
            className="button button-outline clear-favorites-btn"
            onClick={clearFavorites}
            type="button"
          >
            Clear all saved
          </button>
        )}
      </section>

      {savedCars.length > 0 ? (
        <div className="car-grid favorites-grid">
          {savedCars.map((car) => (
            <CarCard car={car} key={car.id} />
          ))}
        </div>
      ) : (
        <div className="favorites-empty-state">
          <div className="empty-heart-icon" aria-hidden="true">
            <svg
              fill="none"
              height="48"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              width="48"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <h2>No saved vehicles yet</h2>
          <p>
            Browse our Addis Ababa fleet and click the heart icon on any vehicle to save it here for quick access and comparison.
          </p>
          <Link className="button button-primary" href="/cars">
            Explore Addis fleet →
          </Link>
        </div>
      )}
    </main>
  );
}
