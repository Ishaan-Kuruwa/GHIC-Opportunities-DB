/*
 * One-time setup script. NOT part of the website build -- this runs inside
 * Google Sheets itself (Apps Script), not Node.
 *
 * What it does: freezes row 1 on the Opportunities and Deadlines tabs, and
 * attaches a cell note to every header explaining what goes in that column
 * and what values are allowed. The point is that whoever edits this sheet in
 * a few years will never go looking for a README in a GitHub repo -- but
 * they can't miss a note attached to the column they're typing into (hover
 * the little triangle in the corner of the header cell).
 *
 * How to run this, once:
 *   1. In the Google Sheet: Extensions > Apps Script.
 *   2. Delete the placeholder code, paste this whole file in.
 *   3. Click Run (the ▶ button) with setupSheetNotes selected.
 *   4. Google will ask you to authorize the script the first time --
 *      that's normal, it's just Sheets asking permission to edit its own
 *      spreadsheet. Approve it.
 *   5. Check the two tabs: row 1 should be frozen and every header cell
 *      should show a small note triangle.
 *
 * Safe to re-run any time (e.g. after adding a new column) -- it just resets
 * the notes and freeze state, it never touches your data rows.
 */

const OPPORTUNITIES_COLUMN_NOTES = {
  id: "Permanent URL slug for this opportunity (site.com/opportunity/THIS-ID). " +
    "Set it once when you create the row and never change it after -- external " +
    "links and bookmarks point at it. Lowercase, hyphens, no spaces, e.g. " +
    "wharton-global-high-school-investment-competition",
  name: "Full official name of the opportunity, as the organizer writes it.",
  type: "One of the categories used for the site's filter menu (Competition, " +
    "Internship, Summer Program, Learning Resource, Program / Mentorship, " +
    "Virtual Experience, Certification, Club / Membership, Essay Competition, " +
    "...). The filter menu is built from whatever appears in this column, so " +
    "keep new values Title Case and spelled the same way as existing rows.",
  category: "Subject-area tag used for filtering, e.g. Investing & Portfolio " +
    "Management, Personal Finance, Economics. Same rule as Type: keep spelling " +
    "consistent with existing rows, since the filter menu is generated from this " +
    "column.",
  organizer: "Who runs it -- the organization or institution name.",
  prestigeTier: "Short free-text label for how prestigious/selective this is, " +
    "e.g. \"Tier 1 - National/Global flagship\". Shown on the detail page.",
  cost: "What it costs to participate, in plain language. Say $0 or Free " +
    "explicitly if there's no cost -- don't leave it blank.",
  commitment: "Rough time commitment, e.g. \"~3-5 hrs/week for 10 weeks\".",
  eligibility: "Who can apply: grade levels, team size, location restrictions, etc.",
  format: "How it actually runs -- solo or team, online or in person, what the " +
    "deliverable is.",
  description: "2-5 sentences of ORIGINAL writing about what this is. Never copy " +
    "text from the organizer's website into this cell -- that's a copyright " +
    "problem. Write it yourself, in your own words.",
  timing: "Free-text summary of the overall timeline, shown as one paragraph on " +
    "the detail page. Individual dates go in the Deadlines tab, not here.",
  payoff: "What you get out of it -- prizes, recognition, resume value, etc.",
  notes: "Club-specific tips, e.g. \"the essay is the actual bottleneck.\"",
  url: "Official organizer page. Must start with https:// , or be left blank if " +
    "there isn't one yet.",
  confidence: "Short note on how sure we are this info is current, e.g. " +
    "\"Verified Aug 2026\" or a warning telling readers to double-check.",
  verified: "Checkbox. Check this ONLY after someone has confirmed every detail " +
    "in this row on the organizer's official site for the current school year.",
  effort: "1-10. Total time and work required. 1 = an afternoon. 10 = a " +
    "months-long research project.",
  competitiveness: "1-10. How hard it is to place or win. 1 = everyone entering " +
    "is recognized. 10 = single-digit selection rates.",
  skills: "1-10. Technical floor to be competitive. 1 = no background needed. " +
    "10 = advanced math, modeling or economics.",
  prestige: "1-10. How much weight this carries with colleges and employers.",
  clubFit: "1-10. How well it works as a group activity. 10 = whole club " +
    "participates. 1 = solo pursuit.",
  accessibility: "1-10. How easy it is to get in and start. Low = costly, " +
    "invite-only, or restrictive eligibility.",
  clubStatus: "Where the club stands with this one. Type exactly one of: " +
    "not-started, planned, entered, placed.",
  clubNotes: "Internal notes about the club's own attempt/history with this " +
    "opportunity.",
  lastVerified: "Date (YYYY-MM-DD) someone last checked this row against the " +
    "official site.",
};

const DEADLINES_COLUMN_NOTES = {
  id: "Must exactly match an id from the Opportunities tab -- this is how a " +
    "deadline gets linked to the right opportunity. One row per deadline: an " +
    "opportunity with 4 deadlines gets 4 rows here.",
  label: "Short name for this specific date, e.g. \"Registration deadline\" or " +
    "\"Roster due\".",
  date: "YYYY-MM-DD. Must be a real calendar date even if Precision says it's a " +
    "guess -- use your best specific date, don't leave it vague.",
  precision: "How exact the date really is. Type exactly one of: day (we know " +
    "the real date), month-part (source only said \"early/mid/late [month]\"), " +
    "month (source only named the month, no day).",
  kind: "Type exactly one of: deadline (missing it has real consequences -- " +
    "feeds the homepage \"closing soon\" banner) or milestone (an FYI date, " +
    "like when a competition starts).",
  estimated: "Checkbox. Check this if the date is a guess (e.g. inferred from " +
    "last year's cycle) rather than confirmed on the organizer's current site.",
  estimatedFrom: "If Estimated is checked, a short reason, e.g. \"2025-26 cycle " +
    "closed Feb 20\". Leave blank if Estimated is unchecked.",
};

function applyColumnNotes(sheetName, notesByColumn) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(
      `No tab named "${sheetName}" found. Check the tab is named exactly that ` +
        `(case-sensitive) and try again.`,
    );
  }

  sheet.setFrozenRows(1);

  const lastColumn = sheet.getLastColumn();
  const headerRange = sheet.getRange(1, 1, 1, lastColumn);
  const headers = headerRange.getValues()[0];

  headers.forEach((header, index) => {
    const note = notesByColumn[header];
    const cell = sheet.getRange(1, index + 1);
    if (note) {
      cell.setNote(note);
    } else if (header) {
      // A header with no matching note is either a typo or a new column
      // this script doesn't know about yet -- flag it instead of failing
      // silently.
      cell.setNote(`No documentation found for column "${header}". Check spelling against sync-sheet.mjs, or add a note here manually.`);
    }
  });
}

function setupSheetNotes() {
  applyColumnNotes("Opportunities", OPPORTUNITIES_COLUMN_NOTES);
  applyColumnNotes("Deadlines", DEADLINES_COLUMN_NOTES);
}
