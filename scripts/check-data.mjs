#!/usr/bin/env node
// Validates src/data/opportunities.json against the shape described in
// src/data/types.ts. If you change one, change the other.
//
// No dependencies on purpose — see CLAUDE.md ("prefer zero dependencies").

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dataPath = fileURLToPath(
  new URL("../src/data/opportunities.json", import.meta.url),
);

const RATING_FIELDS = [
  "effort",
  "competitiveness",
  "skills",
  "prestige",
  "clubFit",
  "accessibility",
];

const DEADLINE_PRECISIONS = ["day", "month-part", "month"];
const DEADLINE_KINDS = ["deadline", "milestone"];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];

function isValidHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isValidIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

let raw;
try {
  raw = readFileSync(dataPath, "utf-8");
} catch (err) {
  console.error(`Could not read ${dataPath}: ${err.message}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error(`opportunities.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

const opportunities = Array.isArray(data.opportunities)
  ? data.opportunities
  : [];

if (!Array.isArray(data.opportunities)) {
  errors.push('Top-level "opportunities" must be an array.');
}

const seenIds = new Map();

for (const [index, opportunity] of opportunities.entries()) {
  const label = opportunity && opportunity.id
    ? `opportunity "${opportunity.id}"`
    : `opportunity at index ${index}`;

  if (!opportunity || typeof opportunity.id !== "string" || opportunity.id.trim() === "") {
    errors.push(`${label}: missing or empty "id".`);
  } else {
    const firstIndex = seenIds.get(opportunity.id);
    if (firstIndex !== undefined) {
      errors.push(
        `${label}: duplicate "id" (also used at index ${firstIndex}).`,
      );
    } else {
      seenIds.set(opportunity.id, index);
    }
  }

  const ratings = opportunity && opportunity.ratings;
  for (const field of RATING_FIELDS) {
    const value = ratings ? ratings[field] : undefined;
    const isValidRating =
      typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10;
    if (!isValidRating) {
      errors.push(
        `${label}: ratings.${field} must be an integer 1-10 (got ${JSON.stringify(value)}).`,
      );
    }
  }

  const url = opportunity && opportunity.url;
  const isValidUrl = url === "" || (typeof url === "string" && isValidHttpsUrl(url));
  if (!isValidUrl) {
    errors.push(
      `${label}: "url" must be an empty string or a valid https:// URL (got ${JSON.stringify(url)}).`,
    );
  }

  const deadlines = opportunity && opportunity.deadlines;
  if (!Array.isArray(deadlines)) {
    errors.push(`${label}: "deadlines" must be an array (use [] if there are none).`);
  } else {
    deadlines.forEach((deadline, deadlineIndex) => {
      const deadlineLabel = `${label}, deadlines[${deadlineIndex}]`;

      if (!deadline || typeof deadline.label !== "string" || deadline.label.trim() === "") {
        errors.push(`${deadlineLabel}: missing or empty "label".`);
      }

      if (!deadline || !isValidIsoDate(deadline.date)) {
        errors.push(
          `${deadlineLabel}: "date" must be a real ISO date YYYY-MM-DD (got ${JSON.stringify(deadline && deadline.date)}).`,
        );
      }

      if (!deadline || typeof deadline.estimated !== "boolean") {
        errors.push(`${deadlineLabel}: "estimated" must be a boolean.`);
      }

      if (!deadline || !DEADLINE_PRECISIONS.includes(deadline.precision)) {
        errors.push(
          `${deadlineLabel}: "precision" must be one of ${JSON.stringify(DEADLINE_PRECISIONS)} (got ${JSON.stringify(deadline && deadline.precision)}).`,
        );
      }

      if (!deadline || !DEADLINE_KINDS.includes(deadline.kind)) {
        errors.push(
          `${deadlineLabel}: "kind" must be one of ${JSON.stringify(DEADLINE_KINDS)} (got ${JSON.stringify(deadline && deadline.kind)}).`,
        );
      }

      if (deadline && typeof deadline.estimated === "boolean") {
        const estimatedFrom = deadline.estimatedFrom;
        if (deadline.estimated) {
          if (typeof estimatedFrom !== "string" || estimatedFrom.trim() === "") {
            errors.push(
              `${deadlineLabel}: "estimated" is true, so "estimatedFrom" must be a non-empty string explaining why (got ${JSON.stringify(estimatedFrom)}).`,
            );
          }
        } else if (estimatedFrom !== null) {
          errors.push(
            `${deadlineLabel}: "estimated" is false, so "estimatedFrom" must be null (got ${JSON.stringify(estimatedFrom)}).`,
          );
        }
      }
    });
  }
}

if (errors.length > 0) {
  console.error(`opportunities.json failed validation (${errors.length} problem(s)):\n`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`opportunities.json OK (${opportunities.length} opportunities validated).`);
