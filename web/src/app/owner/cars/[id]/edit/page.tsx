"use client";

import { use, useSyncExternalStore } from "react";
import Link from "next/link";
import { ProtectedDemo } from "@/components/protected-demo";
import { useCurrentDemoSession } from "@/lib/demo/session-store";
import { readDemoCollection, DEMO_DATA_CHANGE_EVENT } from "@/lib/demo/storage";
import { OwnerCarForm } from "@/components/owner/owner-car-form";
import type { DemoCar } from "@/lib/demo/types";

function subscribe(onChange: () => void) {
  window.addEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DEMO_DATA_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  const cars = readDemoCollection("cars");
  return JSON.stringify(cars.ok ? cars.value : []);
}

export default function OwnerCarEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const carId = resolvedParams.id;

  return (
    <ProtectedDemo role="owner">
      <OwnerCarEditContent carId={carId} />
    </ProtectedDemo>
  );
}

function OwnerCarEditContent({ carId }: { carId: string }) {
  const { user } = useCurrentDemoSession();
  const rawCars = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const cars = JSON.parse(rawCars) as DemoCar[];
  const car = cars.find((c) => c.id === carId);

  if (!user) return null;

  if (!car) {
    return (
      <main className="dashboard-content" style={{ padding: "40px 24px", maxWidth: 800, margin: "0 auto" }}>
        <p className="dashboard-alert" role="alert">Vehicle &quot;{carId}&quot; was not found.</p>
        <Link href="/owner/listings" className="button button-outline">← Back to listings</Link>
      </main>
    );
  }

  // Cross-owner check
  if (car.ownerId !== user.id && !user.roles.includes("admin")) {
    return (
      <main className="dashboard-content" style={{ padding: "40px 24px", maxWidth: 800, margin: "0 auto" }}>
        <div className="dashboard-alert" role="alert">
          <h2>Ownership Verification Failed</h2>
          <p>You cannot edit a vehicle listing belonging to another owner account.</p>
        </div>
        <Link href="/owner/listings" className="button button-outline">← Back to my listings</Link>
      </main>
    );
  }

  return (
    <main className="dashboard-content" style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/owner/listings" style={{ color: "var(--color-primary, #059669)", textDecoration: "none" }}>
          ← Back to fleet listings
        </Link>
      </div>
      <OwnerCarForm
        user={user}
        existingCar={car}
        targetCarId={carId}
        isEdit={true}
      />
    </main>
  );
}

