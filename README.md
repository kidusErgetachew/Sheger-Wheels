# Sheggar Wheels | Drive Addis 🇪🇹

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-19%20Passing-brightgreen?logo=node.js)](./web/tests)
[![Theme](https://img.shields.io/badge/Theme-Light%20%2F%20Dark-orange)](#light--dark-theme-system)

Sheggar Wheels is a peer-to-peer car rental marketplace web application designed specifically for Addis Ababa, Ethiopia. It connects local vehicle owners with renters across major sub-cities (Bole, Kazanchis, Piazza, CMC, Sarbet), providing real-time pricing quotes, mock TeleBirr checkout, interactive Leaflet neighbourhood maps, simulated live trip tracking, and comprehensive owner/admin management portals.

The full Next.js application codebase is located in the [`web/`](./web) directory.

---

## 🌟 Key Platform Features

- **Role-Aware Dashboards & Workspaces:**
  - **Visitor / Renter:** Catalogue exploration, filters (neighbourhood, transmission, seats, price), 5% platform fee calculation, simulated TeleBirr checkout, trip tracking, and rental reviews.
  - **Vehicle Owner:** Fleet status controls (Available / Inactive), new car submission form with validation, incoming request approval/declination, earnings breakdown, and renter review replies.
  - **Platform Administrator:** Control Center metrics, listing moderation queue, user account suspension/reinstatement, dispute mediation with arbitration notes, announcements broadcaster, and CSV report exports.

- **Interactive Maps & Non-Map Fallbacks:**
  - Client-only Leaflet map with OpenStreetMap tiles (`next/dynamic` guarded) showing approximate vehicle pickup locations across Addis Ababa.
  - Structured non-map accordion fallback providing accessible neighbourhood directions.

- **Simulated Route Tracking (`/bookings/[id]/track`):**
  - Animated vehicle marker traversing 7 landmark checkpoints: Bole International Airport &rarr; Medhanialem &rarr; Atlas &rarr; Meskel Square &rarr; Stadium &rarr; Arat Kilo &rarr; Piazza.
  - Interactive playback HUD with Play/Pause, 1x/2x/4x speed controls, progress bar, and dynamic ETA estimation.

- **TeleBirr Payment Simulation & Success Flow:**
  - Mock Ethio Telecom TeleBirr payment modal with masked credentials input and deterministic reference generation (`TB-DEMO-...`).
  - Dedicated "Payment Succeeded!" screen with primary return button (`&larr; Back to home page`), reservation receipt, and tracking links.

- **In-App Notification Center & Toasts:**
  - Real-time unread badge counter in header navigation and workspace topbars.
  - Interactive notification panel plus floating toast alerts triggered on booking state changes.

- **Light & Dark Theme Engine:**
  - Instant theme switching persisted via `sw_theme_v1` in `localStorage` with automatic system preference fallback.
  - Anti-flicker inline `<head>` script preventing theme flash on initial load.

- **Automated CSV Ledger Exports:**
  - Clean CSV generation with RFC-compliant cell escaping for Bookings, Fleet Rosters, and Users directories.

---

## 📂 Repository Structure

```text
sheger wheels/
├── web/                             # Next.js 16.4 Application Directory
│   ├── src/
│   │   ├── app/                     # Next.js App Router Pages & Layouts
│   │   │   ├── (auth)/              # Sign-in, sign-up, and session logout
│   │   │   ├── admin/               # Admin Control Center, Moderation, Disputes, Reports
│   │   │   ├── bookings/            # Booking receipts, reviews, and route tracking
│   │   │   ├── cars/                # Catalogue search, filters, and vehicle detail
│   │   │   ├── checkout/            # TeleBirr checkout simulation
│   │   │   ├── owner/               # Owner Fleet, requests, earnings, and reviews
│   │   │   └── renter/              # Renter workspace and booking history
│   │   ├── components/              # UI components, Leaflet maps, HUDs, charts, themes
│   │   └── lib/demo/                # Domain rules, storage layer, Web Locks, CSV exports
│   ├── tests/                       # Automated Node.js test runner suites
│   ├── public/                      # Static assets and vehicle imagery
│   └── package.json                 # Project dependencies and test scripts
├── README.md                        # Root Project Overview (this file)
└── ui/                              # UI showcase screenshots and design assets
```

---

## 📖 Companion Architecture Documentation

Comprehensive technical specifications and implementation decisions:
- [Application Guide (README.md)](./web/README.md) – Detailed user journeys, feature specifications, and troubleshooting.
- [Rendering Strategy (STRATEGY.md)](./web/STRATEGY.md) – SSG, PPR, dynamic route evaluation, and hydration design.
- [Component Boundaries (BOUNDARY.md)](./web/BOUNDARY.md) – Server Component vs. Client Component separation.
- [Security & Authentication (AUTH.md)](./web/AUTH.md) – Demo authentication, role guards, and misuse defense scenarios.
- [Data Layer Architecture (DATA.md)](./web/DATA.md) – Storage schemas, recovery from malformed JSON, and Web Locks concurrency.
- [Performance & Audits (PERF.md)](./web/PERF.md) – Real Lighthouse metrics, bundle size distribution, and Core Web Vitals.
- [Production Roadmap (FUTURE.md)](./web/FUTURE.md) – Backend migration plan, PostgreSQL schema, and real TeleBirr API integration.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18.18+ or v20+ (Node.js 22/24 recommended)
- **Package Manager:** npm (v10+)

### 2. Installation & Setup
```bash
# Navigate to the web application directory
cd web

# Install dependencies (Next.js, React 19, Leaflet, Lucide)
npm install
```

### 3. Run Automated Tests
```bash
npm run test
```
Executes all 19 unit and integration tests across storage resilience, theme persistence, favorites, booking validation, and security misuse defenses.

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 5. Production Build Verification
```bash
npm run build
```
Validates static page generation, TypeScript strict mode compliance, and bundle chunking.
