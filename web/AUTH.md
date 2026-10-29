# Demo Authentication & Authorization Architecture (AUTH.md)

## Overview
Sheggar Wheels implements a lightweight, passwordless demo authentication system tailored for showcasing renter, owner, and administrator workflows. It uses browser-isolated storage (`sessionStorage` for active session, `localStorage` for registered user profiles).

---

## Demo Accounts & Capabilities

| Profile | Demo Email | Assigned Roles | Status | Primary Workspaces |
|---|---|---|---|---|
| **Kidus Ergetachew** | `kidus@example.test` | `renter`, `owner` | Active | `/renter`, `/owner`, `/checkout`, `/cars` |
| **Saba Bekele** | `saba@example.test` | `renter`, `owner` | Active | `/renter`, `/owner`, `/checkout`, `/cars` |
| **Dawit Alemu** | `dawit@example.test` | `renter`, `owner` | Active | `/renter`, `/owner`, `/checkout`, `/cars` |
| **Sheggar Wheels Admin** | `admin@example.test` | `admin` | Active | `/admin` (all moderation & platform tools) |
| **Mikiros Tesfaye** | `mikiros@example.test` | `owner` | Suspended | Blocked from signing in or initiating actions |

---

## Session Lifecycle

1. **Sign-In (`signInAsDemo`):**
   - User selects an existing profile or creates a new renter profile at `/signin`.
   - Checks that user status is `active`. If suspended, login is rejected with `"This demo account is suspended and cannot sign in."`
   - Writes `{ userId: user.id, startedAt: ISO_TIMESTAMP }` to `sessionStorage` under `sw_session_v1`.
   - Emits session change notification across active listeners in the tab.

2. **Session Verification (`getCurrentSession`):**
   - Validates that the session in `sessionStorage` has a valid structure and timestamp.
   - Cross-references the active `userId` against stored users in `localStorage`.
   - If the user account was suspended or deleted while logged in, the session is invalidated immediately.

3. **Sign-Out (`signOut`):**
   - Clears `sw_session_v1` from `sessionStorage`.
   - Clears active booking draft `sw_checkout_draft_v1`.
   - Dispatches session change events and redirects user to `/signin`.

---

## Required Misuse Scenarios & Defenses

### 1. Signed-Out Write Protection
- **Vulnerability:** Unauthenticated visitor triggers booking creation, vehicle creation, vehicle editing, or status transitions directly or via forged inputs.
- **Defense in Code:**
  - `createBookingUnderLock()` calls `requireCurrentRole("renter")`. Returns `{ ok: false, error: "Not signed in." }`.
  - `createDemoCar()` calls `requireCurrentRole("owner")`.
  - `updateDemoCar()` and `toggleDemoCarStatus()` check `getCurrentSession()` and require owner role.
  - `adminModerateCar()` calls `requireCurrentRole("admin")`.
  - Automated tests verify all 4 write operations fail if signed out.

### 2. Cross-User Ownership Violation & Cross-Owner Car Editing
- **Vulnerability:** Owner A (e.g. Saba) tampers with the URL `/owner/listings/edit?id=car-byd-song-plus` to edit a vehicle belonging to Owner B (Dawit).
- **Defense in Code:**
  - **UI Layer (`OwnerCarForm`):** Checks `existingCar.ownerId !== user.id`. Renders an explicit **`ACCESS DENIED`** security alert banner informing the user that modifying another owner's vehicle is prohibited.
  - **Data Layer (`updateDemoCar`):** Enforces strict ownership check before any mutation:
    ```ts
    if (existingCar.ownerId !== user.id) {
      return {
        ok: false,
        error: "Access Denied: You do not own this vehicle and cannot edit it.",
      };
    }
    ```
  - **Status Toggle (`toggleDemoCarStatus`):** Verifies `car.ownerId === user.id`.

### 3. Unsafe External Return URL (Open Redirect)
- **Vulnerability:** Attacker crafts phishing links such as `/signin?returnUrl=https://evil.com` or `//evil.com` or `javascript:alert(1)`.
- **Defense in Code (`safeReturnPath`):**
  - Requires the path to begin with `/` and forbids protocol-relative `//`.
  - Rejects backslashes (`\`) and control characters (`\u0000-\u001f`).
  - Parses through `new URL(value, "https://sheggar.local")` and asserts strict origin match. Any external origin falls back safely to `/`.
  - Tested extensively against `https://`, `http://`, `//`, `javascript:`, `data:`, and backslash bypasses.

### 4. Cross-Renter Booking Access
- **Vulnerability:** Renter A attempts to view details, cancel, or dispute a reservation created by Renter B at `/booking?bookingId=...`.
- **Defense in Code:**
  - In `src/components/booking-record.tsx`:
    ```ts
    const booking = user && bookingId
      ? bookings.find((item) => item.id === bookingId && item.renterId === user.id)
      : undefined;
    ```
    If the booking does not belong to the signed-in renter, it renders `"Booking not found: This booking is unavailable or does not belong to the signed-in renter."`
  - In `transitionDemoBooking`:
    ```ts
    if (requiredRole === "renter" && booking.renterId !== authorized.value.id) {
      return { ok: false, error: "You can only update bookings belonging to your account." };
    }
    ```

---

## Critical Limitation: Frontend Authorization is NOT Production Security

> [!WARNING]
> This application is a frontend portfolio demonstration. All authorization rules execute within the user's browser runtime. A client with DevTools can inspect or alter `sessionStorage` and `localStorage`, manipulate JavaScript state, or invoke internal functions. 
> 
> In a production environment, authorization must execute on an untamperable backend server with cryptographic session cookies, signed JWTs, and database row-level security (RLS).
