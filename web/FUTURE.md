# Future Roadmap: Migration from Demo to Production (FUTURE.md)

## Overview
Sheggar Wheels is currently an advanced frontend-only marketplace demonstration. This document outlines the technical specification and architecture required to elevate the application to an enterprise-grade production car-rental marketplace in Addis Ababa, Ethiopia.

---

## 1. Production Backend & Database Architecture

- **Database Engine:** PostgreSQL (hosted on Supabase, Neon, or AWS RDS) for ACID compliance and transactional reliability during concurrent reservations.
- **ORM / Query Layer:** Prisma ORM or Drizzle ORM with migration management.
- **Relational Schema:**
  - `users`: Primary key `id` (UUID), `email` (unique), `password_hash` (bcrypt/Argon2id), `phone_e164`, `is_verified_driver`, `roles` (enum array), `status`.
  - `vehicles`: `id`, `owner_id` (foreign key), `make`, `model`, `year`, `vin` (unique), `license_plate` (unique), `vehicle_type`, `transmission`, `seats`, `neighbourhood`, `lat_long` (PostGIS `geography(Point, 4326)` for spatial geo-queries), `price_per_day_etb`, `status` (`pending_review`, `active`, `suspended`).
  - `bookings`: `id`, `car_id`, `renter_id`, `owner_id`, `start_date`, `end_date`, `subtotal_etb`, `fee_etb`, `total_etb`, `status`, `telebirr_order_id`, `created_at`.
  - `vehicle_unavailability`: Foreign key to vehicle with date exclusion ranges.
  - `disputes`: Arbitration records with uploaded evidence file links.

---

## 2. Authentication & Server-Side Authorization

- **Auth Framework:** NextAuth.js (Auth.js v5) or Supabase Auth.
- **Security Primitives:**
  - Secure HTTP-only, SameSite=Strict cookies containing cryptographically signed session tokens.
  - Multi-Factor Authentication (MFA) via SMS OTP tailored for Ethiopian mobile networks (Ethio Telecom / Safaricom Ethiopia).
  - Driver License verification pipeline: OCR extraction and national ID matching.
  - Server-side middleware guarding `/owner/*`, `/admin/*`, and `/renter/*` routes before rendering or invoking database actions.

---

## 3. Real Payment Gateway Integration (Ethiopian Financial Rails)

- **TeleBirr SuperApp API:**
  - Official TeleBirr H5 / QR integration for mobile web and native wallet checkouts.
  - HMAC-SHA256 signature verification on backend webhook endpoints (`/api/webhooks/telebirr`).
  - Idempotent transaction processing to prevent double charges.
  - Automated escrow hold: funds captured on booking confirmation and disbursed to the owner upon successful return inspection.
- **Multi-Gateway Support:**
  - Chapa API (supporting CBE Birr, Awash Birr, TeleBirr, Dashen Bank, and international Visa/Mastercard).

---

## 4. Vehicle Photos & Document Cloud Storage

- **Object Storage:** AWS S3 or Cloudflare R2 bucket with private access permissions.
- **Presigned Upload URLs:** Direct client-to-bucket uploads with pre-signed URLs, keeping large image payloads off the Next.js API server.
- **Automated Image Processing:** Cloudflare Images or sharp microservice generating WebP/AVIF responsive variants and watermarking rental proof photos.

---

## 5. Live Telematics & Geo-Fencing

- **IoT Vehicle Tracking:** Integration with GPS telematics devices (e.g. Teltonika / Concox OBD-II dongles).
- **Geofencing:** Automated boundary alerts if vehicles leave designated zones (e.g. Addis Ababa ring road limits, Bishoftu, or regional borders).
- **Distance & Speed Logging:** Real-time odometer readings to support per-kilometer overage pricing.

---

## 6. Audit Logging & Rate Limiting

- **Rate Limiting:** Upstash Redis with `@upstash/ratelimit` protecting checkout, auth, and search endpoints against automated scraping or DDoS.
- **Audit Logs:** Immutable audit log table recording every administrative action, listing moderation, and dispute settlement.
