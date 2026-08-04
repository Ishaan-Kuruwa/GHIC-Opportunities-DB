# Setting up the Google Sheet

One-time setup, done once by whoever is wiring up Phase 7. After this is done, editing
opportunities and deadlines is just typing into rows — no code, no git.

## 1. Create the sheet

1. Create a new Google Sheet. Name it something findable, e.g. "GCIC Opportunities Database".
2. Rename the two default tabs to exactly `Opportunities` and `Deadlines` (case-sensitive —
   `scripts/sync-sheet.mjs` and `column-notes.gs` both look for these exact names).
3. Import the seed data into each tab: **File > Import > Upload**, pick the matching CSV from
   this folder (`opportunities.csv` into the `Opportunities` tab, `deadlines.csv` into the
   `Deadlines` tab), choose **Replace current sheet** and **Comma** as the separator.
   These CSVs already contain the current 46 opportunities and 55 deadlines — you're not typing
   any of this by hand.
4. Convert the `verified` column (Opportunities tab) and the `estimated` column (Deadlines tab)
   to real checkboxes: select the column, **Insert > Checkbox**. The seed data already has
   `TRUE`/`FALSE` text in those cells, which Sheets will convert automatically.

## 2. Add column documentation

1. In the Sheet, go to **Extensions > Apps Script**.
2. Delete the placeholder code and paste in the full contents of `column-notes.gs` from this
   folder.
3. Run the `setupSheetNotes` function (▶ button in the toolbar, with that function selected).
4. The first run will ask you to authorize the script — that's Sheets asking permission to edit
   its own spreadsheet, not anything external. Approve it.
5. Confirm: row 1 on both tabs should now be frozen, and every header cell should show a small
   note triangle in the corner. Hover one to check the note shows up.

Re-run `setupSheetNotes` any time you add a new column — it's safe, it only touches header notes
and freeze state, never your data.

## 3. Publish both tabs as CSV

1. **File > Share > Publish to web**.
2. In the dropdown, select the `Opportunities` sheet specifically (not "Entire Document") and
   format **Comma-separated values (.csv)**. Publish. Copy the URL.
3. Repeat for the `Deadlines` sheet. Copy that URL too.

You now have two CSV URLs. They're public but read-only (published-to-web is exactly that), so
there's nothing sensitive in them.

## 4. Wire the URLs into GitHub

In the GitHub repo: **Settings > Secrets and variables > Actions > Variables** (repository
variables, not secrets — these URLs aren't sensitive, and using a variable means updating them
later doesn't require editing workflow files).

Add:
- `SHEET_OPPORTUNITIES_CSV_URL` — the Opportunities CSV URL from step 3.
- `SHEET_DEADLINES_CSV_URL` — the Deadlines CSV URL from step 3.

## 5. Test it

From the Actions tab, run the **Sync Google Sheet** workflow manually (`workflow_dispatch`).
It should report no changes (since the sheet still matches what's in `opportunities.json`).
Then edit one cell in the live sheet — e.g. flip a `clubStatus` — and run the workflow again.
It should commit a change this time, and that push triggers the normal Cloudflare Workers Builds
deploy.

After this, the workflow runs automatically every night — see
`.github/workflows/sync-sheet.yml`.

## If you ever need to rebuild the sheet from scratch

`opportunities.csv` and `deadlines.csv` in this folder are a snapshot from when Phase 7 was
built. They will drift out of date as the sheet gets edited — don't treat them as current data,
they're only here to bootstrap a fresh sheet if the original is ever lost. `opportunities.json`
in the repo is always the current, authoritative data.
