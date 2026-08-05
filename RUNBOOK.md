# Runbook

Operational reference for whoever is running this site — deploys, credentials, and what to do
when something breaks. This repo is **public**, so this file deliberately says *what* access
exists and *where to find it*, never *who* currently holds it or any actual credential. The
club's own (non-public) records are where names, emails, and passwords belong.

## How deploys work

There is no manual deploy step. This site is built with Astro and deployed via **Cloudflare
Workers Builds** (configured in `wrangler.jsonc`), which is connected directly to this GitHub
repo. Every push to `main` triggers an automatic build and deploy — that's it.

To force a fresh build with no data change (e.g. to double-check something), go to the repo's
**Actions** tab, select **Scheduled rebuild**, and click **Run workflow**. It also already runs
automatically every Monday, so the "closing soon" banner and calendar page never drift far from
reality even if nobody edits data for a while.

## The two scheduled GitHub Actions

Both live in `.github/workflows/` and both have detailed comments at the top of their file
explaining the reasoning — read those for the full story. In brief:

- **`sync-sheet.yml`** — runs nightly (and can be triggered manually from the Actions tab). Pulls
  the club's Google Sheet, validates it, and commits `src/data/opportunities.json` only if the
  data actually changed and passed validation. If the sheet isn't configured yet, it skips
  gracefully instead of failing.
- **`scheduled-rebuild.yml`** — runs weekly. Pushes an empty commit purely to force a fresh build,
  since some of the site's logic (which deadlines count as "closing soon") is computed at build
  time, not when a visitor loads the page.

Neither workflow contains an explicit "deploy" step — the push itself is the deploy, because
Cloudflare Workers Builds watches `main`.

## Where credentials and access live

This is an inventory of what access is needed, not a list of who has it:

1. **GitHub repo admin/write access** — needed to merge to `main` and to manage the repo variables
   below. Managed in the repo's own Settings → Collaborators.
2. **Two GitHub Actions repository variables**: `SHEET_OPPORTUNITIES_CSV_URL` and
   `SHEET_DEADLINES_CSV_URL` (Settings → Secrets and variables → Actions → Variables tab). These
   are public, read-only, published-to-web CSV links — not secret — but the sync workflow can't
   run without them. See `scripts/sheet-setup/README.md` for how they're generated.
3. **Cloudflare account access** — whoever's Cloudflare account owns the Workers Builds project
   (`ghic-opportunities-db`) can see build logs and add a custom domain later.
4. **Google account access to the published Sheet** — needed if a publish-to-web link ever breaks
   and has to be re-published (see `scripts/sheet-setup/README.md`, "If you ever need to rebuild
   the sheet from scratch").

## Domain

The site currently runs on Cloudflare's default subdomain:
`https://ghic-opportunities-db.ishaan-wizard.workers.dev` — no custom domain has been purchased.
If the club buys one later: add it in the Cloudflare dashboard under the Workers Builds project,
then update the `site` field in `astro.config.mjs` to match (it's used to build canonical URLs).

## When the build breaks

Work through these in order:

1. **Check the Actions tab first.** Did `sync-sheet.yml` actually fail (red X), or is it just
   skipping because the sheet variables aren't configured (green check, "Sheet URLs not
   configured")? A failed run's log lists every validation problem it found — the site was never
   touched, since a failing sync never commits.
2. **If someone edited `opportunities.json` directly** (Option B in `CONTRIBUTING.md`) and the
   build is now broken, run `npm run check` locally. It prints the exact list of what's wrong.
   Fix, re-run `npm run check` until clean, then push.
3. **If the sheet's published CSV link itself stopped working** (e.g. someone unpublished it, or
   the sheet was recreated), see the republish steps in `scripts/sheet-setup/README.md` and update
   the two repo variables to the new URLs.
4. **If Cloudflare's build itself is failing** (rather than a GitHub Action), check the build log
   in the Cloudflare dashboard for the `ghic-opportunities-db` project — this usually means the
   same underlying data problem as #2, just caught at a different stage.

## Database Editor access checklist

SPEC.md calls for a **Database Editor** role in the club constitution. That document lives outside
this repo, but here's exactly what it needs to grant, so "set up the role" isn't a guessing game.
Whoever holds this role needs all four of the following (fill in "current holder" in the
constitution itself, not here):

1. GitHub repo collaborator access (to merge to `main` and manage Actions variables). Current
   holder: ______
2. Cloudflare account access to the `ghic-opportunities-db` project (to view build logs / manage
   a custom domain). Current holder: ______
3. Edit access to the published Google Sheet (to fix a broken publish link or restructure a
   column). Current holder: ______
4. Whoever is designated should also know where this `RUNBOOK.md` and `CONTRIBUTING.md` live —
   i.e., they've read this file. Current holder: ______

## Screen recording checklist

SPEC.md also calls for a 10-minute screen capture of a real edit. When it's recorded, link it
here: ______. It should show, in order:

1. Editing a single cell in the live Google Sheet (e.g. flipping a `clubStatus` value).
2. Running the **Sync Google Sheet** workflow manually from the GitHub Actions tab, and the run
   succeeding.
3. The change appearing on the live site after Cloudflare's automatic rebuild finishes.
