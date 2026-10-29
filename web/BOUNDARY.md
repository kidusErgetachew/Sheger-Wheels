# Server and Client Component Boundaries (BOUNDARY.md)

## Architectural Principle
Sheggar Wheels leverages the Next.js App Router component boundary model:
- **Server Components** are the default for structural layouts, public marketing copy, SEO metadata, open graph tags, sitemaps, and static prerendering.
- **Client Components** (`"use client"`) are introduced at the boundary where browser APIs, user interaction, reactive local storage, form state, and authentication checks are required.

---

## Component Boundary Classification

### 1. Server Components (Run on the Server / Build Phase)
- **`src/app/layout.tsx`**: Root HTML structure, Google font variables, global CSS link, base metadata, canonical alternates, Open Graph, and Twitter metadata.
- **`src/app/page.tsx`**: Home landing page, static hero copy, Addis Ababa coordinates display, trust strip, and how-it-works cards.
- **`src/app/cars/page.tsx`**: Public catalogue wrapper, reads server `searchParams` asynchronously and provides Suspense boundary fallback.
- **`src/app/cars/[id]/page.tsx`**: Vehicle details page. Implements `generateStaticParams()` and dynamic `generateMetadata({ params })`.
- **`src/app/robots.ts`**: Next.js MetadataRoute defining crawler directives.
- **`src/app/sitemap.ts`**: Next.js dynamic sitemap generator.
- **`src/app/owner/layout.tsx`**, **`src/app/admin/layout.tsx`**, **`src/app/renter/layout.tsx`**, **`src/app/signin/layout.tsx`**: Route group layouts injecting page title templates and `noindex, nofollow` robots metadata without shipping client runtime overhead.
- **`src/components/site-footer.tsx`**: Footer links and fictional copyright notice.

### 2. Client Components (`"use client"`)
- **`src/components/site-header.tsx`**: Top navigation banner with links, dynamic saved favorites counter, theme toggle, and session logout.
- **`src/components/theme-toggle.tsx`**: Client toggle switching between Light and Dark themes, syncing with `sw_theme_v1` and document attributes.
- **`src/components/favorite-button.tsx`**: Heart icon button allowing renters to bookmark vehicles into `localStorage`.
- **`src/components/favorites-view.tsx`**: Dedicated view for browsing and managing saved cars with empty state handling.
- **`src/components/car-catalogue.tsx`**: Manages interactive filtering, search bar input, price range sliders, pagination, and URL synchronization with `window.history`.
- **`src/components/booking-car-form.tsx`**: Date picker and quote calculator on vehicle detail page; initiates checkout redirection with selected dates.
- **`src/components/checkout-flow.tsx`**: Multi-step checkout, quote confirmation, mock TeleBirr wallet simulation, and Web Locks booking creation.
- **`src/components/booking-record.tsx`**: Interactive booking viewer, cancellation modal with confirmation safeguard, and receipt rendering.
- **`src/components/protected-demo.tsx`**: Client authentication barrier checking active role in `sessionStorage` and redirecting unauthorized visitors to `/signin`.
- **`src/components/demo-dashboard.tsx`**: Unified dashboard application with sidebar navigation, `useSyncExternalStore` storage subscription, and responsive sub-views.
- **`src/components/owner/owner-car-form.tsx`**: Vehicle listing creation and edit form with real-time validation and cross-owner access denial.
- **`src/components/owner/owner-listings-manager.tsx`**: Owner vehicle list, status toggle (`approved` ↔ `inactive`), and filter controls.
- **`src/components/owner/owner-requests-manager.tsx`**: Booking request approval/decline actions and dispute triggering.
- **`src/components/owner/owner-earnings-view.tsx`**: Financial analytics, CSV exports, and vehicle revenue breakdown.
- **`src/components/admin/admin-listing-moderation.tsx`**: Moderation queues for vehicle approvals and rejections.
- **`src/components/admin/admin-user-manager.tsx`**: Account status toggling (`active` ↔ `suspended`) and role auditing.
- **`src/components/admin/admin-booking-overview.tsx`**: Platform-wide booking ledger with filters and CSV export.
- **`src/components/admin/admin-dispute-manager.tsx`**: Dispute arbitration interface with status resolution.
- **`src/components/admin/admin-announcements-manager.tsx`**: Banner announcement creation and broadcast toggle.
- **`src/components/car-image.tsx`**: Image wrapper with error fallback state (`/cars/car-image-fallback.svg`).
- **`src/components/home-search.tsx`**: Home hero interactive filter form navigating to `/cars`.

---

## State Handoff & Props Serialization

- **Server to Client:** Server components pass JSON-serializable primitives (e.g. `car`, `initialFilters`, `initialPage`) into client components.
- **Client Storage to Components:** Browser storage records (`DemoData`) are read via versioned helper functions and exposed to React via external store subscriptions (`useSyncExternalStore`), eliminating state tearing.
