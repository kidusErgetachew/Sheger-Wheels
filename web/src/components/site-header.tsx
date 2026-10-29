"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/demo/session";
import { useCurrentDemoSession } from "@/lib/demo/session-store";
import { useFavorites } from "@/lib/demo/favorites";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";

export function SiteHeader() {
  const router = useRouter();
  const { user, error: sessionError } = useCurrentDemoSession();
  const { count: favoriteCount } = useFavorites();
  const name = user?.name ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  function handleSignOut() {
    const result = signOut();
    if (!result.ok) {
      setSignOutError(result.error);
      return;
    }
    setSignOutError("");
    router.push("/");
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <Link
          className="brand"
          href="/"
          aria-label="Sheggar Wheels home"
          onClick={closeMenu}
        >
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>
            <strong>Sheggar Wheels</strong>
            <small>Drive Addis</small>
          </span>
        </Link>
        <nav className={`main-nav${menuOpen ? " main-nav-open" : ""}`} aria-label="Main navigation">
          <Link href="/cars" onClick={closeMenu}>Browse cars</Link>
          <Link className="nav-favorites-link" href="/favorites" onClick={closeMenu}>
            <svg
              aria-hidden="true"
              className="nav-heart-svg"
              fill={favoriteCount > 0 ? "currentColor" : "none"}
              height="14"
              stroke="currentColor"
              strokeWidth={favoriteCount > 0 ? "0" : "2"}
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span>Saved</span>
            {favoriteCount > 0 && (
              <span className="nav-favorites-badge">
                {favoriteCount}
              </span>
            )}
          </Link>
          <Link href="/#how-it-works" onClick={closeMenu}>How it works</Link>
          <Link href="/#about" onClick={closeMenu}>About</Link>
          {user?.roles.includes("admin") && (
            <Link href="/admin" onClick={closeMenu}>Admin dashboard</Link>
          )}
          {user?.roles.includes("owner") && (
            <Link href="/owner" onClick={closeMenu}>Owner dashboard</Link>
          )}
          {user?.roles.includes("renter") && (
            <Link href="/renter" onClick={closeMenu}>My rentals</Link>
          )}
          <div className="nav-mobile-theme">
            <ThemeToggle variant="header" showLabel={true} />
          </div>
        </nav>
        <div className="header-actions">
          <Link
            className={`header-saved-btn ${favoriteCount > 0 ? "has-saved" : ""}`}
            href="/favorites"
            onClick={closeMenu}
            title={favoriteCount > 0 ? `${favoriteCount} saved cars` : "Saved cars"}
          >
            <svg
              aria-hidden="true"
              className="header-saved-svg"
              fill={favoriteCount > 0 ? "currentColor" : "none"}
              height="16"
              stroke="currentColor"
              strokeWidth={favoriteCount > 0 ? "0" : "2"}
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span className="header-saved-text">Saved</span>
            {favoriteCount > 0 && (
              <span className="header-saved-badge">
                {favoriteCount}
              </span>
            )}
          </Link>
          <NotificationCenter />
          <ThemeToggle variant="header" />
          <span className="demo-indicator"><span /> Fictional demo</span>
          {name ? (
            <button className="button button-outline header-session" onClick={handleSignOut} type="button">
              {name.split(" ")[0]} · Sign out
            </button>
          ) : (
            <Link className="button button-outline" href="/signin" onClick={closeMenu}>
              Sign in
            </Link>
          )}
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      {(sessionError || signOutError) && (
        <p className="header-session-error" role="status">{signOutError || sessionError}</p>
      )}
    </>
  );
}
