"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ADDIS_NEIGHBOURHOODS } from "@/lib/demo/catalog";
import { addIsoDays, localIsoDate } from "@/lib/dates";

export function HomeSearch() {
  const formRef = useRef<HTMLFormElement>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = formRef.current;
    if (!form) return;

    const start = form.elements.namedItem("startDate");
    const end = form.elements.namedItem("endDate");
    if (!(start instanceof HTMLInputElement) || !(end instanceof HTMLInputElement)) {
      event.preventDefault();
      return;
    }

    const earliest = localIsoDate();
    start.setCustomValidity("");
    end.setCustomValidity("");

    if (start.value < earliest) {
      start.setCustomValidity("Pick today or a future date.");
    } else if (end.value <= start.value) {
      end.setCustomValidity("The drop-off date must be after pick-up.");
    }

    if (!form.reportValidity()) event.preventDefault();
  }

  return (
    <form
      action="/cars"
      className="home-search"
      method="get"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <label className="search-field search-location">
        <span className="search-field-icon" aria-hidden="true">⌖</span>
        <span className="search-field-copy">
          <span className="search-label">Pick-up location</span>
          <select defaultValue="" name="neighbourhood">
            <option value="">All Addis Ababa</option>
            {ADDIS_NEIGHBOURHOODS.map((neighbourhood) => (
              <option key={neighbourhood}>{neighbourhood}</option>
            ))}
          </select>
        </span>
      </label>
      <label className="search-field">
        <span className="search-field-icon" aria-hidden="true">□</span>
        <span className="search-field-copy">
          <span className="search-label">Pick-up</span>
          <input
            name="startDate"
            onChange={(event) => {
              setStartDate(event.target.value);
              setEndDate((current) =>
                current > event.target.value
                  ? current
                  : addIsoDays(event.target.value, 1),
              );
            }}
            required
            type="date"
            value={startDate}
          />
        </span>
      </label>
      <label className="search-field search-dropoff">
        <span className="search-field-icon" aria-hidden="true">□</span>
        <span className="search-field-copy">
          <span className="search-label">Drop-off</span>
          <input
            min={startDate ? addIsoDays(startDate, 1) : undefined}
            name="endDate"
            onChange={(event) => {
              endDateFieldValidity(event.currentTarget, startDate);
              setEndDate(event.target.value);
            }}
            required
            type="date"
            value={endDate}
          />
        </span>
      </label>
      <button className="button button-primary search-submit" type="submit">
        Search cars <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}

function endDateFieldValidity(field: HTMLInputElement, startDate: string) {
  field.setCustomValidity(
    startDate && field.value && field.value <= startDate
      ? "The drop-off date must be after pick-up."
      : "",
  );
}
