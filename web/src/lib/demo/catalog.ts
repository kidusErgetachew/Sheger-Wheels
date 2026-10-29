import type { DemoBooking, DemoCar, DemoData } from "./types";
import { isIsoDate, localIsoDate } from "../dates";

export type CatalogueFilters = {
  query: string;
  neighbourhood: string;
  vehicleType: string;
  transmission: string;
  seats: string;
  minPrice: string;
  maxPrice: string;
  startDate: string;
  endDate: string;
  sort: string;
};

export const ADDIS_NEIGHBOURHOODS = [
  "Bole",
  "Kazanchis",
  "Old Airport",
  "Megenagna",
  "CMC",
  "Piazza",
  "Sar Bet",
] as const;

export const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Pickup",
  "Van",
  "Hatchback",
] as const;

export const DEFAULT_CATALOGUE_FILTERS: CatalogueFilters = {
  query: "",
  neighbourhood: "",
  vehicleType: "",
  transmission: "",
  seats: "",
  minPrice: "",
  maxPrice: "",
  startDate: "",
  endDate: "",
  sort: "popular",
};

export function filtersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): CatalogueFilters {
  const one = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : "";
  const rawMinPrice = one(params.minPrice);
  const rawPrice = one(params.maxPrice);
  const neighbourhood = one(params.neighbourhood);
  const vehicleType = one(params.vehicleType);
  const transmission = one(params.transmission);
  const seats = one(params.seats);
  const sort = one(params.sort);
  const startDate = one(params.startDate);
  const endDate = one(params.endDate);
  const hasValidDateRange =
    isIsoDate(startDate) &&
    isIsoDate(endDate) &&
    endDate > startDate &&
    startDate >= localIsoDate();
  const numericPrice = Number(rawPrice);
  const numericMinPrice = Number(rawMinPrice);
  const hasValidPrice =
    Number.isSafeInteger(numericPrice) &&
    numericPrice >= 500 &&
    numericPrice <= 50000 &&
    (numericPrice - 500) % 100 === 0;
  const hasValidMinPrice =
    Number.isSafeInteger(numericMinPrice) &&
    numericMinPrice >= 500 &&
    numericMinPrice <= 50000 &&
    (numericMinPrice - 500) % 100 === 0;
  const hasValidPriceRange =
    hasValidMinPrice &&
    hasValidPrice &&
    numericMinPrice <= numericPrice;
  let minPrice = hasValidMinPrice ? rawMinPrice : "";
  let maxPrice = hasValidPrice ? rawPrice : "";
  if (hasValidMinPrice && hasValidPrice && !hasValidPriceRange) {
    minPrice = "";
    maxPrice = "";
  }

  return {
    query: one(params.q).trim().slice(0, 80),
    neighbourhood:
      neighbourhood === "" ||
      neighbourhood === "Addis Ababa" ||
      ADDIS_NEIGHBOURHOODS.some((option) => option === neighbourhood)
        ? neighbourhood
        : "",
    vehicleType: VEHICLE_TYPES.some((option) => option === vehicleType)
      ? vehicleType
      : "",
    transmission:
      transmission === "Automatic" || transmission === "Manual"
        ? transmission
        : "",
    seats: ["4", "5", "7"].includes(seats) ? seats : "",
    minPrice,
    maxPrice,
    startDate: hasValidDateRange ? startDate : "",
    endDate: hasValidDateRange ? endDate : "",
    sort: ["popular", "price-asc", "price-desc", "newest"].includes(sort)
      ? sort
      : "popular",
  };
}

export function getVehicleType(car: DemoCar): string {
  if (car.vehicleType && VEHICLE_TYPES.includes(car.vehicleType)) {
    return car.vehicleType;
  }

  const model = `${car.make} ${car.model}`.toLocaleLowerCase();
  if (/hilux|revo|pickup|truck/.test(model)) return "Pickup";
  if (/swift|polo|hatchback/.test(model)) return "Hatchback";
  if (/rav4|song|cq 7|tucson|bz4x|highlander|glc|cr-v|patrol|sportage|honda ev/.test(model)) {
    return "SUV";
  }
  return "Sedan";
}

const ACTIVE_BOOKING_STATUSES: DemoBooking["status"][] = [
  "requested",
  "confirmed",
  "in_progress",
  "disputed",
];

export function isCarAvailable(
  car: DemoCar,
  bookings: DemoBooking[],
  startDate: string,
  endDate: string,
): boolean {
  if (!startDate || !endDate) return true;
  if (endDate <= startDate) return false;

  const hasUnavailableDay = car.unavailableDates.some(
    (date) => date >= startDate && date < endDate,
  );
  if (hasUnavailableDay) return false;

  return !bookings.some(
    (booking) =>
      booking.carId === car.id &&
      ACTIVE_BOOKING_STATUSES.includes(booking.status) &&
      startDate < booking.endDate &&
      endDate > booking.startDate,
  );
}

export function getPublicCars(data: DemoData): DemoCar[] {
  const activeOwnerIds = new Set(
    data.users
      .filter(
        (user) => user.status === "active" && user.roles.includes("owner"),
      )
      .map((user) => user.id),
  );

  return data.cars.filter(
    (car) =>
      car.status === "approved" && activeOwnerIds.has(car.ownerId),
  );
}

export function filterPublicCars(
  cars: DemoCar[],
  bookings: DemoBooking[],
  filters: CatalogueFilters,
): DemoCar[] {
  const query = filters.query.toLocaleLowerCase();
  const minPrice = filters.minPrice ? Number(filters.minPrice) : 0;
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
  const popularity = new Map<string, number>();
  for (const booking of bookings) {
    popularity.set(
      booking.carId,
      (popularity.get(booking.carId) || 0) + 1,
    );
  }

  return cars
    .filter((car) => {
      const matchesQuery =
        !query ||
        `${car.make} ${car.model} ${car.description}`
          .toLocaleLowerCase()
          .includes(query);
      const matchesNeighbourhood =
        !filters.neighbourhood ||
        filters.neighbourhood === "Addis Ababa" ||
        car.neighbourhood === filters.neighbourhood;
      const matchesTransmission =
        !filters.transmission ||
        car.transmission === filters.transmission;
      const matchesVehicleType =
        !filters.vehicleType ||
        getVehicleType(car) === filters.vehicleType;
      const matchesSeats =
        !filters.seats || car.seats >= Number(filters.seats);
      const matchesPrice =
        car.pricePerDay >= minPrice && car.pricePerDay <= maxPrice;
      const matchesDates =
        !filters.startDate ||
        !filters.endDate ||
        isCarAvailable(
          car,
          bookings,
          filters.startDate,
          filters.endDate,
        );

      return (
        matchesQuery &&
        matchesNeighbourhood &&
        matchesVehicleType &&
        matchesTransmission &&
        matchesSeats &&
        matchesPrice &&
        matchesDates
      );
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "price-asc":
          return a.pricePerDay - b.pricePerDay;
        case "price-desc":
          return b.pricePerDay - a.pricePerDay;
        case "newest":
          return b.createdAt.localeCompare(a.createdAt);
        default:
          return (
            (popularity.get(b.id) || 0) - (popularity.get(a.id) || 0) ||
            b.createdAt.localeCompare(a.createdAt)
          );
      }
    });
}
