"use client";

import { useTheme } from "@/lib/demo/theme";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  variant?: "header" | "dashboard" | "minimal";
  showLabel?: boolean;
  className?: string;
};

export function ThemeToggle({
  variant = "header",
  showLabel = false,
  className = "",
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className={`theme-toggle-btn theme-toggle-${variant} ${className}`}
      onClick={() => toggleTheme()}
      title={label}
      type="button"
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? (
          /* Sun icon when in dark mode (clicking goes light) */
          <svg
            className="theme-sun-svg"
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        ) : (
          /* Moon icon when in light mode (clicking goes dark) */
          <svg
            className="theme-moon-svg"
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}
      </span>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}

