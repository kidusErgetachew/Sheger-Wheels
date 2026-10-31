# Sheggar Wheels | Drive Addis

Sheggar Wheels is a peer-to-peer car rental marketplace web application built for Addis Ababa, Ethiopia. It enables local car owners to list and manage their vehicles while allowing renters to browse available cars by sub-city, filter by transmission and price, calculate snapshotted rental quotes, and complete a simulated TeleBirr checkout.

All people, vehicle listings, prices, and booking records in the default build are fictional demo data.

---

## Technical Stack & Architecture

- **Framework:** Next.js 16.4.3 (App Router with Turbopack, Partial Prerendering, and React 19)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Custom Vanilla CSS Design System with responsive tokens, Ethiopian warm-palette aesthetics, and instant Light / Dark mode support
- **Storage & State:** Versioned `localStorage` collections + tab-isolated `sessionStorage` session with `useSyncExternalStore` and Web Locks API
- **Testing:** Node.js native test runner (`node --test`) with custom TypeScript ESM resolution
- **Linting:** ESLint 9 with Next.js and TypeScript rules

---

## Architectural Documentation

For deep technical insights, review the companion documentation:
- [STRATEGY.md](./STRATEGY.md) – Rendering strategies (SSG, PPR, dynamic routes) per URL.
- [BOUNDARY.md](./BOUNDARY.md) – Server Component vs. Client Component boundaries and serialization.
- [AUTH.md](./AUTH.md) – Demo authentication, role-based access control, and misuse scenario defenses.
- [DATA.md](./DATA.md) – Storage schemas, versioned keys, resilience, and recovery mechanisms.
- [PERF.md](./PERF.md) – Real recorded performance measurements, build logs, and bundle sizes.
- [FUTURE.md](./FUTURE.md) – Migration blueprint to production backend, PostgreSQL, and TeleBirr API.

---

## Quick Start & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Run Automated Tests
```bash
npm run test
```
Executes 19 unit and integration tests across 6 dedicated test suites covering:
- **Security Misuse Defense (4 tests):** Unsafe external return URL redirection, signed-out mutation blockage, cross-user ownership violation, and cross-renter booking protection.
- **Storage Resilience & Transitions (6 tests):** Malformed JSON recovery, malformed schema shape recovery, session storage sign-in/sign-out, booking date overlap detection, 5% fee quote calculation, and role-governed lifecycle transitions.
- **Notifications & Reviews (2 tests):** Real-time in-app notification center, read status toggling, and review submission with duplicate prevention and booking state checks.
- **Theme System (3 tests):** System preference detection, explicit Light/Dark toggling, local storage persistence (`sw_theme_v1`), and resilience to corrupted storage values.
- **Favorites System (2 tests):** Real-time bookmarking, storage synchronization, and recovery against invalid favorites data.
- **Car Validation & Registration (2 tests):** Vehicle pricing/seat/year boundary checks, duplicate registration detection, and renter role enforcement.

### 4. Run Linter
```bash
npm run lint
```

### 5. Create Production Build
```bash
npm run build
```
Generates 46 static pages and validates Next.js route bundling.

---

## Demo Profiles

Use any of these pre-seeded accounts at `/signin` (no password required):

| Demo Profile | Email Address | Assigned Roles | Primary Workspaces |
|---|---|---|---|
| **Kidus Ergetachew** | `kidus@example.test` | Renter & Owner | `/renter`, `/owner`, `/cars`, `/checkout` |
| **Saba Bekele** | `saba@example.test` | Renter & Owner | `/renter`, `/owner`, `/cars`, `/checkout` |
| **Dawit Alemu** | `dawit@example.test` | Renter & Owner | `/renter`, `/owner`, `/cars`, `/checkout` |
| **Sheggar Wheels Admin** | `admin@example.test` | Demo Administrator | `/admin` (Moderation, Users, Disputes, Announcements) |
| **Mikiros Tesfaye** | `mikiros@example.test` | Owner (Suspended) | Blocked from login to test suspension handling |

Visitors can also self-register a new renter account with custom name and email on the `/signin` screen.

---

## Testing User Journeys

