# Build Spec

Phased requirements. Each phase is one or two Claude Code sessions and ends with something
deployed and working. Do not start a phase before the previous one is live.

> Tooling and hosting recommendations here were current as of **August 2026**. Free tiers change
> — Netlify's did, mid-project. If a recommendation below no longer matches what a provider
> actually offers, trust the provider and update this file.

---

## Phase 1 — Scaffold and browse page

**Goal: something real on the internet on day one.**

- Astro project with Tailwind, TypeScript optional.
- `src/data/opportunities.json` in place.
- `npm run check` script that validates the JSON: every record has an `id`, ids are unique, all
  six ratings are integers 1–10, `url` is either empty or a valid https URL. Fail loudly.
- Home page listing all 47 opportunities as cards. Each card shows: name, type, category,
  prestige tier, cost, and the six ratings.
- Cards link to `#` for now.
- Mobile-first. One column on phones, two on tablets, three on desktop.
- Public GitHub repo. Deployed to **Cloudflare Pages** from `main`, auto-deploying on push.
  Free tier, unlimited bandwidth. Do not use Netlify (see CLAUDE.md for why).

**Done when:** a stranger can open the URL on a phone and scroll all 47 opportunities.

---

## Phase 2 — Detail pages

- Generate a static page per opportunity at `/opportunity/[id]` from the JSON.
- Show every field: full description, eligibility, format, timing, payoff, notes, cost,
  commitment, organizer, all six ratings, difficulty index.
- Prominent "Visit the official site" button using `url`. If `url` is empty, hide the button.
- Show `lastVerified` and the `confidence` string. If `verified` is false, show a visible caution
  note telling the reader to confirm details themselves.
- Per-page `<title>` and meta description built from the opportunity name and category. This is
  the SEO surface — a student googling a competition name should be able to land here.
- Breadcrumb back to browse. Prev/next links between opportunities.

**Done when:** all 47 detail pages build, and every external link resolves.

---

## Phase 3 — Filter and search

The core feature. Vanilla JS operating on already-rendered DOM nodes — no client-side framework,
no fetch, no hydration.

- Filter by: type, category, cost-is-free, verified-only.
- Range filters on: effort, competitiveness, skills, club fit. "Show me things under 5 effort."
- Text search across name, organizer, description, and category.
- Filters combine (AND across filter types).
- Live result count: "Showing 12 of 47".
- A visible "clear all" control.
- Filter state reflected in the URL query string so a filtered view can be shared and bookmarked.
- Works with JavaScript disabled: without JS, all 47 render and the filter UI is hidden.
- Keyboard navigable. Real `<label>` elements. Focus visible.

**Done when:** you can find "free competitions with high club fit" in under five seconds on a
phone.

---

## Phase 4 — Deadlines and calendar

- Add a `deadlines` array to each opportunity in the JSON: `[{ label, date, estimated }]`.
  Populate from the `timing` strings. Mark anything inferred from a prior cycle as
  `estimated: true`.
- Calendar page grouped by month across the school year.
- Estimated dates rendered visually distinct from confirmed ones, with a legend.
- Home page banner: the next three deadlines within 45 days, computed at build time.
- `.ics` download per deadline and a combined "all deadlines" `.ics`. Generate these as static
  files at build time; do not use a library if a 40-line generator will do.
- Rebuild the site on a schedule so "closing soon" stays accurate: a Cloudflare Pages deploy hook
  (a URL you POST to), triggered by a scheduled GitHub Actions workflow running weekly. Store the
  hook URL as a GitHub repository secret, never in the repo.

  > **Update, Phase 4 implementation:** this project deploys via **Cloudflare Workers Builds**
  > (see `wrangler.jsonc`), not the separate Pages product this bullet assumed — that pivot
  > happened back in Phase 1. Workers Builds auto-deploys on every push to `main` and doesn't
  > expose an equivalent standalone deploy-hook URL, so there's no hook to store as a secret.
  > Instead, `.github/workflows/scheduled-rebuild.yml` pushes a weekly empty commit to `main`,
  > and the existing auto-deploy does the rest. Simpler, and no secret to manage. Per this file's
  > own header: trust the provider over this text when they disagree.

