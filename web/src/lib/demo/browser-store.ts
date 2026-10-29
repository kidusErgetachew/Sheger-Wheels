import { getPublicCars } from "./catalog";
import { DEMO_DATA_CHANGE_EVENT, initializeDemoData, readDemoCollection } from "./storage";
import { DEMO_DATA } from "./seed";

export type CatalogueSnapshot = {
  cars: ReturnType<typeof getPublicCars>;
  bookings: typeof DEMO_DATA.bookings;
  error: string;
};

let recoveryNotice = "";

export function getCatalogueSnapshot(): string {
  const users = readDemoCollection("users");
  const cars = readDemoCollection("cars");
  const bookings = readDemoCollection("bookings");

  const error = [users, cars, bookings].find((result) => !result.ok);
  if (error && !error.ok) {
    return JSON.stringify({
      cars: getPublicCars(DEMO_DATA),
      bookings: DEMO_DATA.bookings,
      error: recoveryNotice || error.error,
    } satisfies CatalogueSnapshot);
  }

  if (!users.ok || !cars.ok || !bookings.ok) {
    return JSON.stringify({
      cars: getPublicCars(DEMO_DATA),
      bookings: DEMO_DATA.bookings,
      error: recoveryNotice || "Saved demo listings could not be read.",
    } satisfies CatalogueSnapshot);
  }

  return JSON.stringify({
    cars: getPublicCars({ ...DEMO_DATA, users: users.value, cars: cars.value }),
    bookings: bookings.value,
    error: recoveryNotice,
  } satisfies CatalogueSnapshot);
}

export function subscribeToDemoData(onChange: () => void): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key.startsWith("sw_")) onChange();
  }

  window.addEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  const initialized = initializeDemoData();
  recoveryNotice = initialized.ok && initialized.recovered
    ? "Damaged demo data was restored to fictional sample records."
    : "";
  if (!initialized.ok) onChange();

  return () => {
    window.removeEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}
