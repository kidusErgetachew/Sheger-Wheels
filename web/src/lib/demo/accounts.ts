import { readDemoCollection, writeDemoCollection } from "./storage";
import type { ActionResult, DemoUser } from "./types";

export type DemoRenterInput = {
  name: string;
  email: string;
};

export function registerDemoRenter(
  input: DemoRenterInput,
): ActionResult<DemoUser> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Demo account creation is only available in the browser." };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLocaleLowerCase();
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Enter a name between 2 and 80 characters." };
  }
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { ok: false, error: "Enter a valid demo email address." };
  }

  const storedUsers = readDemoCollection("users");
  if (!storedUsers.ok) return storedUsers;
  if (storedUsers.value.some((user) => user.email.toLocaleLowerCase() === email)) {
    return {
      ok: false,
      error: "A demo account already uses this email. Choose it above to sign in.",
    };
  }

  let id: string;
  try {
    id = `user-demo-${window.crypto.randomUUID()}`;
  } catch {
    return {
      ok: false,
      error: "This browser could not create a demo account. Try a supported browser.",
    };
  }

  const user: DemoUser = {
    id,
    name,
    email,
    phone: "",
    roles: ["renter"],
    status: "active",
    createdAt: new Date().toISOString(),
  };
  const saved = writeDemoCollection("users", [...storedUsers.value, user]);
  if (!saved.ok) return saved;
  return { ok: true, value: user };
}
