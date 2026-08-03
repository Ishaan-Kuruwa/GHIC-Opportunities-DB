#!/usr/bin/env node
// One-off, manual link checker. Run by hand with `node scripts/check-links.mjs`.
//
// This is deliberately NOT part of `npm run check` or `npm run build`: an organizer's
// site being slow or briefly down has nothing to do with whether our own data is
// well-formed, and a flaky external site should never block a deploy.
//
// Large organizations (CME Group, FBLA, MAA, SIAM, etc.) commonly run anti-bot
// protection that returns 403 to non-browser clients no matter what. A 403 from one
// of these does NOT mean the link is broken -- if it opens fine in a real browser,
// leave the URL alone. Don't "fix" a working link because this script flagged it.
//
// Watch out for 404s too, not just 403s: bpa.org (Business Professionals of America)
// serves a *cached 404* to this script's requests via its WAF, even though
// bpa.org/students/compete/ loads fine in a real browser (confirmed manually). A
// cached-404 anti-bot response is easy to mistake for a genuinely dead page because
// it looks identical to one -- a real 404, not a 403 -- so don't assume "404 means
// go fix the URL" without opening it in a browser first.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dataPath = fileURLToPath(
  new URL("../src/data/opportunities.json", import.meta.url),
);

const { opportunities } = JSON.parse(readFileSync(dataPath, "utf-8"));
const withUrls = opportunities.filter((o) => o.url);

console.log(`Checking ${withUrls.length} organizer links...\n`);

const problems = [];

async function checkUrl(url) {
  const commonOptions = {
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  };

  // Some servers don't implement HEAD properly (or block it outright): they answer
  // with 403/405, or send a malformed HEAD response that makes Node's fetch throw
  // outright, even though a normal GET works fine. In either case, retry with a
  // ranged GET -- it behaves like HEAD (server sends ~nothing back) but looks like
  // a real request.
  let response;
  try {
    response = await fetch(url, { ...commonOptions, method: "HEAD" });
    if (response.status !== 403 && response.status !== 405) {
      return response;
    }
  } catch {
    // fall through to the GET retry below
  }

  return fetch(url, {
    ...commonOptions,
    method: "GET",
    headers: { Range: "bytes=0-0" },
  });
}

for (const opportunity of withUrls) {
  let result;
  try {
    const response = await checkUrl(opportunity.url);
    result = `${response.status} ${response.statusText}`;
    if (response.url && response.url !== opportunity.url) {
      result += ` -> ${response.url}`;
    }
    if (!response.ok) {
      problems.push({ id: opportunity.id, url: opportunity.url, result });
    }
  } catch (err) {
    result = `ERROR: ${err.message}`;
    problems.push({ id: opportunity.id, url: opportunity.url, result });
  }
  console.log(`${result.padEnd(20)} ${opportunity.id}`);
}

console.log("");
if (problems.length === 0) {
  console.log("All links OK.");
} else {
  console.log(`${problems.length} problem(s):\n`);
  for (const problem of problems) {
    console.log(`  - ${problem.id}: ${problem.result}\n    ${problem.url}`);
  }
  process.exitCode = 1;
}
