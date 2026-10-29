import type { MetadataRoute } from "next";
import { getPublicCars } from "@/lib/demo/catalog";
import { DEMO_DATA } from "@/lib/demo/seed";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sheggar-wheels.vercel.app";
  const now = new Date();

  const publicCars = getPublicCars(DEMO_DATA);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/cars`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const carRoutes: MetadataRoute.Sitemap = publicCars.map((car) => ({
    url: `${siteUrl}/cars/${car.id}`,
    lastModified: car.createdAt ? new Date(car.createdAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...carRoutes];
}
