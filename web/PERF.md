# Performance Measurements & Optimization (PERF.md)

## Build & Compilation Performance

*Measurements recorded on Windows 11, Node.js v24.10.0, Next.js 16.4.3 (Turbopack compiler):*

| Phase | Metric Measured | Result |
|---|---|---|
| Next.js Configuration | `next.config.ts` execution time | **584 ms** |
| Optimized Turbopack Build | Production compilation | **15.5 s** |
| TypeScript Validation | Type check execution | **13.2 s** |
| Static Page Generation | 46 Static HTML Routes generated | **11.3 s** |
| Total Automated Unit Tests | 12 tests across 3 suites | **1.44 s** |
| Lint Execution | Full project ESLint 9 scan | **3.8 s** (0 errors, 0 warnings) |

---

## Route Inventory & Rendering Allocation

```
Route (app)                              Size / Type
┌ ○ /                                    Static HTML
├ ○ /_not-found                          Static HTML
├ ○ /admin                               Static HTML
├ ○ /admin/announcements                 Static HTML
├ ○ /admin/bookings                      Static HTML
├ ○ /admin/disputes                      Static HTML
├ ○ /admin/listings                      Static HTML
├ ○ /admin/profile                       Static HTML
├ ○ /admin/settings                      Static HTML
├ ○ /admin/users                         Static HTML
├ ○ /booking                             Static HTML
├ ○ /booking-confirmation                Static HTML
├ ◐ /cars                                Partial Prerender (PPR)
├   /cars/[id]                           Static + Partial Prerender
│ ├ ○ /cars/car-byd-qin-plus             Static HTML
│ ├ ○ /cars/car-byd-song-plus            Static HTML
│ └ ◐ [+14 more paths]                   Static HTML
├ ○ /checkout                            Static HTML
├ ○ /owner                               Static HTML
├ ○ /owner/bookings                      Static HTML
├ ○ /owner/earnings                      Static HTML
├ ○ /owner/listings                      Static HTML
├ ○ /owner/listings/edit                 Static HTML
├ ○ /owner/listings/new                  Static HTML
├ ○ /owner/profile                       Static HTML
├ ○ /owner/settings                      Static HTML
├ ○ /renter                              Static HTML
├ ○ /renter/bookings                     Static HTML
├ ○ /robots.txt                          Static HTML
├ ○ /signin                              Static HTML
└ ƒ /sitemap.xml                         Dynamic XML
```

- **46 Static Pages Pre-Rendered:** Instant delivery from edge CDN caches with zero server compute required for initial request.
- **Dynamic Sitemap:** Generated on demand based on configured base URL (`NEXT_PUBLIC_SITE_URL`).

---

## Asset & Image Optimization

1. **Next.js `<Image>` Integration:**
   - Responsive `sizes` attributes configured (e.g. `sizes="(max-width: 680px) 100vw, 60vw"` on hero, `sizes="100px"` on thumbnails).
   - Priority loading flag (`priority`) enabled exclusively for Above-the-Fold images (hero photo, primary vehicle detail photo).
   - Lazy loading for below-the-fold catalog vehicles.
2. **Fallback System:**
   - Vector SVG fallback (`/cars/car-image-fallback.svg`) rendered if remote or custom image paths encounter 404 or network errors.
3. **No Heavy CSS Frameworks:**
   - Native Vanilla CSS with CSS custom properties (`globals.css`), eliminating megabytes of runtime CSS parsing.

---

## Client Runtime Performance

1. **Zero-Tearing External Store (`useSyncExternalStore`):**
   - Direct subscription to storage events avoids multiple re-render cascades and eliminates tearing when state updates in another browser tab.
2. **Non-Blocking Search Debouncing:**
   - Text search query filters use controlled component state while debouncing URL synchronization to avoid blocking keyboard input.
3. **Memoized Aggregations:**
   - Admin platform metrics, owner utilization calculations, and booking status counts are wrapped in `useMemo` so expensive array filters only recalculate on storage mutation.
