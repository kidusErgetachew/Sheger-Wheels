import Image from "next/image";
import Link from "next/link";
import { CarCard } from "@/components/car-card";
import { HomeSearch } from "@/components/home-search";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCars } from "@/lib/demo/catalog";
import { DEMO_DATA } from "@/lib/demo/seed";

const featuredCars = getPublicCars(DEMO_DATA).slice(0, 4);

const highlights = [
  {
    number: "01",
    title: "Find your fit",
    detail: "Compare cars shared by local owners around Addis Ababa.",
  },
  {
    number: "02",
    title: "Choose your dates",
    detail: "Search by location and travel dates to see available cars.",
  },
  {
    number: "03",
    title: "Explore Addis",
    detail: "Choose a local pick-up and enjoy the road ahead.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">A peer-to-peer car rental demo</p>
            <h1>Explore Addis Ababa.<br /><span>Your way.</span></h1>
            <p className="hero-intro">
              Find the right car for your next city ride or weekend getaway.
              Discover fictional listings from local Addis owners.
            </p>
            <HomeSearch />
            <div className="hero-note">
              <span className="note-icon" aria-hidden="true">✓</span>
              <span><strong>Made for Addis</strong><br />Transparent demo listings and ETB pricing</span>
            </div>
          </div>
          <div className="hero-art">
            <Image
              alt="A Toyota SUV on an Addis Ababa road with the city in the distance"
              className="hero-photo"
              fill
              priority
              sizes="(max-width: 680px) 100vw, 60vw"
              src="/cars/hero-addis.jpg"
            />
            <div className="hero-photo-caption">
              <span><strong>Addis Ababa</strong><small>A city made to explore</small></span>
              <span className="hero-photo-coordinate">08°59&apos; N&nbsp; 38°45&apos; E</span>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Demo details">
          <p><span aria-hidden="true">⌖</span> Made for Addis Ababa</p>
          <p><span aria-hidden="true">◇</span> Cars shared by local owners</p>
          <p><span aria-hidden="true">ETB</span> Clear fictional demo prices</p>
        </section>

        <section className="section fleet-section" id="cars">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Fictional demo listings</p>
              <h2>Find a car for the road ahead.</h2>
              <p>Explore local cars with clear ETB daily rates.</p>
            </div>
            <Link className="section-link" href="/cars">
              View all cars <span aria-hidden="true">→</span>
            </Link>
          </div>
          {featuredCars.length > 0 ? (
            <div className="car-grid">
              {featuredCars.map((car) => <CarCard car={car} key={car.id} />)}
            </div>
          ) : (
            <p className="empty-state" role="status">
              No approved cars are available right now. Check back soon.
            </p>
          )}
          <p className="demo-caption">
            People, vehicles, availability, and prices are fictional demo data.
          </p>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A simple way to get going</p>
              <h2>Your next trip starts here.</h2>
            </div>
          </div>
          <div className="steps-grid">
            {highlights.map((item) => (
              <article className="step-card" key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="owner-banner" id="about">
          <div>
            <p className="eyebrow">More than a way to get around</p>
            <h2>Good things happen<br />when we share the road.</h2>
            <p>
              Get to know Sheggar Wheels through a realistic, fictional
              marketplace demo created for Addis Ababa.
            </p>
            <Link className="button button-primary" href="/cars">
              Explore the demo fleet <span aria-hidden="true">→</span>
            </Link>
          </div>
          <span className="banner-stamp" aria-hidden="true">
            MADE FOR<br />ADDIS ABABA<br /><b>↗</b>
          </span>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