### 1. Primary Renter Journey
1. Navigate to `/cars` or use the home search bar at `/` to filter by neighbourhood (e.g. Bole, Piazza, CMC).
2. Select a vehicle (e.g., *BYD Song Plus* or *Toyota RAV4*).
3. On the `/cars/[id]` detail page, pick start and end dates. Notice real-time quote calculation with the 5% service fee.
4. Click **Continue to booking**.
5. If signed out, you will be redirected to `/signin?returnUrl=...`. Select **Kidus Ergetachew** to proceed.
6. On `/checkout`, review the snapshotted quote and click **Pay with TeleBirr (Mock Demo)**.
7. Confirm the simulated transaction. You will be redirected to `/booking-confirmation` with your TeleBirr mock reference.
8. Visit `/renter/bookings` or `/booking?bookingId=...` to review the reservation or test cancellation.

### 2. Primary Owner Journey
1. Sign in as **Saba Bekele** or **Dawit Alemu**.
2. Go to `/owner` to see fleet metrics, active bookings, and fleet utilization rate.
3. Go to `/owner/listings/new` to list a new vehicle (test form validation for prices, year 2000–2027, and photos). Newly created cars enter `pending` status.
4. Go to `/owner/listings` to toggle vehicle status between *Available* and *Inactive*.
5. Go to `/owner/bookings` to approve or decline incoming customer requests.
6. Go to `/owner/earnings` to view gross revenue and click **Export CSV** to download a ledger file.

### 3. Primary Administrator Journey
1. Sign in as **Sheggar Wheels Admin** (`admin@example.test`).
2. Go to `/admin` to review the Platform Control Center, aggregate rental volume, and active user metrics.
3. Go to `/admin/listings` to inspect pending owner cars and click **Approve Listing** or **Reject Listing**.
4. Go to `/admin/users` to audit accounts or suspend/reinstate an owner.
5. Go to `/admin/disputes` to mediate and resolve customer claim tickets.
6. Go to `/admin/announcements` to broadcast or toggle site-wide notices.

---

## Maps, Location Verification & Trip Tracking Simulation

- **Interactive Leaflet Map (`/cars/[id]`):**
  - Integrated via client-only dynamic loading (`next/dynamic` with `ssr: false`) to prevent server-side window evaluation errors.
  - Renders OpenStreetMap raster tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) with custom pin markers centered on Addis Ababa neighbourhoods (Bole, Piazza, Kazanchis, Sarbet, CMC, Bole Atlas).
  - Non-GPS Disclosure: Explicitly labeled as approximate seeded sample coordinates so users know real-time GPS tracking is not simulated.
  - Accessible Non-Map Fallback: Provides a structured textual neighbourhood guide with pickup instructions for accessibility and offline resilience.

- **Simulated Trip Tracking (`/bookings/[id]/track`):**
  - Live demonstration of active trip progression through 7 Addis Ababa checkpoints: Bole Airport &rarr; Medhanialem &rarr; Atlas &rarr; Meskel Square &rarr; Stadium &rarr; Arat Kilo &rarr; Piazza.
  - Interactive journey controls: Start/Pause playback, 1x/2x/4x speed acceleration, and reset.
  - Telemetry HUD: Real-time calculation of completed distance percentage, simulated speed (km/h), and dynamic estimated arrival time (ETA).

---

## TeleBirr Checkout, In-App Notifications & Review System

- **Simulated TeleBirr Checkout Flow:**
  - Authentic Ethio Telecom TeleBirr-branded checkout modal featuring test phone input, masked 4-digit PIN field, and "Complete demo payment" action.
  - Generates verifiable synthetic transaction references (format: `TB-DEMO-TIMESTAMP-SUFFIX`).
  - Post-payment "Payment Succeeded!" screen with an explicit primary **"&larr; Back to home page"** return button (`href="/"`), plus links to the reservation receipt, trip tracking, and renter bookings.
  - Zero financial credentials collected or transmitted; completely safe simulation.

- **In-App Notification Center & Floating Toasts:**
  - Notification bell with real-time unread badge counter in header and dashboard topbars.
  - Dropdown drawer supporting individual item read toggling, "Mark all as read", and "Clear all notifications".
  - Floating toast alerts trigger automatically on storage events (booking confirmation, cancellations, listings approval, and dispute updates).

- **Reviews & Owner Feedback Loop:**
  - Dedicated review route (`/bookings/[id]/review`) accessible only to renters with completed rentals.
  - 1-to-5 star rating selector, minimum comment length validation, and strict single-review-per-booking enforcement.
  - Owner Reviews space (`/owner/reviews`) where vehicle owners can view customer ratings and publish official replies.

---

## Route & Feature Directory

