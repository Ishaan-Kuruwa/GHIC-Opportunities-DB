# REDESIGN-V3.md

Visual redesign spec. Built on the `redesign-v3` branch; `main` keeps serving the live site
until this is finished and approved.

> Supersedes the neo-brutalist v2 pass, which is committed on `redesign-v3`'s parent for
> reference. Nothing from v2 carries forward except the lessons: compute contrast before
> choosing colours, and check whether the caution system still reads once ambient visual
> weight changes.

---

## The direction

Three things combined:

- **Dark, terminal-modern** — near-black base, monospace for every number, hairline structure,
  one signal accent used sparingly.
- **Bento grid** — tiles of varying size instead of a uniform card grid, so layout itself
  encodes which opportunities matter most.
- **Data-forward** — the six ratings render as a six-axis radar shape per opportunity. The
  shapes are the site's identity: you compare silhouettes rather than reading numbers.

The reference point is a well-designed analytics dashboard, not a trading terminal. That
distinction matters and is the subject of the constraint below.

---

## Constraint zero: don't narrow the audience

A dark terminal aesthetic signals "this is for people already into markets." Roughly half
this database is personal finance, entrepreneurship, essay competitions, and internships, and
the intended reader is a freshman who does not yet know whether finance is for them.

The direction stays. Three specific choices offset the risk:

1. **The accent is not terminal green.** Signal green plus monospace reads as Bloomberg
   cosplay. Use a cool electric blue or cyan — technical, but not coded to one subculture.
2. **Copy voice stays plain.** No tickers, no "market open," no fake latency numbers, no
   `$` prefixes on things that aren't money. The interface is dark; the language is friendly.
3. **The hero leads with reach, not rigour.** "46 opportunities, most of them free" — not a
   data readout. First impression should be *there's a lot here for me*, not *this is advanced*.

If a design choice makes the site feel more exclusive, it's wrong even if it looks good.

---

## Design system

### Colour

All tokens live in the single `@theme` block in `src/styles/global.css`. Nothing new outside
that file.

Target palette shape — **compute every ratio before committing to a value**, same method as
Phase 5 and v2:

| Role | Intent |
|---|---|
| `--color-base` | Near-black page background, very slightly blue rather than neutral grey |
| `--color-tile` | Tile surface, one clear step lighter than base |
| `--color-tile-raised` | Hover / emphasis surface, one step lighter again |
| `--color-hairline` | Structural borders. Visible but quiet — this is a hairline design, not a bordered one |
| `--color-ink` | Primary text. Slightly warm off-white, never pure `#fff` (harsh on dark) |
| `--color-ink-muted` | Secondary text. **Must clear 4.5:1 against `--color-tile`, not against base** — muted text on dark is the single most common accessibility failure in this style |
| `--color-accent` | Cool electric blue or cyan. Not green. Used sparingly |
| `--color-accent-dim` | Radar fill and low-emphasis accent use |

**Requirements, not suggestions:**

- Every text/background pair clears WCAG AA (4.5:1 normal, 3:1 large). Compute and report the
  numbers before writing CSS.
- Non-text UI (borders, focus rings, radar strokes) clears 3:1.
- `--color-ink` is never pure white. Pure white on near-black causes halation and is
  genuinely harder to read for extended text.

### The caution system — rebuild, don't port

This is the highest-risk part of the redesign. 45 of 55 deadline entries depend on amber
reading as caution, and the current amber tokens were computed against a cream background.
They will not survive the move to dark.

- The current `--color-caution-fill` (`#fde68a`) is far too bright to use as a fill on dark —
  it will glare. On dark, amber should invert: a **deep amber-brown fill** with a **bright
  amber border and text**.
- Amber must remain the *only* use of the yellow-orange range. The accent stays cool
  specifically so this separation holds.
- Recompute all three caution tokens from scratch against the new base and tile colours.
- **After building the calendar page, look at it as a whole.** The failure mode has now
  appeared twice in this project — amber invisible on cream, then an amber stripe lost among
  4px borders. It will try to happen a third time. Estimated entries must be unmistakable at a
  glance without the page reading as an alarm state.

### Typography

- **One sans stack** for headings, body, and UI — system fonts, no web font.
- **One monospace stack** for every number: ratings, dates, counts, deadline countdowns.
  This is the terminal signal, and it does the work a second display face would otherwise do.
