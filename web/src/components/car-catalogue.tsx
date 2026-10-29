"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { CarCard } from "@/components/car-card";
import {
  getCatalogueSnapshot,
  subscribeToDemoData,
  type CatalogueSnapshot,
} from "@/lib/demo/browser-store";
import {
  ADDIS_NEIGHBOURHOODS,
  VEHICLE_TYPES,
  filterPublicCars,
  type CatalogueFilters,
} from "@/lib/demo/catalog";
import { localIsoDate } from "@/lib/dates";
import { DEMO_DATA } from "@/lib/demo/seed";
import type { DemoCar } from "@/lib/demo/types";
import { useFavorites } from "@/lib/demo/favorites";

const PAGE_SIZE = 6;

type CarCatalogueProps = {
  cars: DemoCar[];
  initialFilters: CatalogueFilters;
  initialPage: number;
};

function buildPageHref(filters: CatalogueFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.neighbourhood) params.set("neighbourhood", filters.neighbourhood);
  if (filters.vehicleType) params.set("vehicleType", filters.vehicleType);
  if (filters.transmission) params.set("transmission", filters.transmission);
  if (filters.seats) params.set("seats", filters.seats);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.sort !== "popular") params.set("sort", filters.sort);
  params.set("page", String(page));
  return `/cars?${params.toString()}`;
}

