// Plain string helper, no Node/browser-specific APIs -- shared as-is by
// scripts/generate-ics.mjs (which writes files named with this) and
// src/pages/calendar.astro (which links to those exact filenames). Keeping it
// in one place means the link and the file it points to can never drift
// apart.
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
