import test from "node:test";
import assert from "node:assert/strict";
import { setupMockBrowserEnvironment } from "./setup-mock-browser";
import { validateCarInput } from "../src/lib/demo/car-actions";
import { registerDemoRenter } from "../src/lib/demo/accounts";
import { initializeDemoData, readDemoCollection } from "../src/lib/demo/storage";

const env = setupMockBrowserEnvironment();

test.beforeEach(() => {
  env.reset();
  initializeDemoData();
});

test("Car Validation: Rejects invalid vehicle inputs", () => {
  // Empty make/model
  const emptyResult = validateCarInput({});
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.errors.make);
  assert.ok(emptyResult.errors.model);
  assert.ok(emptyResult.errors.year);
  assert.ok(emptyResult.errors.vehicleType);
  assert.ok(emptyResult.errors.transmission);
  assert.ok(emptyResult.errors.seats);
  assert.ok(emptyResult.errors.neighbourhood);
  assert.ok(emptyResult.errors.pricePerDay);
  assert.ok(emptyResult.errors.description);
  assert.ok(emptyResult.errors.photos);

  // Invalid year out of range
  const oldYear = validateCarInput({
    make: "Toyota",
    model: "Corolla",
    year: 1995,
  });
  assert.equal(oldYear.valid, false);
  assert.match(oldYear.errors.year || "", /between 2000 and 2027/);

  // Invalid price out of range (< 500 or > 50000)
  const lowPrice = validateCarInput({
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    pricePerDay: 100,
  });
  assert.equal(lowPrice.valid, false);
  assert.match(lowPrice.errors.pricePerDay || "", /between 500 and 50,000 ETB/);

  const highPrice = validateCarInput({
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    pricePerDay: 80000,
  });
  assert.equal(highPrice.valid, false);
  assert.match(highPrice.errors.pricePerDay || "", /between 500 and 50,000 ETB/);

  // Valid car input
  const valid = validateCarInput({
    make: "Toyota",
    model: "bZ4X",
    year: 2024,
    vehicleType: "SUV",
    transmission: "Automatic",
    seats: 5,
    neighbourhood: "Bole",
    pricePerDay: 5000,
    photos: ["/cars/TOYOTA Bz4x 2023.jpg"],
    description: "Fully electric modern crossover with clean interior and long range.",
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test("Account Registration: Duplicate email check and renter role enforcement", () => {
  // Existing email from seed
  const duplicate = registerDemoRenter({
    name: "New Kidus",
    email: "kidus@example.test",
  });
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.error, /already uses this email/i);

  // Invalid email format
  const invalidEmail = registerDemoRenter({
    name: "Valid Name",
    email: "not-an-email",
  });
  assert.equal(invalidEmail.ok, false);
  assert.match(invalidEmail.error, /valid demo email address/i);

  // Short name
  const shortName = registerDemoRenter({
    name: "A",
    email: "unique@example.test",
  });
  assert.equal(shortName.ok, false);
  assert.match(shortName.error, /between 2 and 80 characters/i);

  // Successful new renter registration
  const success = registerDemoRenter({
    name: "Almaz Ayana",
    email: "almaz@example.test",
  });
  assert.equal(success.ok, true);
  if (success.ok) {
    assert.equal(success.value.name, "Almaz Ayana");
    assert.equal(success.value.email, "almaz@example.test");
    assert.deepEqual(success.value.roles, ["renter"]); // Must strictly get renter role only
    assert.equal(success.value.status, "active");
  }

  // Verify persistence in storage
  const usersResult = readDemoCollection("users");
  assert.equal(usersResult.ok, true);
  if (usersResult.ok) {
    const found = usersResult.value.find((u) => u.email === "almaz@example.test");
    assert.ok(found);
  }
});
