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

const errors = [];

function isValidHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
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
}

if (errors.length > 0) {
  console.error(`opportunities.json failed validation (${errors.length} problem(s)):\n`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`opportunities.json OK (${opportunities.length} opportunities validated).`);
