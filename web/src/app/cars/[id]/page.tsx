import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingCarForm } from "@/components/booking-car-form";
import { CarImage } from "@/components/car-image";
import { CarMap } from "@/components/car-map";
import { FavoriteButton } from "@/components/favorite-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCars } from "@/lib/demo/catalog";
import { DEMO_DATA } from "@/lib/demo/seed";
import { formatEtb } from "@/lib/format";

type CarDetailProps = {
  params: Promise<{ id: string }>;
};

function findPublicCar(id: string) {
  return getPublicCars(DEMO_DATA).find((car) => car.id === id);
}

export function generateStaticParams() {
  return getPublicCars(DEMO_DATA).map((car) => ({ id: car.id }));
}

export async function generateMetadata({ params }: CarDetailProps): Promise<Metadata> {
  const { id } = await params;
  const car = findPublicCar(id);
  if (!car) return { title: "Car not found" };

  const photo = car.photos[0] || "/cars/car-image-fallback.svg";

  return {
    title: `${car.make} ${car.model} in ${car.neighbourhood}`,
    description: car.description,
    alternates: {
      canonical: `/cars/${car.id}`,
    },
    openGraph: {
      title: `${car.make} ${car.model} · Sheggar Wheels`,
      description: `${formatEtb(car.pricePerDay)} per day in ${car.neighbourhood}, Addis Ababa.`,
      url: `/cars/${car.id}`,
      images: [
        {
          url: photo,
          alt: `${car.year} ${car.make} ${car.model} in ${car.neighbourhood}`,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${car.year} ${car.make} ${car.model}`,
      description: `${formatEtb(car.pricePerDay)} / day · ${car.neighbourhood}, Addis Ababa`,
      images: [photo],
    },
  };
}

export default async function CarDetailPage({ params }: CarDetailProps) {
  const { id } = await params;
  const car = findPublicCar(id);
  if (!car) notFound();

  const owner = DEMO_DATA.users.find((user) => user.id === car.ownerId);
  if (!owner) notFound();

  return (
    <>
      <SiteHeader />
      <main className="detail-main">
        <nav aria-label="Breadcrumb" className="breadcrumbs">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/cars">Browse cars</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{car.make} {car.model}</span>
        </nav>

        <section className="detail-heading">
          <div>
            <p className="eyebrow">{car.year} · {car.neighbourhood}, Addis Ababa</p>
            <h1>{car.make} {car.model}</h1>
          </div>
          <div className="detail-heading-actions">
            <FavoriteButton
              carId={car.id}
              carName={`${car.year} ${car.make} ${car.model}`}
              variant="detail"
            />
            <span className="detail-availability"><span aria-hidden="true" /> Demo listing</span>
          </div>
        </section>

        <div className="detail-layout">
          <div className="detail-main-column">
            <div className="detail-photo">
              <CarImage
                alt={`${car.year} ${car.make} ${car.model}, listed in ${car.neighbourhood}`}
                className="detail-car-photo"
                fill
                priority
                sizes="(max-width: 760px) 100vw, 66vw"
                src={car.photos[0]}
              />
              <span className="detail-photo-label">Fictional vehicle photo</span>
              <FavoriteButton
                carId={car.id}
                carName={`${car.year} ${car.make} ${car.model}`}
                variant="card"
              />
            </div>

            <section className="detail-section" aria-labelledby="about-car">
              <div>
                <p className="eyebrow">The vehicle</p>
                <h2 id="about-car">A little more about this car.</h2>
              </div>
              <p className="detail-description">{car.description}</p>
            </section>

            <section className="detail-section detail-specifications" aria-labelledby="specifications">
              <div>
                <p className="eyebrow">At a glance</p>
                <h2 id="specifications">What to expect.</h2>
              </div>
              <dl className="specification-grid">
                <div><dt>Year</dt><dd>{car.year}</dd></div>
                <div><dt>Transmission</dt><dd>{car.transmission}</dd></div>
                <div><dt>Seats</dt><dd>{car.seats} passengers</dd></div>
                <div><dt>Pick-up area</dt><dd>{car.neighbourhood}, Addis Ababa</dd></div>
              </dl>
            </section>

            {/* Interactive Leaflet Map & Non-Map Fallback */}
            <CarMap car={car} />
          </div>

          <aside className="detail-booking-card" aria-label="Demo listing details">
            <p className="eyebrow">Sample daily rate</p>
            <p className="detail-price">{formatEtb(car.pricePerDay)} <span>/ day</span></p>
            <p className="detail-rate-note">Fictional demo pricing. Select dates to review your trip and the disclosed 5% demo service fee.</p>
            <div className="detail-owner">
              <span className="account-avatar" aria-hidden="true">
                {owner.name.slice(0, 1)}
              </span>
              <span><strong>{owner.name}</strong><small>Fictional local owner</small></span>
            </div>
            <BookingCarForm car={car} />
            <FavoriteButton
              carId={car.id}
              carName={`${car.year} ${car.make} ${car.model}`}
              className="detail-booking-fav-btn"
              variant="card-full"
            />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
