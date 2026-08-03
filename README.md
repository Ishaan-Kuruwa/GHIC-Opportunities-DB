# GCIC Opportunities Database

A public website that helps high school students find finance, business, economics, and
investing opportunities — competitions, internships, summer programs, and free learning
resources. Built and maintained by our investing club.

**Who it's for:** high school students, their teachers, and their parents, mostly browsing on a
phone. Most visitors have never heard of any of the programs listed here.

**Live site:** _not yet deployed — add the Cloudflare URL here once the site is live._

## Running it locally

You'll need [Node.js](https://nodejs.org) 20 or later installed.

```
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:4321`). The page auto-reloads as you edit
files.

## `npm run check`

Before every build, this project validates `src/data/opportunities.json` — it checks that every
opportunity has a unique `id`, that all six ratings are whole numbers from 1 to 10, and that
`url` is either empty or a real `https://` link. If anything is wrong, it prints every problem it
found and stops (`npm run build` refuses to build on broken data). Run it on its own any time
with:

```
npm run check
```

## Where the data lives

Everything about every opportunity — name, deadlines, ratings, description, and so on — lives in
one file: [`src/data/opportunities.json`](src/data/opportunities.json). Nothing about a specific
opportunity is ever hardcoded into a page or component. To add, edit, or remove an opportunity,
edit that file (see `CLAUDE.md` for the exact shape each entry needs to follow).

## More context

- `CLAUDE.md` — project conventions, rules, and constraints for anyone (human or AI) working on
  this repo.
- `SPEC.md` — the phased build plan.
