"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/demo/session";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut();
    const timer = setTimeout(() => {
      router.push("/");
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>👋</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Signed Out Successfully</h1>
      <p style={{ color: "var(--color-ink-muted, #64748b)", marginBottom: 24 }}>
        Your demo session has been cleared. Redirecting you to the landing page…
      </p>
      <Link
        href="/"
        className="button button-primary"
        style={{ display: "inline-block" }}
      >
        ← Return to home page now
      </Link>
    </div>
  );
}

