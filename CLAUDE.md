# CLAUDE.md

Project context for Claude Code. Read this before making changes.

## What this project is

A public website that helps high school students find finance, business, economics, and
investing opportunities — competitions, internships, summer programs, and free learning
resources. Built and maintained by a high school investing club.

The audience is high school students, their teachers, and their parents. Most of them are on
phones. Most of them have never heard of any of these programs.

## The one constraint that governs everything

**A non-technical sophomore must be able to update this site in 20 minutes without help.**

This project outlives its authors or it fails. A club site that dies in two years is worse than
no site, because students will find stale deadlines and miss real ones.

Practical consequences:
- Prefer boring, readable code over clever code.
- Prefer zero dependencies over one more dependency.
- All content lives in data files, never hardcoded in components.
- Every non-obvious decision gets a comment explaining *why*, aimed at a 16-year-old who has
  never seen this repo.
- If a choice makes the site 5% better but meaningfully harder to hand off, don't make it.

## Stack

- **Astro** — static site generator. Ships zero JS by default, which keeps the site fast and the
  mental model small.
- **Tailwind CSS** — utility classes, no separate stylesheet to maintain.
- **Vanilla JS** for filtering and search. No client framework. 47 records do not need React.
- **Deployed on Cloudflare Pages** from the `main` branch, auto-deploying on push. Free tier:
  unlimited bandwidth, 500 builds/month. GitHub Pages is an equally fine fallback.
  **Do not use Netlify** — its free tier is now credit-based (300 credits/month) and *pauses the
  live site* when the cap is hit. Unacceptable for a site students rely on during deadline season.
- **The GitHub repo must be public.** That's what makes GitHub Actions free, and there is nothing
  secret in here anyway.
- **Node.js 20+** required locally to run Astro. (Claude Code itself does not need Node.)
- **No backend, no database, no authentication, no user accounts.**

## Data

`src/data/opportunities.json` is the single source of truth. Nothing about an opportunity should
ever be written into a component.

Shape:

```
{
  meta: { title, description, compiled, schoolYear, count, disclaimer },
  ratingScales: { effort, competitiveness, skills, prestige, clubFit, accessibility },
  facets: { types: [...], categories: [...] },
  opportunities: [
    {
      id,              // url slug, stable — never change these, they are permalinks
      name, type, category, organizer, prestigeTier,
      cost, commitment, eligibility, format,
      description,     // long prose, original writing
      timing,          // deadlines, may contain "(est.)"
      payoff, notes, url,
      confidence,      // "Verified ..." or a warning to check
      verified,        // boolean
      ratings: { effort, competitiveness, skills, prestige, clubFit, accessibility },  // 1-10
      difficultyIndex, // avg of effort/competitiveness/skills
      clubStatus,      // not-started | planned | entered | placed
      clubNotes,
      lastVerified     // ISO date
    }
  ]
}
```

Build filter menus from `facets`, never from hardcoded lists. If someone adds a new category to
the JSON, the filters should pick it up with no code change.

## Rules

1. **Never invent or edit opportunity facts.** Deadlines, eligibility, and costs come from the
   organizer's official site only. If something looks wrong, flag it — do not "fix" it from
   memory. Aggregator blogs are frequently wrong.
2. **Never paste text from competition websites.** All descriptions must be original writing.
   Copying their copy is a copyright problem.
3. **No personal data collection.** No signup forms, no email capture, no analytics that
   fingerprint users, no comments. This keeps us clear of COPPA and FERPA entirely.
4. **No ads and no affiliate links,** ever. Test-prep and "competition coaching" companies will
   eventually offer money. Taking it destroys the credibility that makes the site worth visiting.
5. **Show `lastVerified` on every entry.** Visible dates are what separate this from a listicle.
6. **Every entry links to the official organizer site.** External links open in a new tab with
   `rel="noopener noreferrer"`.
7. **Do not reproduce organizer logos.** Names and links only.
8. **Accessibility is not optional.** Semantic HTML, real focus states, alt text, sufficient
   contrast, keyboard-navigable filters.

## Conventions

- Components in `src/components/`, pages in `src/pages/`, data in `src/data/`.
- Opportunity detail pages are generated at `/opportunity/[id]`.
- Prose content (guides, about) lives in Markdown under `src/content/`, not in `.astro` files.
- Dates in data are ISO (`YYYY-MM-DD`); dates shown to users are human-readable.
- Commit messages: short, imperative, plain English.
- TypeScript is used for the data layer only (`src/data/types.ts` types the shape of
  `opportunities.json`) and for `scripts/check-data.mjs`'s own typing where useful. `.astro`
  components are not required to be strictly typed beyond their `Props` interface — the goal is
  catching data-shape bugs early, not enforcing TS everywhere.
- `npm run check` (`scripts/check-data.mjs`) is a plain, dependency-free Node script by
  deliberate choice, not an oversight — consistent with "prefer zero dependencies over one more
  dependency" above. Don't replace it with a schema library (Zod, etc.) without discussing first.

## Commands

```
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
npm run check    # validate opportunities.json against the expected shape
```

## Working style I want from you

- Propose a plan before multi-file changes. I will approve before you write.
- Make one focused change per session, then stop so I can review and commit.
- After any change, run the dev server and confirm the page actually renders before telling me
  it works.
- If a request would violate the handoff constraint above, say so instead of doing it.
- Don't add dependencies without asking first.

## Current status

Update this section as you go so the next session has context.

- [x] Phase 1 — scaffold + browse page deployed. Live at
      https://ghic-opportunities-db.ishaan-wizard.workers.dev (Cloudflare Workers Builds,
      auto-deploys on push to `main`).
- [x] Phase 2 — detail pages
- [x] Phase 3 — filters + search
- [x] Phase 4 — deadline calendar + .ics export
- [ ] Phase 5 — design pass
- [ ] Phase 6 — guide content
- [ ] Phase 7 — Google Sheet as CMS
- [ ] Phase 8 — handoff documentation
