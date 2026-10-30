import type { Metadata } from "next";
import "./globals.css";
import { ToastNotificationContainer } from "@/components/notification-center";

const siteUrl = "https://web-kqqt.vercel.app";
const socialImageUrl = new URL("/opengraph-image.jpg", siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Sheggar Wheels",
  title: "Sheggar Wheels | Drive Addis.",
  description: "Discover and rent quality cars in Addis Ababa.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sheggar Wheels | Drive Addis.",
    description: "Discover and rent quality cars in Addis Ababa.",
    url: siteUrl,
    siteName: "Sheggar Wheels",
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: "Sheggar Wheels: Drive Addis. Discover and rent quality cars in Addis Ababa.",
      },
    ],
    type: "website",
    locale: "en_ET",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sheggar Wheels | Drive Addis.",
    description: "Discover and rent quality cars in Addis Ababa.",
    images: [socialImageUrl],
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
