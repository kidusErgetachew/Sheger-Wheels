import test from "node:test";
import assert from "node:assert/strict";
import { setupMockBrowserEnvironment } from "./setup-mock-browser";
import {
  getFavorites,
  isFavorite,
  toggleFavorite,
  clearFavorites,
  FAVORITES_STORAGE_KEY,
} from "../src/lib/demo/favorites";

test("Favorites System: toggling, persistence, and querying", () => {
  const env = setupMockBrowserEnvironment();

  // 1. Initial state is empty
  assert.deepEqual(getFavorites(), []);
  assert.equal(isFavorite("car-mercedes-glc"), false);

  // 2. Add Mercedes GLC to favorites
  const addResult = toggleFavorite("car-mercedes-glc");
  assert.equal(addResult.isFavorite, true);
  assert.deepEqual(addResult.favorites, ["car-mercedes-glc"]);
  assert.equal(isFavorite("car-mercedes-glc"), true);

  // 3. Add Toyota RAV4 to favorites
  const addSecond = toggleFavorite("car-toyota-rav4");
  assert.equal(addSecond.isFavorite, true);
  assert.deepEqual(addSecond.favorites, ["car-mercedes-glc", "car-toyota-rav4"]);
  assert.equal(isFavorite("car-toyota-rav4"), true);
  assert.equal(isFavorite("car-mercedes-glc"), true);

  // 4. Verify storage persistence
  const storedJson = env.localStorage.getItem(FAVORITES_STORAGE_KEY);
  assert.ok(storedJson);
  assert.deepEqual(JSON.parse(storedJson), ["car-mercedes-glc", "car-toyota-rav4"]);

  // 5. Remove Mercedes GLC
  const removeResult = toggleFavorite("car-mercedes-glc");
  assert.equal(removeResult.isFavorite, false);
  assert.deepEqual(removeResult.favorites, ["car-toyota-rav4"]);
  assert.equal(isFavorite("car-mercedes-glc"), false);
  assert.equal(isFavorite("car-toyota-rav4"), true);

  // 6. Clear all favorites
  clearFavorites();
  assert.deepEqual(getFavorites(), []);
  assert.equal(isFavorite("car-toyota-rav4"), false);

  env.reset();
});

test("Favorites System: resilience to malformed storage", () => {
  const env = setupMockBrowserEnvironment();

  // Malformed JSON string in storage
  env.localStorage.setItem(FAVORITES_STORAGE_KEY, "not-valid-json{{{");
  assert.deepEqual(getFavorites(), []);
  assert.equal(isFavorite("car-mercedes-glc"), false);

  // Non-array stored
  env.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ not: "an array" }));
  assert.deepEqual(getFavorites(), []);

  // Array with bad values filtered cleanly
  env.localStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify(["valid-car-id", null, "", 123, "another-car-id"]),
  );
  assert.deepEqual(getFavorites(), ["valid-car-id", "another-car-id"]);

  env.reset();
});
