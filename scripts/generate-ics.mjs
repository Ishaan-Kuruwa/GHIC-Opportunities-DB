#!/usr/bin/env node
// Generates .ics (calendar) files from opportunities.json's deadlines, as
// static files under public/ -- Astro copies public/ verbatim into dist/, so
// these just become real downloadable files with no extra routing code.
//
// Only deadlines with precision: "day" get a file. A date only known as
// "late June" isn't a real date to put on someone's calendar -- see
// src/data/types.ts for what precision means.
//
// Plain hand-rolled ICS (RFC 5545), no library -- this is well under the
// "40-line generator" bar CLAUDE.md/SPEC.md set for this feature.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import astroConfig from "../astro.config.mjs";
import { slugify } from "../src/utils/slugify.mjs";

const dataPath = fileURLToPath(new URL("../src/data/opportunities.json", import.meta.url));
const outDir = fileURLToPath(new URL("../public/ics", import.meta.url));
const siteUrl = astroConfig.site.replace(/\/$/, "");

const { opportunities } = JSON.parse(readFileSync(dataPath, "utf-8"));

// RFC 5545 requires commas/semicolons/backslashes/newlines to be escaped in
// text values.
function escapeIcsText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

function addDays(isoDate, days) {
  const date = new Date(isoDate + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

function buildEvent(opportunity, deadline) {
  const startDate = deadline.date.replace(/-/g, "");
  const endDate = addDays(deadline.date, 1); // DTEND is exclusive for all-day events
  const uid = `${opportunity.id}--${slugify(deadline.label)}@${new URL(siteUrl).hostname}`;
  // Plain hyphen, not an em dash -- keeps the file pure ASCII, which is the
  // safest bet for older/less-common calendar apps that might mishandle
  // non-ASCII bytes in an .ics file.
  const summary = `${opportunity.name} - ${deadline.label}`;
  const url = `${siteUrl}/opportunity/${opportunity.id}`;

  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(`${deadline.kind === "deadline" ? "Deadline" : "Milestone"} for ${opportunity.name}. Details: ${url}`)}`,
    `URL:${url}`,
    "END:VEVENT",
  ].join("\r\n");
}

function wrapCalendar(veventBlocks) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GHIC Opportunities DB//Deadlines//EN",
    "CALSCALE:GREGORIAN",
    ...veventBlocks,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

mkdirSync(outDir, { recursive: true });

const allEvents = [];
let fileCount = 0;

for (const opportunity of opportunities) {
  for (const deadline of opportunity.deadlines) {
    if (deadline.precision !== "day") continue;

    const event = buildEvent(opportunity, deadline);
    allEvents.push(event);

    const filename = `${opportunity.id}--${slugify(deadline.label)}.ics`;
    writeFileSync(`${outDir}/${filename}`, wrapCalendar([event]), "utf-8");
    fileCount++;
  }
}

writeFileSync(`${outDir}/all-deadlines.ics`, wrapCalendar(allEvents), "utf-8");

console.log(`Generated ${fileCount} individual .ics files + 1 combined file (public/ics/).`);
