"use client";

import { useSyncExternalStore } from "react";
import { DEMO_DATA } from "./seed";
import {
  DEMO_DATA_CHANGE_EVENT,
  initializeDemoData,
  readDemoCollection,
} from "./storage";
import type { DemoBooking, DemoCar, DemoData, DemoUser } from "./types";

export type BookingDataSnapshot = {
  cars: DemoCar[];
  users: DemoUser[];
  bookings: DemoBooking[];
  error: string;
};

const SERVER_SNAPSHOT: BookingDataSnapshot = {
  cars: DEMO_DATA.cars,
  users: DEMO_DATA.users,
  bookings: DEMO_DATA.bookings,
  error: "",
};
const SERVER_SNAPSHOT_JSON = JSON.stringify(SERVER_SNAPSHOT);

function getSnapshot(): string {
  const users = readDemoCollection("users");
  const cars = readDemoCollection("cars");
  const bookings = readDemoCollection("bookings");
  const errors = [users, cars, bookings]
    .filter((result) => !result.ok)
    .map((result) => result.error);

  const data: Pick<DemoData, "users" | "cars" | "bookings"> = {
    users: users.ok ? users.value : DEMO_DATA.users,
    cars: cars.ok ? cars.value : DEMO_DATA.cars,
    bookings: bookings.ok ? bookings.value : DEMO_DATA.bookings,
  };
  return JSON.stringify({ ...data, error: errors.join(" ") } satisfies BookingDataSnapshot);
}

function subscribe(onChange: () => void): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key.startsWith("sw_")) onChange();
  }
  window.addEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  const initialized = initializeDemoData();
  if (!initialized.ok) onChange();

  return () => {
    window.removeEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useBookingData(): BookingDataSnapshot {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SERVER_SNAPSHOT_JSON,
  );
  return JSON.parse(snapshot) as BookingDataSnapshot;
}
