import { getCurrentSession, requireCurrentRole } from "./session";
import { readDemoCollection, writeDemoCollection } from "./storage";
import { VEHICLE_TYPES } from "./catalog";
import type { ActionResult, CarStatus, DemoCar, VehicleType } from "./types";

export type CarInput = {
  make: string;
  model: string;
  year: number;
  vehicleType: VehicleType;
  transmission: "Automatic" | "Manual";
  seats: number;
  city?: string;
  neighbourhood: string;
  pricePerDay: number;
  photos: string[];
  description: string;
  unavailableDates?: string[];
};

export type CarValidationErrors = Partial<Record<keyof CarInput, string>>;

export function validateCarInput(input: Partial<CarInput>): {
  valid: boolean;
  errors: CarValidationErrors;
} {
  const errors: CarValidationErrors = {};

  const make = input.make?.trim() ?? "";
  if (!make) {
    errors.make = "Vehicle make is required (e.g. Toyota, BYD).";
  } else if (make.length < 2 || make.length > 50) {
    errors.make = "Make must be between 2 and 50 characters.";
  }

  const model = input.model?.trim() ?? "";
  if (!model) {
    errors.model = "Vehicle model is required (e.g. RAV4, Song Plus).";
  } else if (model.length < 1 || model.length > 50) {
    errors.model = "Model must be between 1 and 50 characters.";
  }

  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2027) {
    errors.year = "Enter a valid model year between 2000 and 2027.";
  }

  if (
    !input.vehicleType ||
    !VEHICLE_TYPES.includes(input.vehicleType as (typeof VEHICLE_TYPES)[number])
  ) {
    errors.vehicleType = "Select a valid vehicle category.";
  }

  if (
    input.transmission !== "Automatic" &&
    input.transmission !== "Manual"
  ) {
    errors.transmission = "Select transmission (Automatic or Manual).";
  }

  const seats = Number(input.seats);
  if (!Number.isInteger(seats) || seats < 2 || seats > 15) {
    errors.seats = "Passenger seats must be between 2 and 15.";
  }

  const neighbourhood = input.neighbourhood?.trim() ?? "";
  if (!neighbourhood) {
    errors.neighbourhood = "Pickup neighbourhood is required.";
  } else if (neighbourhood.length > 50) {
    errors.neighbourhood = "Neighbourhood name is too long.";
  }

  const price = Number(input.pricePerDay);
  if (!Number.isFinite(price) || price < 500 || price > 50000) {
    errors.pricePerDay = "Daily rental price must be between 500 and 50,000 ETB.";
  }

  const description = input.description?.trim() ?? "";
  if (!description) {
    errors.description = "Vehicle description is required.";
  } else if (description.length < 10) {
    errors.description = "Description should be at least 10 characters.";
  } else if (description.length > 500) {
    errors.description = "Description cannot exceed 500 characters.";
  }

  if (!input.photos || !Array.isArray(input.photos) || input.photos.length === 0) {
    errors.photos = "At least one vehicle photo is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

const NEIGHBOURHOOD_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Bole: { lat: 8.995, lng: 38.787 },
  Kazanchis: { lat: 9.018, lng: 38.762 },
  "Old Airport": { lat: 8.988, lng: 38.736 },
  Megenagna: { lat: 9.025, lng: 38.807 },
  CMC: { lat: 9.012, lng: 38.833 },
  Piazza: { lat: 9.035, lng: 38.752 },
  "Sar Bet": { lat: 8.98, lng: 38.72 },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createDemoCar(input: CarInput): ActionResult<DemoCar> {
  const authorized = requireCurrentRole("owner");
  if (!authorized.ok) return authorized;

  const validation = validateCarInput(input);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0];
    return { ok: false, error: firstError || "Invalid vehicle details." };
  }

  const storedCars = readDemoCollection("cars");
  if (!storedCars.ok) return storedCars;

  const neighbourhood = input.neighbourhood.trim();
  const coords = NEIGHBOURHOOD_COORDINATES[neighbourhood] ?? {
    lat: 9.02,
    lng: 38.76,
  };

  const suffix = Math.random().toString(36).slice(2, 7);
  const carId = `car-${slugify(input.make)}-${slugify(input.model)}-${suffix}`;

  const newCar: DemoCar = {
    id: carId,
    ownerId: authorized.value.id,
    make: input.make.trim(),
    model: input.model.trim(),
    year: Number(input.year),
    vehicleType: input.vehicleType,
    transmission: input.transmission,
    seats: Number(input.seats),
    city: input.city?.trim() || "Addis Ababa",
    neighbourhood,
    latitude: coords.lat,
    longitude: coords.lng,
    pricePerDay: Math.round(Number(input.pricePerDay)),
    photos: input.photos,
    description: input.description.trim(),
    status: "pending", // Newly created vehicles submit for admin approval
    unavailableDates: input.unavailableDates || [],
    createdAt: new Date().toISOString(),
  };

  const saved = writeDemoCollection("cars", [...storedCars.value, newCar]);
  if (!saved.ok) return saved;

  return { ok: true, value: newCar };
}

