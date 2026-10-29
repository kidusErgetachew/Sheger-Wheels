# Rendering Strategy & Architecture (STRATEGY.md)

## Overview
Sheggar Wheels is built on the **Next.js App Router** (Next.js 16.4 with React 19), combining static pre-rendering, Partial Pre-rendering (PPR), and client-side reactive rendering to deliver fast initial loads and a responsive marketplace experience.

---

## Route Rendering Breakdown

| Route | Strategy | Rendering Description |
|---|---|---|
| `/` | **Static (SSG)** | Pre-rendered at build time as static HTML. Renders hero showcase, Addis Ababa brand story, trust strip, and featured vehicle cards from seed catalog. |
| `/cars` | **Partial Prerender (PPR)** | Static page layout shell pre-rendered with dynamic server streaming for URL search parameters (`?type=`, `?seats=`, `?price=`, `?neighbourhood=`, `?pickup=`, `?return=`). |
| `/cars/[id]` | **Static + PPR** | Core public vehicles statically pre-rendered at build time via `generateStaticParams()`. Dynamically rendered for newly created owner listings in browser storage. |
| `/signin` | **Static Shell + Client View** | Static page shell with metadata via `signin/layout.tsx`. Interactive profile selector and registration form hydrated on client. |
| `/checkout` | **Static Shell + Client View** | Static shell with `noindex` robots metadata. Client checkout flow validates session, quote snapshot, and dates from `sessionStorage` and `localStorage`. |
| `/booking` | **Static Shell + Client View** | Static shell with `noindex` robots metadata. Dynamic booking lookup and cancellation controls hydrated on the client. |
| `/booking-confirmation` | **Static Shell + Client View** | Static shell. Renders mock TeleBirr transaction receipt and details for completed bookings. |
| `/renter`, `/renter/bookings` | **Static Shell + Client View** | Static shell with `noindex` robots metadata. Renter dashboard reads active session and filtered renter bookings from browser storage. |
| `/owner/*` (6 subroutes) | **Static Shell + Client View** | Static shell with `noindex` robots metadata. Fleet manager, listing creation/editing, booking request approval, and earnings views. |
| `/admin/*` (7 subroutes) | **Static Shell + Client View** | Static shell with `noindex` robots metadata. Listing moderation, user management, disputes, announcements, and platform metrics. |
| `/robots.txt` | **Static Route** | Statically generated crawler directives allowing public discovery of `/` and `/cars` while disallowing transactional and dashboard paths. |
| `/sitemap.xml` | **Dynamic Route (`ƒ`)** | Generated server-side with current site origin, listing `/`, `/cars`, and all active vehicle URLs with change frequencies. |

---

## Static Pre-rendering & Partial Prerendering (PPR)

### 1. Static Generation with `generateStaticParams`
In `src/app/cars/[id]/page.tsx`, `generateStaticParams()` pre-computes paths for all approved seed vehicles:
```ts
export function generateStaticParams() {
  return getPublicCars(DEMO_DATA).map((car) => ({ id: car.id }));
}
```
This ensures zero runtime server latency when visitors click from search results or external links to view seeded vehicles.

### 2. Search Parameter Streaming in `/cars`
The catalogue page leverages React 19 async `searchParams`:
```tsx
type CataloguePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function CatalogueResults({ searchParams }: CataloguePageProps) {
  const params = await searchParams;
  const initialFilters = filtersFromSearchParams(params);
  // ...
}
```
The surrounding layout streams the header, intro text, and filter sidebar while dynamic results resolve.

---

## Client-Side Reactive State Synchronization

For interactive workspaces (owner fleet management, admin moderation, and checkout), data resides in client storage (`localStorage` and `sessionStorage`). To prevent layout shifts or hydration mismatches, the application uses **`useSyncExternalStore`**:
- Subscribes to custom window events (`sw:demo-data-change`) and browser `storage` events.
- Provides consistent synchronous snapshots between browser tabs.
- Prevents React 19 hydration mismatches by returning default seed data during server pre-rendering.
