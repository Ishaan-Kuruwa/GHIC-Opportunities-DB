#!/usr/bin/env node
// Regenerates src/data/opportunities.json from the club's published Google
// Sheet. Run nightly by .github/workflows/sync-sheet.yml, or by hand for a
// dry run -- see scripts/sheet-setup/README.md for how the sheet is set up.
//
// opportunities.json stays the single source of truth the site actually
// builds from (see CLAUDE.md). This script is what keeps that file in sync
// with the sheet -- `npm run build` never talks to the sheet directly, so
// the repo still builds standalone if the sheet is ever deleted.
//
// No dependencies on purpose -- see CLAUDE.md ("prefer zero dependencies").

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dataPath = fileURLToPath(new URL("../src/data/opportunities.json", import.meta.url));
const configPath = fileURLToPath(new URL("../src/data/site-config.json", import.meta.url));

// A URL fetches the live published sheet. Anything else is treated as a
// local file path, so `npm run sync-sheet` can be pointed at
// scripts/sheet-setup/*.csv for a dry run with no network involved.
const OPPORTUNITIES_SOURCE =
  process.env.SHEET_OPPORTUNITIES_CSV_URL ??
  fileURLToPath(new URL("../scripts/sheet-setup/opportunities.csv", import.meta.url));
const DEADLINES_SOURCE =
  process.env.SHEET_DEADLINES_CSV_URL ??
  fileURLToPath(new URL("../scripts/sheet-setup/deadlines.csv", import.meta.url));

// If the sheet returns drastically fewer rows than we already have, that's
// almost always a broken publish URL or an accidentally-cleared tab, not 40
// opportunities actually being deleted on the same night. `npm run check`
// can't catch this -- an empty array is structurally valid. So we refuse to
// write anything in that case instead of quietly wiping the live site.
const MIN_SURVIVING_FRACTION = 0.8;

async function loadCsv(source) {
  const text = /^https?:\/\//.test(source)
    ? await (await fetch(source)).text()
    : readFileSync(source, "utf-8");
  return parseCsv(text);
}

// Minimal RFC 4180 CSV parser: quoted fields, "" for an escaped quote,
// commas/newlines inside quotes. Good enough for what Google Sheets exports.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const push = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    push();
    rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      push();
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      endRow();
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== "" || row.length > 0) endRow();

  // Drop a trailing blank row (a common side effect of a trailing newline).
  if (rows.length > 0 && rows[rows.length - 1].every((f) => f === "")) rows.pop();
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells, index) => {
    const record = { __row: index + 2 }; // +2: 1-indexed, plus the header row
    headers.forEach((header, col) => {
      record[header] = (cells[col] ?? "").trim();
    });
    return record;
  });
}

function parseBoolean(value, rowLabel, columnName) {
  if (value === "TRUE") return true;
  if (value === "FALSE") return false;
  throw new Error(
    `${rowLabel}: "${columnName}" must be the sheet checkbox value TRUE or FALSE (got ${JSON.stringify(value)}).`,
  );
}

function parseInteger(value, rowLabel, columnName) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw new Error(`${rowLabel}: "${columnName}" must be a whole number (got ${JSON.stringify(value)}).`);
  }
  return n;
}

