"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { registerDemoRenter } from "@/lib/demo/accounts";
import { DEMO_DATA } from "@/lib/demo/seed";
import {
  DEMO_DATA_CHANGE_EVENT,
  initializeDemoData,
  readDemoCollection,
} from "@/lib/demo/storage";
import { safeReturnPath, signInAsDemo } from "@/lib/demo/session";
import type { DemoUser } from "@/lib/demo/types";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [users, setUsers] = useState(DEMO_DATA.users);

  useEffect(() => {
    function refreshUsers() {
      const result = readDemoCollection("users");
      if (result.ok) setUsers(result.value);
      else setError(result.error);
    }
    refreshUsers();
    window.addEventListener(DEMO_DATA_CHANGE_EVENT, refreshUsers);
    window.addEventListener("storage", refreshUsers);
    return () => {
      window.removeEventListener(DEMO_DATA_CHANGE_EVENT, refreshUsers);
      window.removeEventListener("storage", refreshUsers);
    };
  }, []);

  function finishSignIn(userId: string) {
    const result = signInAsDemo(userId);
    if (!result.ok) {
      setError(result.error);
      setPendingUser(null);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.push(safeReturnPath(next));
  }

  function chooseAccount(user: DemoUser) {
    setError("");
    setNotice("");
    setPendingUser(user.id);

    const initialized = initializeDemoData();
    if (!initialized.ok) {
      setError(initialized.error);
      setPendingUser(null);
      return;
    }

    if (initialized.recovered) {
      setNotice("Damaged demo data was restored from the fictional seed records.");
    }

    finishSignIn(user.id);
  }

  function createRenterAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPendingUser("creating-account");

    const initialized = initializeDemoData();
    if (!initialized.ok) {
      setError(initialized.error);
      setPendingUser(null);
      return;
    }
    if (initialized.recovered) {
      setNotice("Damaged demo data was restored from the fictional seed records.");
    }

    const form = new FormData(event.currentTarget);
    const created = registerDemoRenter({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
    });
    if (!created.ok) {
      setError(created.error);
      setPendingUser(null);
      return;
    }
    finishSignIn(created.value.id);
  }

  return (
    <main className="signin-shell">
      <div className="signin-card">
        <Link className="brand signin-brand" href="/" aria-label="Return to Sheggar Wheels home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span><strong>Sheggar Wheels</strong><small>Drive Addis</small></span>
        </Link>
        <p className="eyebrow">A clearly labelled demo</p>
        <h1>Choose a demo account.</h1>
        <p className="signin-intro">
          No password is collected or stored. Select a fictional profile to
          explore the renter, owner, or admin experience.
        </p>

        {error && <p className="form-message form-error" role="alert">{error}</p>}
        {notice && <p className="form-message form-notice" role="status">{notice}</p>}

        <div className="account-list" aria-label="Available fictional demo accounts">
          {users.map((user) => (
            <button
              className="account-option"
              disabled={pendingUser !== null || user.status !== "active"}
              key={user.id}
              onClick={() => chooseAccount(user)}
              type="button"
            >
              <span className="account-avatar" aria-hidden="true">
                {user.name.slice(0, 1)}
              </span>
              <span className="account-copy">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </span>
              <span className="account-roles">
                {user.status === "suspended"
                  ? "Suspended · sign-in unavailable"
                  : user.roles.includes("admin")
                  ? "Seeded demo admin"
                  : user.roles.join(" · ")}
              </span>
              <span className="account-arrow" aria-hidden="true">
                {pendingUser === user.id ? "…" : "↗"}
              </span>
            </button>
          ))}
        </div>

        <div className="signin-signup">
          <button
            className="text-link"
            aria-expanded={showSignup}
            onClick={() => {
              setShowSignup((open) => !open);
              setError("");
              setNotice("");
            }}
            type="button"
          >
            {showSignup ? "Use a seeded demo account" : "Create a demo renter account"}
          </button>
          {showSignup && (
            <form className="signin-signup-form" onSubmit={createRenterAccount}>
              <p className="signin-signup-note">
                New accounts receive the renter role only. Use fictional details;
                this demo does not verify email or collect passwords.
              </p>
              <label htmlFor="demo-name">Name</label>
              <input
                autoComplete="name"
                id="demo-name"
                maxLength={80}
                minLength={2}
                name="name"
                required
              />
              <label htmlFor="demo-email">Demo email</label>
              <input
                autoComplete="email"
                id="demo-email"
                maxLength={254}
                name="email"
                required
                type="email"
              />
              <button
                className="button button-primary"
                disabled={pendingUser !== null}
                type="submit"
              >
                {pendingUser === "creating-account" ? "Creating account…" : "Create renter account"}
              </button>
            </form>
          )}
        </div>

        <p className="demo-safety-note">
          This frontend-only demo is not production authentication. Do not enter
          real personal information, passwords, or payment details.
        </p>
        <Link className="signin-back" href="/">← Back to Sheggar Wheels</Link>
      </div>
    </main>
  );
}
