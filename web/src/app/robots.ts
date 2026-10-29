import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sheggar-wheels.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/cars"],
      disallow: [
        "/signin",
        "/signup",
        "/renter",
        "/renter/*",
        "/booking",
        "/booking/*",
        "/booking-confirmation",
        "/checkout",
        "/owner",
        "/owner/*",
        "/admin",
        "/admin/*",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
