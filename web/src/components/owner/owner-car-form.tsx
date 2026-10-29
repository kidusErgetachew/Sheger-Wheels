"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Image from "next/image";
import { ADDIS_NEIGHBOURHOODS, VEHICLE_TYPES } from "@/lib/demo/catalog";
import {
  createDemoCar,
  updateDemoCar,
  validateCarInput,
  type CarInput,
  type CarValidationErrors,
} from "@/lib/demo/car-actions";
import type { DemoCar, DemoUser, VehicleType } from "@/lib/demo/types";

const PRESET_CAR_PHOTOS = [
  { label: "BYD Qin Plus (2025)", url: "/cars/BYD quin plus 2025.jpg" },
  { label: "BYD Song Plus (2024)", url: "/cars/BYD Song Plus 2024.jpg" },
  { label: "Chery CQ 7 (2024)", url: "/cars/Cherry CQ 7 2024.jpg" },
  { label: "Honda EV (2022)", url: "/cars/Honda EV 2022.jpg" },
  { label: "Hyundai Tucson (2020)", url: "/cars/Hyundai Tucson 2020.jpg" },
  { label: "Suzuki Dzire (2022)", url: "/cars/Suzuki Dzire 2022.jpg" },
  { label: "Toyota Bz3 (2023)", url: "/cars/TOYOTA Bz3 Long Range 2023.jpg" },
  { label: "Toyota bZ4X (2023)", url: "/cars/TOYOTA Bz4x 2023.jpg" },
  { label: "Toyota bZ4X 4WD (2023)", url: "/cars/TOYOTA Bz4x 4WD 2023.jpg" },
  { label: "Toyota Grand Highlander (2025)", url: "/cars/TOYOTA Grand Highlander 2025.jpg" },
  { label: "Toyota Revo Pickup (2020)", url: "/cars/TOYOTA Revo 2020.jpg" },
  { label: "Toyota RAV4 (2025)", url: "/cars/Toyota RAV4 2025.jfif" },
  { label: "Hyundai Elantra (2026)", url: "/cars/hyundai_elantra 2026.webp" },
  { label: "Toyota Hilux (2025)", url: "/cars/Toyota hilux 2025.jfif" },
  { label: "Mercedes GLC (2024)", url: "/cars/Mercedes GLC 2024.webp" },
];