export function CarCatalogue({
  cars: seedCars,
  initialFilters,
  initialPage,
}: CarCatalogueProps) {
  const router = useRouter();
  const fallbackSnapshot = JSON.stringify({
    cars: seedCars,
    bookings: DEMO_DATA.bookings,
    error: "",
  } satisfies CatalogueSnapshot);
  const serializedSnapshot = useSyncExternalStore(
    subscribeToDemoData,
    getCatalogueSnapshot,
    () => fallbackSnapshot,
  );
  const {
    cars,
    bookings,
    error: storageError,
  } = JSON.parse(serializedSnapshot) as CatalogueSnapshot;
  const { favorites, count: favoriteCount } = useFavorites();
  const [filters, setFilters] = useState(initialFilters);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const filteredCars = useMemo(() => {
    const list = filterPublicCars(cars, bookings, filters);
    if (onlyFavorites) {
      return list.filter((car) => favorites.includes(car.id));
    }
    return list;
  }, [bookings, cars, filters, onlyFavorites, favorites]);
  const pageCount = Math.max(1, Math.ceil(filteredCars.length / PAGE_SIZE));
  const page = Math.min(initialPage, pageCount);
  const pageCars = filteredCars.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateFilter<K extends keyof CatalogueFilters>(
    key: K,
    value: CatalogueFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const start = form.elements.namedItem("startDate");
    const end = form.elements.namedItem("endDate");
    if (!(start instanceof HTMLInputElement) || !(end instanceof HTMLInputElement)) {
      return;
    }

    start.setCustomValidity("");
    end.setCustomValidity("");
    if (start.value && start.value < localIsoDate()) {
      start.setCustomValidity("Pick today or a future date.");
    } else if (Boolean(start.value) !== Boolean(end.value)) {
      (start.value ? end : start).setCustomValidity(
        "Choose both pick-up and drop-off dates.",
      );
    } else if (start.value && end.value <= start.value) {
      end.setCustomValidity("The drop-off date must be after pick-up.");
    }
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value) params.set(key, value);
    }
    const query = params.toString();
    router.push(`/cars${query ? `?${query}` : ""}`);
  }

  function submitSort(value: string) {
    const next = { ...filters, sort: value };
    setFilters(next);
    router.push(buildPageHref(next, 1));
  }

  return (
    <div className="catalogue-layout">
      <aside className="catalogue-filter-panel" aria-labelledby="filters-heading">
        <div className="filter-heading">
          <h2 id="filters-heading">Refine your search</h2>
          <Link href="/cars" onClick={() => setOnlyFavorites(false)}>Clear</Link>
        </div>
        <div className="filter-saved-quick-toggle">
          <label className={`saved-toggle-pill ${onlyFavorites ? "active" : ""}`}>
            <input
              checked={onlyFavorites}
              className="sr-only"
              onChange={(e) => setOnlyFavorites(e.target.checked)}
              type="checkbox"
            />
            <span aria-hidden="true" className="saved-toggle-heart">♥</span>
            <span>Saved only</span>
            <span className="saved-toggle-badge">{favoriteCount}</span>
          </label>
        </div>
        <form className="catalogue-filters" onSubmit={applyFilters}>
          <label className="form-label" htmlFor="car-query">Make or model</label>
          <input
            autoComplete="off"
            className="form-control"
            id="car-query"
            maxLength={80}
            name="q"
            onChange={(event) => updateFilter("query", event.target.value)}
            placeholder="e.g. Toyota"
            value={filters.query}
          />

          <label className="form-label" htmlFor="car-type">Vehicle type</label>
          <select
            className="form-control"
            id="car-type"
            name="vehicleType"
            onChange={(event) => updateFilter("vehicleType", event.target.value)}
            value={filters.vehicleType}
          >
            <option value="">Any vehicle type</option>
            {VEHICLE_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>

          <label className="form-label" htmlFor="car-transmission">Transmission</label>
          <select
            className="form-control"
            id="car-transmission"
            name="transmission"
            onChange={(event) => updateFilter("transmission", event.target.value)}
            value={filters.transmission}
          >
            <option value="">Any transmission</option>
            <option>Automatic</option>
            <option>Manual</option>
          </select>

          <span className="form-label">Price range per day (ETB)</span>
          <div className="price-range-fields">
            <div className="price-input">
              <span aria-hidden="true">ETB</span>
              <input
                aria-label="Minimum daily price"
                className="form-control"
                id="min-price"
                max={filters.maxPrice || 50000}
                min={500}
                name="minPrice"
                onChange={(event) => updateFilter("minPrice", event.target.value)}
                placeholder="Min"
                step={100}
                type="number"
                value={filters.minPrice}
              />
            </div>
            <div className="price-input">
              <span aria-hidden="true">ETB</span>
              <input
                aria-label="Maximum daily price"
                className="form-control"
                id="max-price"
                max={50000}
                min={filters.minPrice || 500}
                name="maxPrice"
                onChange={(event) => updateFilter("maxPrice", event.target.value)}
                placeholder="Max"
                step={100}
                type="number"
                value={filters.maxPrice}
              />
            </div>
          </div>

          <label className="form-label" htmlFor="car-neighbourhood">Location</label>
          <select
            className="form-control"
            id="car-neighbourhood"
            name="neighbourhood"
            onChange={(event) => updateFilter("neighbourhood", event.target.value)}
            value={filters.neighbourhood}
          >
            <option value="">All Addis Ababa</option>
            {ADDIS_NEIGHBOURHOODS
              .map((neighbourhood) => <option key={neighbourhood}>{neighbourhood}</option>)}
          </select>

          <label className="form-label" htmlFor="car-seats">Minimum seats</label>
          <select
            className="form-control"
            id="car-seats"
            name="seats"
            onChange={(event) => updateFilter("seats", event.target.value)}
            value={filters.seats}
          >
            <option value="">Any number</option>
            <option value="4">4+ seats</option>
            <option value="5">5+ seats</option>
            <option value="7">7+ seats</option>
          </select>

          <label className="form-label" htmlFor="start-date">Pick-up date</label>
          <input
            className="form-control"
            id="start-date"
            max={filters.endDate || undefined}
            name="startDate"
            onChange={(event) => updateFilter("startDate", event.target.value)}
            type="date"
            value={filters.startDate}
          />

          <label className="form-label" htmlFor="end-date">Drop-off date</label>
          <input
            className="form-control"
            id="end-date"
            min={filters.startDate || undefined}
            name="endDate"
            onChange={(event) => updateFilter("endDate", event.target.value)}
            type="date"
            value={filters.endDate}
          />
          <input name="sort" type="hidden" value={filters.sort} />
          <button className="button button-primary filter-submit" type="submit">
            Apply filters
          </button>
        </form>
        {storageError && <p className="storage-alert" role="status">{storageError}</p>}
      </aside>

      <section className="catalogue-results" aria-labelledby="results-heading">
        <div className="catalogue-results-heading">
          <div>
            <h2 id="results-heading">
              {filteredCars.length} {filteredCars.length === 1 ? "car" : "cars"} found
            </h2>
            <p>Explore fictional vehicles from local Addis owners.</p>
          </div>
          <label className="sort-control" htmlFor="sort-cars">
            <span>Sort by</span>
            <select
              className="form-control"
              id="sort-cars"
              onChange={(event) => submitSort(event.target.value)}
              value={filters.sort}
            >
              <option value="popular">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="newest">Recently listed</option>
            </select>
          </label>
        </div>

        {pageCars.length > 0 ? (
          <div className="car-grid catalogue-car-grid">
            {pageCars.map((car) => <CarCard car={car} key={car.id} />)}
          </div>
        ) : (
          <div className="catalogue-empty">
            <span aria-hidden="true">⌖</span>
            <h3>No cars match these filters.</h3>
            <p>Try another neighbourhood, price range, or set of travel dates.</p>
            <Link className="button button-outline" href="/cars">Clear filters</Link>
          </div>
        )}

        {filteredCars.length > PAGE_SIZE && (
          <nav className="pagination" aria-label="Car catalogue pages">
            {page > 1 ? (
              <Link
                aria-label="Previous page"
                className="pagination-control"
                href={buildPageHref(filters, page - 1)}
              >
                ← Previous
              </Link>
            ) : <span className="pagination-control pagination-disabled">← Previous</span>}
            <span aria-current="page" className="pagination-current">
              Page {page} of {pageCount}
            </span>
            {page < pageCount ? (
              <Link
                aria-label="Next page"
                className="pagination-control"
                href={buildPageHref(filters, page + 1)}
              >
                Next →
              </Link>
            ) : <span className="pagination-control pagination-disabled">Next →</span>}
          </nav>
        )}
      </section>
    </div>
  );
}
