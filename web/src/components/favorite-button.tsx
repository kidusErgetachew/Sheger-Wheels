"use client";

import { useFavorites } from "@/lib/demo/favorites";
import { useState } from "react";

type FavoriteButtonProps = {
  carId: string;
  carName?: string;
  variant?: "card" | "detail" | "card-full";
  className?: string;
};

export function FavoriteButton({
  carId,
  carName = "car",
  variant = "card",
  className = "",
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [animating, setAnimating] = useState(false);
  const active = isFavorite(carId);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    toggleFavorite(carId);
    setTimeout(() => setAnimating(false), 450);
  }

  const heartIcon = (
    <svg
      aria-hidden="true"
      className={`favorite-heart-svg ${active ? "is-active" : ""} ${animating ? "is-animating" : ""}`}
      fill={active ? "currentColor" : "none"}
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={active ? "0" : "2"}
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );

  if (variant === "card") {
    return (
      <button
        aria-label={active ? `Remove ${carName} from favorites` : `Save ${carName} to favorites`}
        aria-pressed={active}
        className={`favorite-btn-card ${active ? "active" : ""} ${className}`}
        onClick={handleClick}
        title={active ? "Saved to favorites" : "Save to favorites"}
        type="button"
      >
        {heartIcon}
      </button>
    );
  }

  if (variant === "card-full") {
    return (
      <button
        aria-label={active ? `Remove ${carName} from favorites` : `Save ${carName} to favorites`}
        aria-pressed={active}
        className={`button favorite-btn-full ${active ? "active" : ""} ${className}`}
        onClick={handleClick}
        type="button"
      >
        {heartIcon}
        <span>{active ? "Saved in your favorites" : "Save vehicle for later"}</span>
      </button>
    );
  }

  return (
    <button
      aria-label={active ? `Remove ${carName} from favorites` : `Save ${carName} to favorites`}
      aria-pressed={active}
      className={`button favorite-btn-detail ${active ? "active" : ""} ${className}`}
      onClick={handleClick}
      type="button"
    >
      {heartIcon}
      <span>{active ? "Saved to favorites" : "Save to favorites"}</span>
    </button>
  );
}
