# Annual audit checklist

The process behind the "we re-check every entry each August" promise made in
`src/content/guides/how-we-verify.md`. That guide explains the *why* to visitors; this file is the
*how* for whoever is doing the work. Run this every August, before fall deadlines open, and any
other time something looks stale.

This is a reusable template, not a one-time report — re-run it fresh each year rather than editing
last year's results in place.

## Before you start

- Get the current opportunity count from `src/data/opportunities.json`'s `meta.count` (or just
  count entries) so you know how many rows need checking.
- Split the list across however many members are helping — e.g. divide alphabetically by `id`, or
  by `category`, into roughly equal chunks. One afternoon is the target for the whole audit split
  across a normal-sized club.
- Decide whether you're editing through the Google Sheet or the repo directly — see
  `CONTRIBUTING.md` for both paths. Either way, the same fields get touched.

## Per opportunity, check all of the following against the organizer's own website

- [ ] **The link works.** `url` resolves and lands on a real, current page for this program (not a
  dead link, not a generic homepage redirect).
- [ ] **Every deadline is still accurate.** For each entry in that opportunity's `deadlines`
  array: is the `date` still correct? Has a `precision: "day"` guess turned out to be wrong, or can
  a `"month-part"`/`"month"` estimate now be upgraded to a confirmed day? If a date was
  `estimated: true` and is now confirmed, flip it to `false` and clear `estimatedFrom` (must be
  `null` when not estimated — `npm run check` enforces this).
- [ ] **Eligibility, cost, commitment, and format are still accurate**, in the organizer's current
  language for the current cycle — not carried over from a prior year.
- [ ] **The description is still true to what the program actually is** (it does not need to be
  rewritten if nothing changed — just confirmed).
- [ ] **Update `lastVerified`** to today's date (YYYY-MM-DD), regardless of whether anything else
  changed.
- [ ] **Update `confidence` and `verified`.** Set `verified: true` only once every item above has
  actually been checked against the official site this cycle — not by assumption because it was
  verified last year.

## If you find something wrong but can't fix it immediately

Don't leave it silently wrong. Either fix it on the spot if you're confident in the correct value
from the official source, or [open an issue on
GitHub](https://github.com/Ishaan-Kuruwa/GHIC-Opportunities-DB/issues) describing exactly what's
outdated and what the organizer's site actually says now, so someone else can pick it up.

## When you're done

- Confirm `npm run check` still passes after all the edits (it runs automatically on build either
  way, but check locally first to catch problems early).
- Update `meta.compiled` in `opportunities.json` (or the sheet's equivalent) to reflect the audit
  date, since that's what `how-we-verify.md` references as "this site's data was compiled and
  verified in [month/year]."
