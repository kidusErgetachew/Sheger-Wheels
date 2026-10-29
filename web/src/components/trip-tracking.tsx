"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useBookingData } from "@/lib/demo/booking-store";
import { useCurrentDemoSession } from "@/lib/demo/session-store";
import { formatDemoDate, formatEtb } from "@/lib/format";
import type { DemoBooking, DemoCar } from "@/lib/demo/types";

type RouteCheckpoint = {
  name: string;
  lat: number;
  lng: number;
  desc: string;
};

const SIMULATED_ROUTE: RouteCheckpoint[] = [
  { name: "Bole Airport Terminal", lat: 8.9806, lng: 38.7997, desc: "Trip Origin: Bole International Airport" },
  { name: "Bole Medhanialem", lat: 8.9984, lng: 38.7886, desc: "Cameroon Street & Edna Mall" },
  { name: "Atlas Area", lat: 9.0089, lng: 38.7812, desc: "Djibouti Street Intersection" },
  { name: "Meskel Square", lat: 9.0107, lng: 38.7612, desc: "Addis Ababa Central Hub" },
  { name: "Stadium / Legehar", lat: 9.0152, lng: 38.7523, desc: "Light Rail Exchange Point" },
  { name: "Arat Kilo", lat: 9.0345, lng: 38.7628, desc: "Victory Monument Avenue" },
  { name: "Piazza St. George", lat: 9.0357, lng: 38.7518, desc: "Trip Destination: Historic Piazza" },
];

