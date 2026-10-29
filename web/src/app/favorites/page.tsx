import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FavoritesView } from "@/components/favorites-view";

export const metadata: Metadata = {
  title: "Saved Cars · Sheggar Wheels",
  description: "View and manage your saved vehicles for your upcoming trips in Addis Ababa.",
  alternates: {
    canonical: "/favorites",
  },
};

export default function FavoritesPage() {
  return (
    <>
      <SiteHeader />
      <FavoritesView />
      <SiteFooter />
    </>
  );
}