async function main() {
  const [opportunityRows, deadlineRows] = await Promise.all([
    loadCsv(OPPORTUNITIES_SOURCE),
    loadCsv(DEADLINES_SOURCE),
  ]);

  const current = JSON.parse(readFileSync(dataPath, "utf-8"));
  const siteConfig = JSON.parse(readFileSync(configPath, "utf-8"));

  const previousOpportunityCount = current.opportunities.length;
  const previousDeadlineCount = current.opportunities.reduce((n, o) => n + o.deadlines.length, 0);

  if (opportunityRows.length === 0) {
    console.error("Sheet sync aborted: the Opportunities tab returned zero rows. Nothing written.");
    process.exit(1);
  }
  if (opportunityRows.length < previousOpportunityCount * MIN_SURVIVING_FRACTION) {
    console.error(
      `Sheet sync aborted: Opportunities tab returned ${opportunityRows.length} rows, ` +
        `down from ${previousOpportunityCount} -- more than a 20% drop. This looks like a broken ` +
        `publish URL or a cleared tab, not real data loss. Nothing written.`,
    );
    process.exit(1);
  }
  if (deadlineRows.length < previousDeadlineCount * MIN_SURVIVING_FRACTION) {
    console.error(
      `Sheet sync aborted: Deadlines tab returned ${deadlineRows.length} rows, ` +
        `down from ${previousDeadlineCount} -- more than a 20% drop. Nothing written.`,
    );
    process.exit(1);
  }

  const deadlinesById = new Map();
  for (const row of deadlineRows) {
    const rowLabel = `Deadlines tab, row ${row.__row}`;
    if (!row.id) throw new Error(`${rowLabel}: "id" is blank -- every deadline row needs the opportunity id it belongs to.`);
    const deadline = {
      label: row.label,
      date: row.date,
      estimated: parseBoolean(row.estimated, rowLabel, "estimated"),
      precision: row.precision,
      kind: row.kind,
      estimatedFrom: row.estimatedFrom === "" ? null : row.estimatedFrom,
    };
    if (!deadlinesById.has(row.id)) deadlinesById.set(row.id, []);
    deadlinesById.get(row.id).push(deadline);
  }

  const opportunities = opportunityRows.map((row) => {
    const rowLabel = `Opportunities tab, row ${row.__row}`;
    if (!row.id) throw new Error(`${rowLabel}: "id" is blank -- every opportunity needs a stable id.`);

    const effort = parseInteger(row.effort, rowLabel, "effort");
    const competitiveness = parseInteger(row.competitiveness, rowLabel, "competitiveness");
    const skills = parseInteger(row.skills, rowLabel, "skills");
    const prestige = parseInteger(row.prestige, rowLabel, "prestige");
    const clubFit = parseInteger(row.clubFit, rowLabel, "clubFit");
    const accessibility = parseInteger(row.accessibility, rowLabel, "accessibility");

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      organizer: row.organizer,
      prestigeTier: row.prestigeTier,
      cost: row.cost,
      commitment: row.commitment,
      eligibility: row.eligibility,
      format: row.format,
      description: row.description,
      timing: row.timing,
      deadlines: deadlinesById.get(row.id) ?? [],
      payoff: row.payoff,
      notes: row.notes,
      url: row.url,
      confidence: row.confidence,
      verified: parseBoolean(row.verified, rowLabel, "verified"),
      ratings: { effort, competitiveness, skills, prestige, clubFit, accessibility },
      // avg of effort/competitiveness/skills, per CLAUDE.md -- computed here
      // rather than typed in the sheet so it can never drift from the
      // ratings it's supposed to summarize.
      difficultyIndex: Math.round(((effort + competitiveness + skills) / 3) * 10) / 10,
      clubStatus: row.clubStatus,
      clubNotes: row.clubNotes,
      lastVerified: row.lastVerified,
    };
  });

  const knownDeadlineIds = new Set(opportunities.map((o) => o.id));
  for (const id of deadlinesById.keys()) {
    if (!knownDeadlineIds.has(id)) {
      throw new Error(`Deadlines tab references id "${id}", which has no matching row in the Opportunities tab.`);
    }
  }

  const facets = {
    types: [...new Set(opportunities.map((o) => o.type))].sort(),
    categories: [...new Set(opportunities.map((o) => o.category))].sort(),
  };

  // Build with meta.compiled left at the old value, so we can diff against
  // the current file and tell whether anything *besides the timestamp*
  // changed. Only a real content change earns a new compiled date and a
  // commit -- otherwise a no-op sheet sync would "change" the file every
  // single night forever.
  const candidate = {
    meta: {
      ...siteConfig.meta,
      compiled: current.meta.compiled,
      count: opportunities.length,
    },
    ratingScales: siteConfig.ratingScales,
    opportunities,
    facets,
  };

  // Compare with object keys sorted, since `candidate` and `current` are
  // built via different code paths and can legitimately have different key
  // order for the same content -- a naive JSON.stringify diff would treat
  // that as a change and write + commit every single night forever.
  function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonicalize(value[k])]));
    }
    return value;
  }

  const unchanged = JSON.stringify(canonicalize(candidate)) === JSON.stringify(canonicalize(current));
  if (unchanged) {
    console.log("Sheet sync: no content changes. opportunities.json left untouched.");
    return;
  }

  candidate.meta.compiled = new Date().toISOString().slice(0, 10);
  writeFileSync(dataPath, JSON.stringify(candidate, null, 2) + "\n");
  console.log(
    `Sheet sync: wrote opportunities.json (${opportunities.length} opportunities, ` +
      `${deadlineRows.length} deadlines, compiled ${candidate.meta.compiled}).`,
  );
}

main().catch((err) => {
  console.error(`Sheet sync failed: ${err.message}`);
  process.exit(1);
});