export function TripTracking({ bookingId }: { bookingId: string }) {
  const { user } = useCurrentDemoSession();
  const { bookings, cars, error: storageError } = useBookingData();

  const booking = user
    ? bookings.find((b) => b.id === bookingId && (b.renterId === user.id || b.ownerId === user.id))
    : undefined;
  const car = booking ? cars.find((c) => c.id === booking.carId) : undefined;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 4>(1);

  // Interval timer for advancing marker along checkpoints
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= SIMULATED_ROUTE.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2800 / speedMultiplier);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier]);

  // Leaflet map initialization
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      try {
        const L = (await import("leaflet")).default;
        if (isCancelled || !mapContainerRef.current) return;

        if (mapInstanceRef.current) {
          (mapInstanceRef.current as { remove: () => void }).remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [SIMULATED_ROUTE[0].lat, SIMULATED_ROUTE[0].lng],
          zoom: 13,
          scrollWheelZoom: false,
        });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Draw polyline connecting all checkpoints
        const latLngs = SIMULATED_ROUTE.map((pt) => [pt.lat, pt.lng] as [number, number]);
        L.polyline(latLngs, {
          color: "#2c5b5b",
          weight: 5,
          opacity: 0.8,
          dashArray: "8, 6",
        }).addTo(map);

        // Add checkpoint circle markers
        SIMULATED_ROUTE.forEach((pt, idx) => {
          const isEndpoint = idx === 0 || idx === SIMULATED_ROUTE.length - 1;
          L.circleMarker([pt.lat, pt.lng], {
            radius: isEndpoint ? 8 : 5,
            color: isEndpoint ? "#bd8c16" : "#2c5b5b",
            fillColor: isEndpoint ? "#e9b93e" : "#ffffff",
            fillOpacity: 1,
            weight: 2,
          })
            .bindPopup(`<strong>${pt.name}</strong><br/>${pt.desc}`)
            .addTo(map);
        });

        // Animated Vehicle Marker
        const carIcon = L.divIcon({
          className: "leaflet-tracking-car-container",
          html: `
            <div class="leaflet-tracking-marker">
              <span class="tracking-car-icon">🚘</span>
              <span class="tracking-pulse"></span>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const marker = L.marker([SIMULATED_ROUTE[0].lat, SIMULATED_ROUTE[0].lng], {
          icon: carIcon,
        }).addTo(map);
        markerRef.current = marker;

        map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });
      } catch (err) {
        console.error("Leaflet map tracking error:", err);
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        try {
          (mapInstanceRef.current as { remove: () => void }).remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when currentIndex changes
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) return;
    const pt = SIMULATED_ROUTE[currentIndex];
    const marker = markerRef.current as { setLatLng: (coords: [number, number]) => void };
    const map = mapInstanceRef.current as { panTo: (coords: [number, number], options?: unknown) => void };

    marker.setLatLng([pt.lat, pt.lng]);
    map.panTo([pt.lat, pt.lng], { animate: true, duration: 0.8 });
  }, [currentIndex]);

  if (storageError) return <p className="form-message form-error" role="alert">{storageError}</p>;
  if (!booking || !car) {
    return (
      <section className="booking-recovery" role="alert">
        <h2>Booking tracking not available</h2>
        <p>This trip record does not exist or does not belong to your account.</p>
        <Link className="button button-primary" href="/renter/bookings">View your rentals</Link>
      </section>
    );
  }

  const currentPt = SIMULATED_ROUTE[currentIndex];
  const progressPercent = Math.round((currentIndex / (SIMULATED_ROUTE.length - 1)) * 100);
  const isFinished = currentIndex === SIMULATED_ROUTE.length - 1;
  const tripStateLabel = isFinished
    ? "Trip Completed · Arrived"
    : currentIndex === 0
      ? "Vehicle Dispatched · At Origin"
      : `In Transit · Checkpoint ${currentIndex + 1} of ${SIMULATED_ROUTE.length}`;

  return (
    <div className="trip-tracking-layout">
      {/* Include Leaflet CSS via head link */}
      <link
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        rel="stylesheet"
      />

      <header className="tracking-header">
        <div>
          <div className="tracking-eyebrow-row">
            <span className="eyebrow">SIMULATED TRIP TRACKING</span>
            <span className="tracking-simulation-pill">SIMULATION ONLY</span>
          </div>
          <h1>{car.year} {car.make} {car.model}</h1>
          <p className="tracking-subtitle">
            Booking <code>{booking.id}</code> · {formatDemoDate(booking.startDate)} to {formatDemoDate(booking.endDate)}
          </p>
        </div>

        <div className="tracking-header-actions">
          <Link className="button button-primary" href="/">
            ← Back to home page
          </Link>
          <Link className="button button-outline" href={`/booking-confirmation?bookingId=${encodeURIComponent(booking.id)}`}>
            View receipt
          </Link>
          <Link className="button button-outline" href="/renter/bookings">
            My rentals
          </Link>
        </div>
      </header>

      {/* Progress telemetry card */}
      <div className="tracking-telemetry-grid">
        <div className="telemetry-card">
          <span className="telemetry-label">Simulated Trip Status</span>
          <strong className="telemetry-status-text">{tripStateLabel}</strong>
          <small>{currentPt.desc}</small>
        </div>
        <div className="telemetry-card">
          <span className="telemetry-label">Current Checkpoint</span>
          <strong>{currentPt.name}</strong>
          <small>{currentPt.lat.toFixed(4)}° N, {currentPt.lng.toFixed(4)}° E</small>
        </div>
        <div className="telemetry-card">
          <span className="telemetry-label">Simulated Speed</span>
          <strong>{isFinished ? "0 km/h" : "36 km/h"}</strong>
          <small>Addis Ababa Urban Corridor</small>
        </div>
        <div className="telemetry-card">
          <span className="telemetry-label">Estimated Progress</span>
          <div className="tracking-progress-bar">
            <div className="tracking-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <small>{progressPercent}% of simulated route completed</small>
        </div>
      </div>

      {/* Interactive Leaflet Tracking Map */}
      <div className="tracking-map-container">
        <div className="tracking-map" ref={mapContainerRef} />

        <div className="tracking-controls-overlay">
          <button
            className="button button-outline tracking-ctrl-btn"
            onClick={() => setIsPlaying((p) => !p)}
            type="button"
          >
            {isPlaying ? "⏸ Pause" : isFinished ? "🔁 Replay" : "▶ Resume"}
          </button>
          <button
            className="button button-outline tracking-ctrl-btn"
            onClick={() => {
              setCurrentIndex(0);
              setIsPlaying(true);
            }}
            type="button"
          >
            Reset
          </button>
          <div className="tracking-speed-buttons">
            <span>Speed:</span>
            {([1, 2, 4] as const).map((spd) => (
              <button
                key={spd}
                className={`speed-pill ${speedMultiplier === spd ? "active" : ""}`}
                onClick={() => setSpeedMultiplier(spd)}
                type="button"
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="tracking-legal-disclaimer">
        <strong>Simulation Disclaimer:</strong> Vehicle locations, routes, and motion are entirely pre-programmed
        demonstrations of frontend state management. Vehicles are not GPS-tracked, and no telemetry data is transmitted
        to external servers.
      </p>
    </div>
  );
}