export function OwnerCarForm({
  user,
  existingCar,
  targetCarId,
  isEdit = false,
}: {
  user: DemoUser;
  existingCar?: DemoCar | null;
  targetCarId?: string;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [make, setMake] = useState(existingCar?.make ?? "");
  const [model, setModel] = useState(existingCar?.model ?? "");
  const [year, setYear] = useState(existingCar?.year ?? 2024);
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    existingCar?.vehicleType ?? "Sedan",
  );
  const [transmission, setTransmission] = useState<"Automatic" | "Manual">(
    existingCar?.transmission ?? "Automatic",
  );
  const [seats, setSeats] = useState(existingCar?.seats ?? 5);
  const [neighbourhood, setNeighbourhood] = useState(
    existingCar?.neighbourhood ?? "Bole",
  );
  const city = existingCar?.city ?? "Addis Ababa";
  const [pricePerDay, setPricePerDay] = useState(
    existingCar?.pricePerDay ?? 3500,
  );
  const [selectedPhoto, setSelectedPhoto] = useState(
    existingCar?.photos[0] ?? PRESET_CAR_PHOTOS[0].url,
  );
  const [customPhoto, setCustomPhoto] = useState("");
  const [description, setDescription] = useState(
    existingCar?.description ??
      "Reliable and well-maintained vehicle available for rental in Addis Ababa.",
  );

  const [errors, setErrors] = useState<CarValidationErrors>({});
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");

  const activePhoto = customPhoto.trim() || selectedPhoto;

  // If in edit mode, check ownership strictly!
  if (isEdit) {
    if (!existingCar) {
      return (
        <section className="dashboard-panel dashboard-security-alert" role="alert">
          <div className="security-alert-header">
            <span className="security-badge">NOT FOUND</span>
            <h2>Vehicle not found</h2>
          </div>
          <p>
            No vehicle listing was found with ID <code>{targetCarId || "unknown"}</code>.
          </p>
          <div style={{ marginTop: "16px" }}>
            <Link className="button button-primary" href="/owner/listings">
              Return to my listings
            </Link>
          </div>
        </section>
      );
    }

    if (existingCar.ownerId !== user.id) {
      return (
        <section className="dashboard-panel dashboard-security-alert alert-violation" role="alert">
          <div className="security-alert-header">
            <span className="security-badge alert-danger">ACCESS DENIED</span>
            <h2>Listing edit access restricted</h2>
          </div>
          <p className="security-message">
            <strong>Security Rule Enforcement:</strong> You do not own this vehicle listing (ID: <code>{existingCar.id}</code>).
            Changing the URL to another owner&apos;s vehicle ID is strictly prohibited. You can only view and edit vehicles registered to your account (<strong>{user.name}</strong>).
          </p>
          <div style={{ marginTop: "18px" }}>
            <Link className="button button-primary" href="/owner/listings">
              Return to my vehicles
            </Link>
          </div>
        </section>
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError("");
    setSuccessNotice("");

    const payload: CarInput = {
      make,
      model,
      year: Number(year),
      vehicleType,
      transmission,
      seats: Number(seats),
      city,
      neighbourhood,
      pricePerDay: Number(pricePerDay),
      photos: [activePhoto],
      description,
    };

    const validation = validateCarInput(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    if (isEdit && existingCar) {
      const result = updateDemoCar(existingCar.id, payload);
      setIsSubmitting(false);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setSuccessNotice("Vehicle details updated successfully!");
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => {
        router.push("/owner/listings");
      }, 900);
    } else {
      const result = createDemoCar(payload);
      setIsSubmitting(false);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setSuccessNotice("Vehicle submitted successfully! It is now pending admin approval.");
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => {
        router.push("/owner/listings");
      }, 1000);
    }
  }

  return (
    <div className="owner-car-form-wrapper">
      <div className="owner-form-nav">
        <Link className="owner-back-link" href="/owner/listings">
          ← Back to My Listings
        </Link>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>{isEdit ? `Edit ${existingCar?.make} ${existingCar?.model}` : "List a New Vehicle"}</h2>
            <p>
              {isEdit
                ? "Update vehicle specs, rental price, pickup area, and photos."
                : "Add a car to your Sheggar Wheels fleet. Newly listed cars submit for administrator review."}
            </p>
          </div>
          {isEdit && existingCar && (
            <span className="owner-vehicle-id-badge">ID: {existingCar.id}</span>
          )}
        </div>

        {actionError && (
          <div className="dashboard-alert alert-error" role="alert">
            {actionError}
          </div>
        )}
        {successNotice && (
          <div className="dashboard-alert alert-success" role="status">
            ✓ {successNotice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="owner-vehicle-form" noValidate>
          <div className="form-grid-2">
            <div className="form-field-group">
              <label htmlFor="make">Vehicle Make *</label>
              <input
                id="make"
                type="text"
                className={`form-input${errors.make ? " form-input-error" : ""}`}
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Toyota, BYD, Chery"
                required
              />
              {errors.make && <small className="field-error">{errors.make}</small>}
            </div>

            <div className="form-field-group">
              <label htmlFor="model">Model *</label>
              <input
                id="model"
                type="text"
                className={`form-input${errors.model ? " form-input-error" : ""}`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Song Plus, RAV4, bZ4X"
                required
              />
              {errors.model && <small className="field-error">{errors.model}</small>}
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-field-group">
              <label htmlFor="year">Year *</label>
              <input
                id="year"
                type="number"
                min={2000}
                max={2027}
                className={`form-input${errors.year ? " form-input-error" : ""}`}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
              />
              {errors.year && <small className="field-error">{errors.year}</small>}
            </div>

            <div className="form-field-group">
              <label htmlFor="vehicleType">Vehicle Type *</label>
              <select
                id="vehicleType"
                className={`form-select${errors.vehicleType ? " form-input-error" : ""}`}
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.vehicleType && <small className="field-error">{errors.vehicleType}</small>}
            </div>

            <div className="form-field-group">
              <label htmlFor="transmission">Transmission *</label>
              <select
                id="transmission"
                className={`form-select${errors.transmission ? " form-input-error" : ""}`}
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as "Automatic" | "Manual")}
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
              {errors.transmission && <small className="field-error">{errors.transmission}</small>}
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-field-group">
              <label htmlFor="seats">Seats (Passengers) *</label>
              <input
                id="seats"
                type="number"
                min={2}
                max={15}
                className={`form-input${errors.seats ? " form-input-error" : ""}`}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                required
              />
              {errors.seats && <small className="field-error">{errors.seats}</small>}
            </div>

            <div className="form-field-group">
              <label htmlFor="neighbourhood">Addis Neighbourhood *</label>
              <select
                id="neighbourhood"
                className={`form-select${errors.neighbourhood ? " form-input-error" : ""}`}
                value={neighbourhood}
                onChange={(e) => setNeighbourhood(e.target.value)}
              >
                {ADDIS_NEIGHBOURHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.neighbourhood && (
                <small className="field-error">{errors.neighbourhood}</small>
              )}
            </div>

            <div className="form-field-group">
              <label htmlFor="pricePerDay">Daily Rate (ETB) *</label>
              <input
                id="pricePerDay"
                type="number"
                step="50"
                min={500}
                max={50000}
                className={`form-input${errors.pricePerDay ? " form-input-error" : ""}`}
                value={pricePerDay}
                onChange={(e) => setPricePerDay(Number(e.target.value))}
                required
              />
              {errors.pricePerDay && (
                <small className="field-error">{errors.pricePerDay}</small>
              )}
            </div>
          </div>

          <div className="form-field-group">
            <label>Select Vehicle Photo *</label>
            <p className="field-hint">Choose from verified Addis demo fleet images or specify a custom URL.</p>
            <div className="photo-picker-grid">
              {PRESET_CAR_PHOTOS.map((photo) => {
                const isSelected = selectedPhoto === photo.url && !customPhoto.trim();
                return (
                  <button
                    type="button"
                    key={photo.url}
                    className={`photo-picker-item${isSelected ? " photo-picker-selected" : ""}`}
                    onClick={() => {
                      setSelectedPhoto(photo.url);
                      setCustomPhoto("");
                    }}
                  >
                    <div className="photo-thumb-wrap">
                      <Image
                        src={photo.url}
                        alt={photo.label}
                        fill
                        sizes="100px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <span>{photo.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="custom-photo-row">
              <label htmlFor="customPhoto">Or custom photo path / URL:</label>
              <input
                id="customPhoto"
                type="text"
                className="form-input"
                placeholder="e.g. /cars/custom.jpg"
                value={customPhoto}
                onChange={(e) => setCustomPhoto(e.target.value)}
              />
            </div>
            {errors.photos && <small className="field-error">{errors.photos}</small>}
          </div>

          <div className="form-field-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              rows={4}
              className={`form-textarea${errors.description ? " form-input-error" : ""}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your vehicle's features, driving comfort, fuel efficiency, and pickup guidelines..."
              required
            />
            <div className="textarea-footer">
              <small className="field-hint">Min 10 characters, max 500.</small>
              <small className="char-counter">{description.length} / 500</small>
            </div>
            {errors.description && (
              <small className="field-error">{errors.description}</small>
            )}
          </div>

          <div className="owner-form-actions">
            <Link className="button button-outline" href="/owner/listings">
              Cancel
            </Link>
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update Vehicle"
                  : "Submit for Listing Approval"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
