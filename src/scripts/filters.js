// Vanilla JS filtering for the browse page. No framework, no fetch: this only
// reads/writes DOM nodes and data-* attributes that index.astro already rendered
// server-side, and updates the address bar so a filtered view is shareable.
//
// This file is a plain <script> import (not a module with imports/exports) on
// purpose -- one file, top to bottom, is easier for a future non-technical
// maintainer to follow than a set of imported helpers.

const items = Array.from(document.querySelectorAll("[data-opportunity]"));
const emptyState = document.getElementById("filter-empty-state");
const resultCount = document.getElementById("filter-count");
const details = document.getElementById("filter-details");
const summary = document.getElementById("filter-summary");

const searchInput = document.getElementById("filter-search");
const typeSelect = document.getElementById("filter-type");
const categorySelect = document.getElementById("filter-category");
const freeCheckbox = document.getElementById("filter-free");
const verifiedCheckbox = document.getElementById("filter-verified");

// The four range <select>s carry their own field/param/comparator as data
// attributes (see FilterBar.astro), so this script doesn't need to guess a URL
// param name or a comparison direction from a field name -- it's just data.
const rangeSelects = Array.from(document.querySelectorAll("[data-comparator]"));

const clearButtons = [
  document.getElementById("filter-clear"),
  document.getElementById("filter-empty-clear"),
].filter(Boolean);

// Reads the current state directly from the controls (the controls are the
// source of truth; the URL is just a mirror of them).
function readFilters() {
  return {
    search: searchInput.value.trim().toLowerCase(),
    type: typeSelect.value,
    category: categorySelect.value,
    free: freeCheckbox.checked,
    verified: verifiedCheckbox.checked,
    ranges: rangeSelects.map((select) => ({
      field: select.dataset.field,
      param: select.dataset.param,
      comparator: select.dataset.comparator,
      value: select.value,
    })),
  };
}

function itemMatches(item, filters) {
  if (filters.search && !item.dataset.search.includes(filters.search)) return false;
  if (filters.type && item.dataset.type !== filters.type) return false;
  if (filters.category && item.dataset.category !== filters.category) return false;
  if (filters.free && item.dataset.free !== "true") return false;
  if (filters.verified && item.dataset.verified !== "true") return false;

  for (const range of filters.ranges) {
    if (range.value === "") continue;
    const itemValue = Number(item.dataset[range.field]);
    const threshold = Number(range.value);
    if (range.comparator === "max" && itemValue > threshold) return false;
    if (range.comparator === "min" && itemValue < threshold) return false;
  }

  return true;
}

function countActive(filters) {
  let count = 0;
  if (filters.type) count++;
  if (filters.category) count++;
  if (filters.free) count++;
  if (filters.verified) count++;
  for (const range of filters.ranges) {
    if (range.value !== "") count++;
  }
  return count;
}

function applyFilters() {
  const filters = readFilters();
  let visibleCount = 0;

  for (const item of items) {
    const matches = itemMatches(item, filters);
    item.hidden = !matches;
    if (matches) visibleCount++;
  }

  resultCount.textContent = `Showing ${visibleCount} of ${items.length}`;
  emptyState.hidden = visibleCount !== 0;

  const activeCount = countActive(filters);
  summary.textContent = activeCount > 0 ? `Filters (${activeCount})` : "Filters";

  syncUrl(filters);
}

function syncUrl(filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.free) params.set("free", "1");
  if (filters.verified) params.set("verified", "1");
  for (const range of filters.ranges) {
    if (range.value !== "") params.set(range.param, range.value);
  }

  const query = params.toString();
  const newUrl = query ? `${location.pathname}?${query}` : location.pathname;
  // replaceState, not pushState: adjusting a filter shouldn't fill up the
  // back-button history with one entry per click.
  history.replaceState(null, "", newUrl);
}

function applyFiltersFromUrl() {
  const params = new URLSearchParams(location.search);
  searchInput.value = params.get("q") ?? "";
  typeSelect.value = params.get("type") ?? "";
  categorySelect.value = params.get("category") ?? "";
  freeCheckbox.checked = params.get("free") === "1";
  verifiedCheckbox.checked = params.get("verified") === "1";
  for (const select of rangeSelects) {
    select.value = params.get(select.dataset.param) ?? "";
  }
}

function clearAll() {
  searchInput.value = "";
  typeSelect.value = "";
  categorySelect.value = "";
  freeCheckbox.checked = false;
  verifiedCheckbox.checked = false;
  for (const select of rangeSelects) {
    select.value = "";
  }
  applyFilters();
}

// Search filters as you type, but debounced ~150ms so filtering 46 DOM nodes on
// every keystroke doesn't feel laggy on an older phone. Every other control
// filters immediately on change -- there's no typing involved to debounce.
let searchDebounceTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(applyFilters, 150);
});

for (const control of [typeSelect, categorySelect, freeCheckbox, verifiedCheckbox, ...rangeSelects]) {
  control.addEventListener("change", applyFilters);
}

for (const button of clearButtons) {
  button.addEventListener("click", clearAll);
}

applyFiltersFromUrl();

// Open the filter panel by default on wide screens, where the 320px checkpoint
// showed everything fits -- only collapse it by default on narrow ones. This is
// a one-time check on load, not a live resize listener, to keep this simple.
details.open = window.matchMedia("(min-width: 640px)").matches;

applyFilters();