| Route | Access Level | Description & Available Actions |
|---|---|---|
| `/` | Public | Hero landing page, instant search bar, featured vehicles, and how-it-works overview |
| `/cars` | Public | Vehicle catalogue with neighbourhood filters, price range, transmission, and pagination |
| `/cars/[id]` | Public | Car details, specifications, real-time quote calculator, and Leaflet interactive map |
| `/signin` | Public | Role-aware demo account selector, new renter registration, and return URL handling |
| `/signup` | Public | Alias routing to `/signin` with focused registration form |
| `/logout` / `/signout` | Public | Safe session termination page with automated redirection to landing page (`/`) |
| `/dashboard` | Renter | Renter workspace overview with trip status cards, spending analytics, and quick links |
| `/bookings` | Renter | Alias to renter booking history with status filters |
| `/bookings/[id]` | Renter / Admin | Detailed reservation invoice, payment details, and cancellation actions |
| `/bookings/[id]/track` | Booking Owner | Real-time animated trip tracking simulation with Addis Ababa route checkpoints |
| `/bookings/[id]/review` | Completed Renter | Star rating submission (1-5 stars) with comment validation |
| `/checkout` | Signed-In Renter | Snapshotted quote verification and TeleBirr modal payment simulation |
| `/owner` | Owner | Fleet overview, active reservations, fleet utilization rate, and incoming requests |
| `/owner/cars` | Owner | Vehicle roster management with status toggling (Available / Inactive) |
| `/owner/cars/new` | Owner | New vehicle submission form with photo upload and validation |
| `/owner/cars/[id]/edit` | Car Owner | Listing editor with strict cross-owner modification protection |
| `/owner/earnings` | Owner | Monthly earnings summary, vehicle utilization breakdown, and CSV ledger export |
| `/owner/reviews` | Owner | Reputation management: view renter reviews and post official owner responses |
| `/owner/disputes` | Owner | Review open dispute tickets associated with owner's vehicles |
| `/admin` | Admin | Platform control center with volume stats, fee calculations, and fleet health |
| `/admin/listings` | Admin | Listing approval moderation queue (Approve / Reject listings) |
| `/admin/users` | Admin | User accounts directory with suspension and reinstatement controls |
| `/admin/users/[id]` | Admin | Inspector for individual demo users with linked vehicles and booking history |
| `/admin/bookings` | Admin | Platform-wide master reservations ledger |
| `/admin/disputes` | Admin | Central dispute resolution desk |
| `/admin/disputes/[id]` | Admin | Dispute case review with binding arbitration resolution notes form |
| `/admin/reports` | Admin | Platform analytics with CSV exports (Bookings, Fleet Roster, Users Directory) |
| `/admin/announcements` | Admin | Broadcast banner management with active status toggling |

---

## Security & Misuse Scenario Verification

1. **Signed-Out Write:** Direct attempts to mutate listings or bookings while unauthenticated return `{ ok: false, error: "Not signed in." }`.
2. **Cross-User Ownership Violation:** If an owner modifies the URL `/owner/listings/edit?id=...` to another owner's car, both the UI component and the backend action return an **`ACCESS DENIED`** security violation.
3. **Unsafe External Return URL:** Input parameters such as `?returnUrl=https://evil.com` or `//evil.com` are sanitized by `safeReturnPath()`, strictly falling back to `/`.
4. **Cross-Renter Booking Access:** Entering a `bookingId` belonging to another user renders an authorization error without exposing private customer trip data.

---

## Deployment Instructions

### Prerequisites
- Node.js 18.18+ or 20+ (Node 24 recommended).
- Vercel, Netlify, or a VPS with Node.js.

### Deploying to Vercel (Recommended)
1. Push repository to GitHub or GitLab.
2. In Vercel, import the repository and select the `web` root directory.
3. Framework Preset: **Next.js**.
4. Environment Variables:
   - `NEXT_PUBLIC_SITE_URL`: Your production domain (e.g. `https://sheggar-wheels.vercel.app`).
   - `NODE_ENV`: `production`.
5. Deploy. The project automatically runs `next build`, generating static pages, PPR streams, and the dynamic `/sitemap.xml`.

---

## Demo Limitations & Disclaimers

- **Browser Storage:** Stored in `localStorage` (~5MB limit). Resetting browser cache wipes customized demo data.
- **Demo Authentication:** Passwordless for ease of evaluation. Frontend checks simulate access control and must be replaced with server-side authentication for production.
- **Simulated Payment:** TeleBirr checkout does not contact Ethio Telecom or charge money.
- **Vehicle Tracking:** Pickup coordinates and vehicle photos are illustrative demonstrations.
