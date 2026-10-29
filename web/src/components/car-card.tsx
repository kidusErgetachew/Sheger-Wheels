import Link from "next/link";
import { CarImage } from "@/components/car-image";
import { FavoriteButton } from "@/components/favorite-button";
import type { DemoCar } from "@/lib/demo/types";
import { formatEtb } from "@/lib/format";

export function CarCard({ car }: { car: DemoCar }) {
  const photo = car.photos[0];

  return (
    <article className="car-card">
      <Link className="car-card-link" href={`/cars/${car.id}`}>
        <div className="car-card-photo">
          <CarImage
            alt={`${car.year} ${car.make} ${car.model}`}
            className="car-photo"
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 900px) 46vw, 25vw"
            src={photo}
          />
          <span className="car-status-badge">Listed</span>
        </div>
        <div className="car-card-content">
          <div className="car-card-title">
            <div>
              <h3>{car.make} {car.model}</h3>
              <p>{car.year} <span>·</span> {car.neighbourhood}, Addis Ababa</p>
            </div>
          </div>
          <ul className="car-specs" aria-label="Vehicle details">
            <li>{car.transmission}</li>
            <li>{car.seats} seats</li>
            <li>{car.city}</li>
          </ul>
          <div className="car-card-bottom">
            <p><strong>{formatEtb(car.pricePerDay)}</strong><span> / day</span></p>
            <span className="car-open-link" aria-hidden="true">View car ↗</span>
          </div>
        </div>
      </Link>
      <FavoriteButton
        carId={car.id}
        carName={`${car.year} ${car.make} ${car.model}`}
        variant="card"
      />
    </article>
  );
}
