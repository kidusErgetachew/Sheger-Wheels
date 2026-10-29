import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/" aria-label="Sheggar Wheels home">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span>
          <strong>Sheggar Wheels</strong>
          <small>Drive Addis</small>
        </span>
      </Link>
      <p>Fictional listings. A frontend-only demo. Made for Addis Ababa.</p>
      <span>© 2026 Sheggar Wheels</span>
    </footer>
  );
}
