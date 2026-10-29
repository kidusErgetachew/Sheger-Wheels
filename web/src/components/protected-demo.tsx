"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasRole, safeReturnPath } from "@/lib/demo/session";
import { useCurrentDemoSession } from "@/lib/demo/session-store";
import type { UserRole } from "@/lib/demo/types";

export function ProtectedDemo({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { ready, user, error } = useCurrentDemoSession();

  useEffect(() => {
    if (ready && !error && !user) {
      const next = safeReturnPath(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );
      router.replace(`/signin?next=${encodeURIComponent(next)}`);
    }
  }, [error, ready, router, user]);

  if (!ready) {
    return <p className="protected-demo-state" role="status">Checking demo session…</p>;
  }
  if (error) {
    return (
      <main className="protected-demo-state" role="alert">
        <h1>Demo session unavailable</h1>
        <p>{error}</p>
        <Link className="button button-primary" href="/signin">Return to demo sign in</Link>
      </main>
    );
  }
  if (!user) {
    return <p className="protected-demo-state" role="status">Redirecting to demo sign in…</p>;
  }
  if (!hasRole(user, role)) {
    return (
      <main className="protected-demo-state" role="alert">
        <h1>This demo area is restricted</h1>
        <p>Sign in with a demo account that has the {role} role to continue.</p>
        <Link className="button button-outline" href="/">Return home</Link>
      </main>
    );
  }
  return children;
}
