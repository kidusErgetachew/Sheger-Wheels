import type { Metadata } from "next";
import "./globals.css";
import { ToastNotificationContainer } from "@/components/notification-center";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sheggar-wheels.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sheggar Wheels | Drive Addis",
    template: "%s | Sheggar Wheels",
  },
  description:
    "Explore a fictional peer-to-peer car rental marketplace demo made for Addis Ababa.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sheggar Wheels | Drive Addis",
    description:
      "Discover local demo cars and explore the Sheggar Wheels Addis Ababa marketplace.",
    url: siteUrl,
    siteName: "Sheggar Wheels",
    images: [
      {
        url: "/cars/hero-addis.jpg",
        width: 1200,
        height: 630,
        alt: "Sheggar Wheels - Addis Ababa Car Rental Marketplace",
      },
    ],
    type: "website",
    locale: "en_ET",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sheggar Wheels | Drive Addis",
    description:
      "Explore a fictional peer-to-peer car rental marketplace demo made for Addis Ababa.",
    images: ["/cars/hero-addis.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sw_theme_v1');var r=t==='dark'||(t!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';document.documentElement.setAttribute('data-theme',r);document.documentElement.style.colorScheme=r;}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <ToastNotificationContainer />
      </body>
    </html>
  );
}
