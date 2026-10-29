"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoCar } from "@/lib/demo/types";
import { formatEtb } from "@/lib/format";

type CarMapProps = {
  car: DemoCar;
  className?: string;
};

// Addis Ababa landmark lookup per neighbourhood for rich fallback
const NEIGHBOURHOOD_LANDMARKS: Record<string, { landmark: string; transit: string; subcity: string }> = {
  Bole: {
    landmark: "Near Edna Mall & Bole Medhanialem Cathedral, Cameroon Street",
    transit: "Bole Airport Taxi Stand / Edna Mall Minibus Station",
    subcity: "Bole Sub-City",
  },
  Piazza: {
    landmark: "Near St. George Cathedral & De Gaulle Square, Cunningham St",
    transit: "Piazza Light Rail Station / Minibus Terminal",
    subcity: "Arada Sub-City",
  },
  Kazanchis: {
    landmark: "Near UNECA Compound & Intercontinental Hotel, Menelik II Ave",
    transit: "Kazanchis Taxi Rank / Light Rail Stadium Station",
    subcity: "Kirkos Sub-City",
  },
  CMC: {
    landmark: "Near CMC Michael Church & Civil Service University",
    transit: "CMC Light Rail Line 1 / Meri Minibus Stop",
    subcity: "Yeka Sub-City",
  },
  Sarbet: {
    landmark: "Near African Union Headquarters & Karl Square",
    transit: "Sarbet Roundabout Bus / Minibus Terminal",
    subcity: "Kirkos Sub-City",
  },
  Mexico: {
    landmark: "Near Mexico Square & Federal Police HQ",
    transit: "Mexico Light Rail Station / Stadium Bus Terminal",
    subcity: "Lideta Sub-City",
  },
  Gerji: {
    landmark: "Near Unity University & Imperial Hotel Area",
    transit: "Gerji Mebrat Hayl Minibus Stop",
    subcity: "Bole Sub-City",
  },
};

export function CarMap({ car, className = "" }: CarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [viewMode, setViewMode] = useState<"map" | "fallback">("map");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const neighbourhoodInfo = NEIGHBOURHOOD_LANDMARKS[car.neighbourhood] || {
    landmark: `Central ${car.neighbourhood} area near main avenue`,
    transit: `${car.neighbourhood} Minibus Station`,
    subcity: `${car.neighbourhood} District, Addis Ababa`,
  };

  useEffect(() => {
    let isCancelled = false;

    // Load leaflet dynamically on client side
    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (viewMode !== "map") return;

      try {
        const L = (await import("leaflet")).default;
        if (isCancelled || !mapContainerRef.current) return;

        // Clean up previous instance if exists
        if (mapInstanceRef.current) {
          (mapInstanceRef.current as { remove: () => void }).remove();
          mapInstanceRef.current = null;
        }

        const lat = Number.isFinite(car.latitude) ? car.latitude : 9.0107;
        const lng = Number.isFinite(car.longitude) ? car.longitude : 38.7612;

        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 14,
          scrollWheelZoom: false,
        });
        mapInstanceRef.current = map;

        // OpenStreetMap Tile Provider
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Custom styled marker
        const customIcon = L.divIcon({
          className: "leaflet-car-marker-container",
          html: `
            <div class="leaflet-car-pin">
              <span class="leaflet-pin-icon">🚗</span>
              <span class="leaflet-pin-label">${car.neighbourhood}</span>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 42],
          popupAnchor: [0, -38],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

        const popupContent = `
          <div class="leaflet-car-popup">
            <strong>${car.year} ${car.make} ${car.model}</strong>
            <p>${car.neighbourhood}, Addis Ababa</p>
            <span class="leaflet-popup-price">${formatEtb(car.pricePerDay)} / day</span>
            <small>*Sample pickup coordinates</small>
          </div>
        `;

        marker.bindPopup(popupContent).openPopup();
        setMapLoaded(true);
      } catch (err) {
        console.error("Leaflet map initialization error:", err);
        setMapError(true);
        setViewMode("fallback");
      }
    }

    if (viewMode === "map") {
      initMap();
    }

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        try {
          (mapInstanceRef.current as { remove: () => void }).remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [car, viewMode]);

  return (
    <section aria-labelledby="pickup-location-heading" className={`car-map-card ${className}`}>
      {/* Include Leaflet CSS via head link */}
      <link
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        rel="stylesheet"
      />

      <div className="car-map-header">
        <div>
          <p className="eyebrow">PICK-UP LOCATION</p>
          <h2 id="pickup-location-heading">Around {car.neighbourhood}, Addis Ababa</h2>
        </div>
        <div className="car-map-view-toggle">
          <button
            aria-pressed={viewMode === "map"}
            className={`view-toggle-btn ${viewMode === "map" ? "active" : ""}`}
            onClick={() => setViewMode("map")}
            type="button"
          >
            🗺️ Interactive Map
          </button>
          <button
            aria-pressed={viewMode === "fallback"}
            className={`view-toggle-btn ${viewMode === "fallback" ? "active" : ""}`}
            onClick={() => setViewMode("fallback")}
            type="button"
          >
            📋 Address Details
          </button>
        </div>
      </div>

      {viewMode === "map" && !mapError ? (
        <div className="car-map-wrapper">
          <div className="car-map-container" ref={mapContainerRef} />
          {!mapLoaded && (
            <div className="car-map-loading">
              <span>Loading Leaflet map tiles for Addis Ababa…</span>
            </div>
          )}
          <div className="car-map-footer">
            <span className="car-map-disclaimer">
              📍 <strong>Seeded sample coordinates:</strong> {car.latitude.toFixed(4)}° N,{" "}
              {car.longitude.toFixed(4)}° E. Vehicles are not GPS-tracked.
            </span>
          </div>
        </div>
      ) : (
        /* Non-map fallback view */
        <div className="car-map-fallback" role="region" aria-label="Non-map neighbourhood information">
          <div className="fallback-grid">
            <div className="fallback-col">
              <span className="fallback-label">Sub-City & District</span>
              <strong>{neighbourhoodInfo.subcity}</strong>
            </div>
            <div className="fallback-col">
              <span className="fallback-label">Prominent Landmark</span>
              <p>{neighbourhoodInfo.landmark}</p>
            </div>
            <div className="fallback-col">
              <span className="fallback-label">Public Transit Access</span>
              <p>{neighbourhoodInfo.transit}</p>
            </div>
            <div className="fallback-col">
              <span className="fallback-label">Sample Coordinates</span>
              <p className="fallback-mono">{car.latitude.toFixed(4)}° N, {car.longitude.toFixed(4)}° E</p>
            </div>
          </div>
          <p className="fallback-disclaimer">
            *Non-map address view provided as an accessible fallback. Car locations are fictional demo coordinates.
          </p>
        </div>
      )}
    </section>
  );
}