**Done when:** a student can add every Wharton deadline to their phone calendar in two taps.

---

## Phase 5 — Design pass

Now, not earlier. Design a working thing, not an empty thing.

- One accent color, one neutral scale, one font pairing. Resist decorating.
- Consistent spacing scale. Generous whitespace.
- Ratings shown as small bars or dots, not raw numbers alone — scannable at a glance.
- Visual weight follows importance: name and deadline are primary; organizer and ratings secondary.
- Check contrast ratios. Check at 320px wide. Check with the browser zoomed to 200%.
- Fast: no web fonts over 100kb, no layout shift, images (if any) sized and lazy.

**Done when:** it looks deliberate rather than defaulted, and Lighthouse scores 95+ on
performance and accessibility.

---

## Phase 6 — Guides and content

Markdown files in `src/content/guides/`, rendered through a shared layout.

- **Start here** — route by situation: *I'm a freshman* / *I have five hours a week* / *I want
  quant* / *I want banking or asset management* / *I want entrepreneurship*. Each guide names
  three to five specific opportunities from the database and says why, in that order.
- **Free learning stack** — the no-cost curriculum. Likely the most useful page on the site.
- **How we verify** — the methodology. Official sources only, annual August audit, how to report
  an error. This page is what makes the site trustworthy.
- **About** — who runs it, what the club is, how to get involved.

Every guide links to detail pages rather than restating their content.

---

## Phase 7 — Google Sheet as CMS

The succession mechanism. Do this before anyone graduates.

- A published Google Sheet mirrors the opportunity fields, one row per opportunity.
- A GitHub Action runs nightly and on manual trigger: fetch the sheet as CSV, transform to
  `opportunities.json`, run `npm run check`, and commit only if validation passes and the data
  actually changed. The commit triggers the Cloudflare Pages rebuild automatically.
  (GitHub Actions is free without limits on public repos, which is why the repo is public.)
- If validation fails, the action fails loudly and does not commit. Never ship broken data.
- Document in the sheet itself which columns are required and what the rating scales mean.

**Done when:** a club member with no coding experience can add an opportunity by typing a row.

---

## Phase 8 — Handoff

- `CONTRIBUTING.md`: how to add or edit an opportunity, both via the sheet and via the repo.
- `RUNBOOK.md`: how to deploy, where the credentials live, who owns the domain, what to do when
  the build breaks.
- `AUDIT.md`: the August checklist. All 47 links, all dates, all eligibility rules re-verified
  against official sources. Split across members; one afternoon.
- Named **Database Editor** role in the club constitution with the credentials.
- Record a 10-minute screen capture walking through a real edit.

---

## Explicitly out of scope

Do not build these. Each one has killed a student project before.

- User accounts, logins, or profiles
- Comments, forums, or any user-generated content
- Email newsletters or notification systems
- A custom admin panel
- A backend server or hosted database
- Dark mode (until everything above is done)
- Anything that collects personal information

## Club-internal archive (optional, later)

An archive of past member submissions — Wharton Investment Policy Statements, YIS pitch decks,
Fed Challenge papers — with what placed and what didn't. This is the genuinely unique asset;
nothing like it exists publicly.

**Keep this off the website entirely.** Password protection on static hosts is now a paid feature
almost everywhere, and building auth would violate the no-accounts rule. Use one of these instead:

- A **private GitHub repo** that members are invited to. Free, versioned, and it teaches members
  a tool they'll use later.
- A **shared Google Drive folder** with access limited to club members. Simpler, better for PDFs
  and slide decks, and any officer can manage it.

Either way: get written permission from each author before archiving their work, and let anyone
withdraw a submission later without explanation.