export function updateDemoCar(
  carId: string,
  input: Partial<CarInput>,
): ActionResult<DemoCar> {
  const current = getCurrentSession();
  if (!current.ok) return current;
  if (!current.value.user) return { ok: false, error: "Not signed in." };

  const user = current.value.user;
  if (!user.roles.includes("owner")) {
    return { ok: false, error: "This action requires owner authorization." };
  }

  const storedCars = readDemoCollection("cars");
  if (!storedCars.ok) return storedCars;

  const existingCar = storedCars.value.find((c) => c.id === carId);
  if (!existingCar) {
    return { ok: false, error: `Vehicle with ID "${carId}" could not be found.` };
  }

  // Strict ownership restriction check
  if (existingCar.ownerId !== user.id) {
    return {
      ok: false,
      error: "Access Denied: You do not own this vehicle and cannot edit it.",
    };
  }

  const mergedInput: CarInput = {
    make: input.make ?? existingCar.make,
    model: input.model ?? existingCar.model,
    year: input.year ?? existingCar.year,
    vehicleType: input.vehicleType ?? existingCar.vehicleType ?? "Sedan",
    transmission: input.transmission ?? existingCar.transmission,
    seats: input.seats ?? existingCar.seats,
    city: input.city ?? existingCar.city,
    neighbourhood: input.neighbourhood ?? existingCar.neighbourhood,
    pricePerDay: input.pricePerDay ?? existingCar.pricePerDay,
    photos: input.photos ?? existingCar.photos,
    description: input.description ?? existingCar.description,
    unavailableDates: input.unavailableDates ?? existingCar.unavailableDates,
  };

  const validation = validateCarInput(mergedInput);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0];
    return { ok: false, error: firstError || "Invalid vehicle details." };
  }

  const neighbourhood = mergedInput.neighbourhood.trim();
  const coords =
    NEIGHBOURHOOD_COORDINATES[neighbourhood] ?? {
      lat: existingCar.latitude,
      lng: existingCar.longitude,
    };

  // If the listing was previously rejected, updating it sets it back to pending for re-review
  const nextStatus: CarStatus =
    existingCar.status === "rejected" ? "pending" : existingCar.status;

  const updatedCar: DemoCar = {
    ...existingCar,
    make: mergedInput.make.trim(),
    model: mergedInput.model.trim(),
    year: Number(mergedInput.year),
    vehicleType: mergedInput.vehicleType,
    transmission: mergedInput.transmission,
    seats: Number(mergedInput.seats),
    city: mergedInput.city?.trim() || "Addis Ababa",
    neighbourhood,
    latitude: coords.lat,
    longitude: coords.lng,
    pricePerDay: Math.round(Number(mergedInput.pricePerDay)),
    photos: mergedInput.photos,
    description: mergedInput.description.trim(),
    unavailableDates: mergedInput.unavailableDates || [],
    status: nextStatus,
  };

  const saved = writeDemoCollection(
    "cars",
    storedCars.value.map((c) => (c.id === carId ? updatedCar : c)),
  );
  if (!saved.ok) return saved;

  return { ok: true, value: updatedCar };
}

export function toggleDemoCarStatus(carId: string): ActionResult<DemoCar> {
  const current = getCurrentSession();
  if (!current.ok) return current;
  if (!current.value.user) return { ok: false, error: "Not signed in." };

  const user = current.value.user;
  if (!user.roles.includes("owner")) {
    return { ok: false, error: "This action requires owner authorization." };
  }

  const storedCars = readDemoCollection("cars");
  if (!storedCars.ok) return storedCars;

  const car = storedCars.value.find((c) => c.id === carId);
  if (!car) {
    return { ok: false, error: `Vehicle "${carId}" was not found.` };
  }

  // Strict ownership restriction check
  if (car.ownerId !== user.id) {
    return {
      ok: false,
      error: "Access Denied: You do not own this vehicle and cannot change its status.",
    };
  }

  let nextStatus: CarStatus;
  if (car.status === "approved") {
    nextStatus = "inactive";
  } else if (car.status === "inactive") {
    nextStatus = "approved";
  } else {
    return {
      ok: false,
      error: `Cannot toggle vehicle status while in "${car.status}" state.`,
    };
  }

  const updatedCar: DemoCar = {
    ...car,
    status: nextStatus,
  };

  const saved = writeDemoCollection(
    "cars",
    storedCars.value.map((c) => (c.id === carId ? updatedCar : c)),
  );
  if (!saved.ok) return saved;

  return { ok: true, value: updatedCar };
}

export function adminModerateCar(
  carId: string,
  newStatus: "approved" | "rejected",
): ActionResult<DemoCar> {
  const authorized = requireCurrentRole("admin");
  if (!authorized.ok) return authorized;

  const storedCars = readDemoCollection("cars");
  if (!storedCars.ok) return storedCars;

  const car = storedCars.value.find((c) => c.id === carId);
  if (!car) {
    return { ok: false, error: `Vehicle with ID "${carId}" was not found.` };
  }

  const updatedCar: DemoCar = {
    ...car,
    status: newStatus,
  };

  const saved = writeDemoCollection(
    "cars",
    storedCars.value.map((c) => (c.id === carId ? updatedCar : c)),
  );
  if (!saved.ok) return saved;

  return { ok: true, value: updatedCar };
}
