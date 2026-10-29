import { DEMO_DATA } from "./seed";
import type { DemoData } from "./types";

export const STORAGE_KEYS = {
  users: "sw_users_v1",
  cars: "sw_cars_v2",
  bookings: "sw_bookings_v1",
  reviews: "sw_reviews_v1",
  disputes: "sw_disputes_v1",
  announcements: "sw_announcements_v1",
} as const;

const LEGACY_CARS_STORAGE_KEY = "sw_cars_v1";

export const DEMO_DATA_CHANGE_EVENT = "sw:demo-data-change";

type DataKey = keyof typeof STORAGE_KEYS;

export type StorageRead<T> =
  | { ok: true; value: T; recovered: boolean }
  | { ok: false; error: string };

export type StorageArea = "local" | "session";

function getBrowserStorage(area: StorageArea): StorageRead<Storage> {
  if (!isBrowser()) {
    return { ok: false, error: "Demo storage is only available in the browser." };
  }

  try {
    return {
      ok: true,
      value: area === "local" ? window.localStorage : window.sessionStorage,
      recovered: false,
    };
  } catch {
    return {
      ok: false,
      error: `Your browser does not allow access to ${area} storage.`,
    };
  }
}

export function readStorage<T>(
  key: string,
  fallback: T,
  area: StorageArea = "local",
): StorageRead<T> {
  const browserStorage = getBrowserStorage(area);
  if (!browserStorage.ok) return browserStorage;

  let stored: string | null;
  try {
    stored = browserStorage.value.getItem(key);
  } catch {
    return {
      ok: false,
      error: `Your browser could not read ${area} storage.`,
    };
  }
  if (stored === null) return { ok: true, value: fallback, recovered: false };

  try {
    return {
      ok: true,
      value: JSON.parse(stored) as T,
      recovered: false,
    };
  } catch {
    return { ok: true, value: fallback, recovered: true };
  }
}

export function writeStorage<T>(
  key: string,
  value: T,
  area: StorageArea = "local",
): StorageRead<T> {
  const browserStorage = getBrowserStorage(area);
  if (!browserStorage.ok) return browserStorage;

  try {
    browserStorage.value.setItem(key, JSON.stringify(value));
    if (area === "local") {
      window.dispatchEvent(new Event(DEMO_DATA_CHANGE_EVENT));
    }
    return { ok: true, value, recovered: false };
  } catch {
    return {
      ok: false,
      error: `Your browser could not save ${area} storage. Check storage settings and try again.`,
    };
  }
}