- Numbers use `font-variant-numeric: tabular-nums` so they align in columns.
- No uppercase on data pulled from `opportunities.json` — opportunity names run to 95
  characters and prestige tier text to 63. Uppercase is for short fixed chrome labels only.
  (Same rule as v2; it was correct.)

### Motion

Restrained. A subtle tile hover lift and a radar draw-in on first paint at most. Respect
`prefers-reduced-motion` by removing animation, not by removing state. Dark interfaces make
motion more noticeable, so less is needed.

---

## Layout

### Bento grid (homepage)

Tile size is derived from data, never hand-assigned, so it stays correct when the sheet
changes:

| Condition | Tile |
|---|---|
| `prestige` 9–10 | Large — 2 columns × 2 rows, includes radar + description excerpt |
| `prestige` 7–8 | Wide — 2 columns × 1 row, includes radar |
| Everything else | Standard — 1 × 1, compact, ratings as a small inline strip |

One override: an opportunity with a confirmed `kind: "deadline"` inside 30 days is promoted
one size, whatever its prestige. Urgency earns space.

**Three things this must handle:**

1. **Filtering must not leave holes.** When filters cut 46 tiles to 10, the grid has to
   reflow. Use `grid-auto-flow: dense` and verify with several filter combinations, including
   ones that return only large tiles or only small ones.
2. **Mobile collapses to a single column.** Bento is a desktop-and-tablet benefit. On phones,
   tiles stack — but size still controls *content density*, so a large tile keeps its radar
   and excerpt while a standard tile stays compact.
3. **The size rule is visible editorial judgment.** Wharton being four times the size of the
   Marshall Society essay prize is a claim. It's a defensible one, sourced from a rating in
   the data — but say so on the "How we verify" page rather than letting it look arbitrary.

### Radar shapes

- Inline SVG, generated at build time from the six ratings. No chart library.
- Six axes in fixed order, identical across every opportunity — the shapes are only
  comparable if the axes never move. Suggested order: Club fit, Prestige, Accessibility,
  Effort, Competitiveness, Skills.
- Hairline hexagonal guides at 33/66/100%, accent stroke, accent fill at low opacity.
- **Accessibility:** the SVG is `aria-hidden`, with the numeric ratings present in accessible
  text alongside or via `sr-only`. A shape is not an accessible substitute for a number.
- **Small sizes:** below roughly 120px a six-axis radar becomes unreadable. Standard tiles
  either use a simplified inline strip or omit the radar. Decide by looking, not in the
  abstract.
- Cache or precompute the polygon points — 46 shapes recalculated per page render is wasteful
  even if it's fast.

---

## Build order

Each stage ends somewhere reviewable. Do not start a stage before the previous one is seen.

**Stage A — Tokens and foundation.**
Rewrite the `@theme` block: dark palette, recomputed caution tokens, monospace token. No
layout changes. Every existing page re-themes through the shared tokens. Report all contrast
ratios before writing CSS. Review this before anything else moves — it's the cheapest place to
catch a palette problem.

**Stage B — Radar component.**
Build `RatingRadar.astro` standalone first, rendered at three sizes on a scratch page, before
it goes anywhere near the grid. This is the identity of the whole design; it deserves its own
look before it's embedded.

**Stage C — Bento homepage.**
Grid, three tile variants, size rule, dense reflow. Verify against filters early and often —
this is where it breaks.

**Stage D — Detail and calendar pages.**
Full radar on detail pages. Calendar rebuilt on the dark palette, with the whole-page amber
check described above.

**Stage E — Hero.**
A landing moment at the top of the homepage: the count, the nearest confirmed deadline, one
plain sentence about what this is. Designed to look right projected on a classroom wall as
well as on a phone.

---

## Quality floor — unchanged from Phase 5

- Lighthouse 95+ performance and accessibility on homepage, a detail page, and calendar
- Zero horizontal overflow at 320px and at 200% browser zoom
- Visible keyboard focus on every interactive element
- Works with JavaScript disabled: all opportunities render, filter UI hidden
- `lastVerified` and `estimatedFrom` remain visible on every entry
- No new dependencies; no web fonts
- All `id` and `data-*` attributes consumed by `filters.js` unchanged

---

## Out of scope

- A light-mode toggle. Dark-only is a design decision, not an oversight. Revisit later if
  people ask.
- Guide-page redesign beyond inheriting the new tokens.
- Any change to `opportunities.json`, the sync pipeline, or the `.ics` generation.