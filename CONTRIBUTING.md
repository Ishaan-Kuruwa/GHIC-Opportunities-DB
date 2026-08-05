# Contributing

How to add or edit an opportunity on this site. There are two ways to do it — pick the one that
matches who you are.

## Option A: Edit the Google Sheet (no coding required)

This is the intended path for most club members. Once the sheet is set up (see
`scripts/sheet-setup/README.md` if it isn't yet), the site's data lives in a Google Sheet with two
tabs: `Opportunities` and `Deadlines`.

1. Open the sheet and find the row you want to change (or add a new row at the bottom).
2. Every column header has a small note attached — hover the triangle in the corner of the header
   cell to see exactly what goes in that column and what values are allowed. Read it before you
   type; some columns only accept specific values (e.g. `clubStatus` must be exactly one of
   `not-started`, `planned`, `entered`, `placed`).
3. Adding a brand-new opportunity: add one row to `Opportunities` with a permanent `id` (lowercase,
   hyphens, no spaces — this becomes the page's URL and must never change once it's live). Then
   add one row per deadline to the `Deadlines` tab, using that same `id` to link them.
4. Editing an existing opportunity: just change the cell. No need to touch anything else.
5. Adding or changing a single deadline: edit the matching row in the `Deadlines` tab. `id` must
   exactly match an `id` in the `Opportunities` tab.
6. That's it — you don't need to touch GitHub, git, or any code. A GitHub Action runs every night,
   pulls the sheet, checks it, and publishes the result automatically. You can also trigger it
   immediately yourself: in the GitHub repo, go to the **Actions** tab, select **Sync Google
   Sheet**, and click **Run workflow**.
7. If something in the sheet doesn't pass validation (a bad rating number, a missing required
   field, a URL that isn't `https://`), the workflow fails loudly and **does not publish anything**
   — the live site stays exactly as it was. Check the failed run's log in the Actions tab; it
   lists every problem it found. Fix the sheet and re-run.

## Option B: Edit the repo directly (for anyone comfortable with git and JSON)

The site's data ultimately lives in `src/data/opportunities.json`. If you're editing the repo
directly instead of the sheet:

1. Follow the exact shape defined in `src/data/types.ts` for a top-level opportunity, and the
   `Deadline` type for each entry in its `deadlines` array (`label`, `date`, `estimated`,
   `precision`, `kind`, `estimatedFrom`).
2. Run `npm run check` before committing — it validates the whole file and prints every problem it
   finds. `npm run build` also runs this automatically and refuses to build on broken data.
3. Run `npm run dev` and look at the page you changed before pushing.
4. Commit and push to `main` (or open a pull request). The push alone triggers a rebuild and
   deploy — there's no separate deploy step.

### Important: don't lose your edit

If this project's Google Sheet is set up and in active use, it is the live source of truth for
opportunity and deadline data. **A direct edit to `opportunities.json` will be silently
overwritten** the next time the nightly sync workflow runs, unless you make the same change in the
sheet too. Option B is for structural changes (new fields, new validation rules) — for ordinary
content edits, use Option A.

## Content rules that apply either way

These come from `CLAUDE.md` and matter regardless of which option you use:

- **Never invent or "fix" a fact from memory.** Deadlines, eligibility, and cost come from the
  organizer's official site only. If something looks wrong, flag it (see `how-we-verify.md` for
  how) — don't guess or "correct" it yourself.
- **Never paste text from a competition's website.** Every description must be original writing.
  Copying their copy is a copyright problem, not just a style preference.
- Set `verified` to true only after someone has actually confirmed every detail in that row against
  the organizer's current site — not by assumption.
