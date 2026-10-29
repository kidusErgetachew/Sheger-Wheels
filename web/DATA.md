# Data Architecture & Storage Management (DATA.md)

## Storage Architecture Overview
Sheggar Wheels manages marketplace state across two browser storage scopes:
1. **`localStorage` (Persistent Domain Records):** Houses versioned marketplace collections (users, cars, bookings, reviews, disputes, announcements).
2. **`sessionStorage` (Active Tab Session):** Houses the active authentication session and transient booking checkout draft.

---

## Storage Keys & Versioning

| Collection | Versioned Key | Fallback Source | Description |
|---|---|---|---|
| Users | `sw_users_v1` | `DEMO_DATA.users` | Registered demo profiles, roles, and status |
| Vehicles | `sw_cars_v2` | `DEMO_DATA.cars` | Fleet catalog, specs, pricing, and unavailable dates |
| Bookings | `sw_bookings_v1` | `DEMO_DATA.bookings` | Reservations, quotes, dates, and mock payment references |
| Reviews | `sw_reviews_v1` | `DEMO_DATA.reviews` | Customer ratings, reviews, and owner replies |
| Disputes | `sw_disputes_v1` | `DEMO_DATA.disputes` | Customer and owner arbitration tickets |
| Announcements | `sw_announcements_v1` | `DEMO_DATA.announcements` | Platform broadcast notices |
| Active Session | `sw_session_v1` | `null` | Current tab logged-in user ID and timestamp |
| Checkout Draft | `sw_checkout_draft_v1` | `null` | Picked vehicle and dates during booking flow |
| Saved Favorites | `sw_favorites_v1` | `[]` | Saved vehicle IDs with cross-component reactivity |
| Theme Preference | `sw_theme_v1` | `"system"` | Visual appearance mode (`light`, `dark`, `system`) |

### Schema Migration
The system includes migration logic from `sw_cars_v1` to `sw_cars_v2`. If `sw_cars_v1` exists, existing cars are preserved while seamlessly merging any newly added seed listings.

---

## Resilience & Corrupt Data Recovery

1. **Malformed JSON Recovery:**
   If a user's browser storage contains malformed or unparseable JSON (due to storage interruption, browser corruption, or manual DevTools tampering), `readStorage()` catches the error, sets `recovered: true`, and falls back safely to the pre-seeded catalog without throwing an uncaught exception or blanking the page.

2. **Schema Shape Validation (`isValidCollection`):**
   Before returning a collection from storage, `isValidCollection()` performs structural type-checking:
   - Verifies array structure.
   - Asserts non-empty string IDs.
   - Enforces valid enum states for `UserRole` (`renter`, `owner`, `admin`), `CarStatus` (`pending`, `approved`, `rejected`, `inactive`), and `BookingStatus`.
   - Validates finite numerical prices and ratings between 1 and 5.
   - If stored data is damaged or corrupted, the system automatically restores seed data and notifies listeners.

---

## Concurrency & Cross-Tab Synchronization

- **Web Locks API (`navigator.locks`):**
  To prevent race conditions and double-booking conflicts when a user has multiple tabs open, booking creation and status transitions acquire an exclusive named lock (`sheggar-wheels-booking-write-v1`).
- **Reactive Custom Events:**
  Every write to `localStorage` dispatches a custom window event `sw:demo-data-change`, as well as listening to standard cross-tab `storage` events. All open tabs update reactively without requiring manual page reloads.

---

## Booking Conflict Detection

In `src/lib/demo/booking-actions.ts`:
```ts
export function hasBookingConflict(
  bookings: DemoBooking[],
  quote: BookingQuote,
): boolean {
  return bookings.some(
    (booking) =>
      booking.carId === quote.carId &&
      ["requested", "confirmed", "in_progress", "disputed"].includes(booking.status) &&
      dateRangesOverlap(
        booking.startDate,
        booking.endDate,
        quote.startDate,
        quote.endDate,
      ),
  );
}
```
Dates are compared using ISO 8601 strings (`YYYY-MM-DD`). Overlapping intervals are rejected at both quote generation and lock-acquisition time.

---

## Data Export Capabilities

The application includes client-side CSV export generators:
- **`exportOwnerBookingsToCsv()`**: Exports filtered reservation ledgers for vehicle owners.
- **`exportAdminBookingsToCsv()`**: Exports platform-wide booking audit logs for administrators.
- Uses standard RFC 4180 CSV formatting with escaped fields and browser-initiated file downloads.

---

## Theme Persistence & Anti-Flicker Architecture

- **Key:** `sw_theme_v1`
- **Allowed States:** `"light" | "dark" | "system"` (falls back to `"system"` on missing or corrupted data).
- **Anti-Flicker Head Script:** Evaluated synchronously in `<head>` before page rendering to apply `data-theme` and `style.colorScheme` without flash of unstyled theme (FOUC).
- **Reactivity:** Uses `useSyncExternalStore` in `useTheme()` hook listening to `sw:theme-change`, cross-tab `storage` events, and `prefers-color-scheme` OS media query changes.

---

## Critical Storage Limitations

1. **Browser Storage Quota:** Browser `localStorage` is typically restricted to 5MB–10MB per origin.
2. **Device Isolation:** Data created on one device or browser profile is not synced to another device.
3. **Data Volatility:** Clearing browsing data or using incognito/private mode will wipe non-default listings and bookings.
4. **No Server Persistence:** All records are stored client-side; no backend database is connected.