export function removeStorage(
  key: string,
  area: StorageArea = "local",
): StorageRead<null> {
  const browserStorage = getBrowserStorage(area);
  if (!browserStorage.ok) return browserStorage;

  try {
    browserStorage.value.removeItem(key);
    if (area === "local") {
      window.dispatchEvent(new Event(DEMO_DATA_CHANGE_EVENT));
    }
    return { ok: true, value: null, recovered: false };
  } catch {
    return {
      ok: false,
      error: `Your browser could not remove data from ${area} storage.`,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isValidCollection(key: DataKey, value: unknown): boolean {
  if (!Array.isArray(value)) return false;

  switch (key) {
    case "users":
      return value.every(
        (item) =>
          isRecord(item) &&
          isString(item.id) &&
          isString(item.name) &&
          isString(item.email) &&
          Array.isArray(item.roles) &&
          item.roles.every((role) =>
            ["renter", "owner", "admin"].includes(String(role)),
          ) &&
          (item.status === "active" || item.status === "suspended"),
      );
    case "cars":
      return value.every(
        (item) =>
          isRecord(item) &&
          isString(item.id) &&
          isString(item.ownerId) &&
          isString(item.make) &&
          isString(item.model) &&
          typeof item.pricePerDay === "number" &&
          Number.isFinite(item.pricePerDay) &&
          Array.isArray(item.photos) &&
          Array.isArray(item.unavailableDates) &&
          ["draft", "pending", "approved", "rejected", "inactive"].includes(
            String(item.status),
          ),
      );
    case "bookings":
      return value.every(
        (item) =>
          isRecord(item) &&
          isString(item.id) &&
          isString(item.carId) &&
          isString(item.renterId) &&
          isString(item.ownerId) &&
          isString(item.startDate) &&
          isString(item.endDate) &&
          typeof item.total === "number" &&
          Number.isFinite(item.total) &&
          (item.transactionReference === undefined ||
            item.transactionReference === null ||
            typeof item.transactionReference === "string") &&
          [
            "requested",
            "confirmed",
            "in_progress",
            "completed",
            "reviewed",
            "declined",
            "cancelled",
            "disputed",
            "resolved",
          ].includes(String(item.status)),
      );
    case "reviews":
      return value.every(
        (item) =>
          isRecord(item) &&
          isString(item.id) &&
          isString(item.bookingId) &&
          typeof item.rating === "number" &&
          Number.isFinite(item.rating) &&
          item.rating >= 1 &&
          item.rating <= 5,
      );
    case "disputes":
      return value.every(
        (item) =>
          isRecord(item) &&
          isString(item.id) &&
          isString(item.bookingId) &&
          ["open", "resolved"].includes(String(item.status)),
      );
    case "announcements":
      return value.every(
        (item) =>
          isRecord(item) &&
          isString(item.id) &&
          isString(item.title) &&
          isString(item.message) &&
          typeof item.active === "boolean",
      );
  }
}

function setCollection<K extends DataKey>(
  target: DemoData,
  key: K,
  value: DemoData[K],
): void {
  target[key] = value;
}

function mergeSeedCars(existingCars: DemoData["cars"]): DemoData["cars"] {
  const seedIds = new Set(DEMO_DATA.cars.map((car) => car.id));
  return [
    ...DEMO_DATA.cars,
    ...existingCars.filter((car) => !seedIds.has(car.id)),
  ];
}

function syncCarsWithSeed(storedCars: DemoData["cars"]): {
  changed: boolean;
  cars: DemoData["cars"];
} {
  const storedCarIds = new Set(storedCars.map((car) => car.id));
  const addedSeedCars = DEMO_DATA.cars.filter(
    (car) => !storedCarIds.has(car.id),
  );
  const seedMap = new Map(DEMO_DATA.cars.map((car) => [car.id, car]));
  let photoUpdated = false;

  const merged = storedCars.map((car) => {
    const seed = seedMap.get(car.id);
    if (!seed) return car;
    const hasFallbackPhoto =
      car.photos.length === 0 ||
      car.photos.some((p) => p.includes("car-image-fallback.svg") || p.includes("fallback"));
    const hasOldSeedPhoto = car.photos.some(
      (p) =>
        p.includes("toyota-rav4.jpg") ||
        p.includes("hyundai-elantra.jpg") ||
        p.includes("mercedes-glc.jpg") ||
        p.includes("toyota-hilux.jpg"),
    );
    const seedHasValidPhoto =
      seed.photos.length > 0 &&
      !seed.photos.some((p) => p.includes("car-image-fallback.svg") || p.includes("fallback"));

    if ((hasFallbackPhoto || hasOldSeedPhoto) && seedHasValidPhoto) {
      photoUpdated = true;
      return { ...car, photos: seed.photos, year: seed.year };
    }
    return car;
  });

  const finalCars = addedSeedCars.length > 0 ? [...merged, ...addedSeedCars] : merged;
  return {
    changed: addedSeedCars.length > 0 || photoUpdated,
    cars: finalCars,
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readValue<T>(key: string, fallback: T): StorageRead<T> {
  return readStorage(key, fallback);
}

function writeValue<T>(key: string, value: T): StorageRead<T> {
  return writeStorage(key, value);
}

export function initializeDemoData(): StorageRead<DemoData> {
  if (!isBrowser()) {
    return { ok: false, error: "Demo data is only available in the browser." };
  }

  const values: DemoData = {
    users: [],
    cars: [],
    bookings: [],
    reviews: [],
    disputes: [],
    announcements: [],
  };
  let recovered = false;

  for (const key of Object.keys(STORAGE_KEYS) as DataKey[]) {
    const storageKey = STORAGE_KEYS[key];
    const fallback = DEMO_DATA[key];
    let stored: string | null;

    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      return {
        ok: false,
        error: "Your browser does not allow access to demo storage.",
      };
    }

    if (stored === null) {
      if (key === "cars") {
        let legacyCars: string | null;
        try {
          legacyCars = window.localStorage.getItem(LEGACY_CARS_STORAGE_KEY);
        } catch {
          return {
            ok: false,
            error: "Your browser does not allow access to demo storage.",
          };
        }

        if (legacyCars !== null) {
          try {
            const parsed: unknown = JSON.parse(legacyCars);
            if (!isValidCollection("cars", parsed)) {
              throw new Error("Stored cars data has an invalid shape.");
            }
            const migratedCars = mergeSeedCars(parsed as DemoData["cars"]);
            const saved = writeValue(storageKey, migratedCars);
            if (!saved.ok) return saved;
            setCollection(values, "cars", migratedCars);
            continue;
          } catch {
            const restored = writeValue(storageKey, DEMO_DATA.cars);
            if (!restored.ok) return restored;
            setCollection(values, "cars", DEMO_DATA.cars);
            recovered = true;
            continue;
          }
        }
      }

      const saved = writeValue(storageKey, fallback);
      if (!saved.ok) return saved;
      setCollection(values, key, fallback);
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(stored);
      if (!isValidCollection(key, parsed)) {
        throw new Error(`Stored ${key} data has an invalid shape.`);
      }
      let collection = parsed as DemoData[DataKey];
      if (key === "cars") {
        const storedCars = collection as DemoData["cars"];
        const synced = syncCarsWithSeed(storedCars);
        if (synced.changed) {
          collection = synced.cars;
          const saved = writeValue(storageKey, collection);
          if (!saved.ok) return saved;
        }
      }
      setCollection(values, key, collection);
    } catch {
      const restored = writeValue(storageKey, fallback);
      if (!restored.ok) return restored;
      setCollection(values, key, fallback);
      recovered = true;
    }
  }

  window.dispatchEvent(new Event(DEMO_DATA_CHANGE_EVENT));
  return { ok: true, value: values, recovered };
}

export function readDemoCollection<K extends DataKey>(
  key: K,
): StorageRead<DemoData[K]> {
  const result = readValue(STORAGE_KEYS[key], DEMO_DATA[key]);
  if (!result.ok) return result;
  if (!result.recovered && isValidCollection(key, result.value)) {
    if (key === "cars") {
      const storedCars = result.value as DemoData["cars"];
      const synced = syncCarsWithSeed(storedCars);
      if (synced.changed) {
        const saved = writeValue(STORAGE_KEYS.cars, synced.cars);
        if (!saved.ok) return saved;
        return { ok: true, value: synced.cars as DemoData[K], recovered: false };
      }
    }
    return result;
  }

  const restored = writeValue(STORAGE_KEYS[key], DEMO_DATA[key]);
  if (!restored.ok) return restored;
  return { ok: true, value: DEMO_DATA[key], recovered: true };
}

export function writeDemoCollection<K extends DataKey>(
  key: K,
  value: DemoData[K],
): StorageRead<DemoData[K]> {
  const result = writeValue(STORAGE_KEYS[key], value);
  if (result.ok && isBrowser()) {
    window.dispatchEvent(new Event(DEMO_DATA_CHANGE_EVENT));
  }
  return result;
}

export function resetDemoData(): StorageRead<DemoData> {
  if (!isBrowser()) {
    return { ok: false, error: "Demo data is only available in the browser." };
  }

  try {
    for (const [key, value] of Object.entries(STORAGE_KEYS) as [
      DataKey,
      (typeof STORAGE_KEYS)[DataKey],
    ][]) {
      window.localStorage.removeItem(value);
      const saved = writeValue(value, DEMO_DATA[key]);
      if (!saved.ok) return saved;
    }
  } catch {
    return {
      ok: false,
      error: "Your browser could not reset demo data. Check storage settings and try again.",
    };
  }

  window.dispatchEvent(new Event(DEMO_DATA_CHANGE_EVENT));
  return { ok: true, value: DEMO_DATA, recovered: false };
}
