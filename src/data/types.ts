// These types describe the shape of opportunities.json. scripts/check-data.mjs
// validates that same shape at runtime. If you change one, change the other.

export interface Meta {
  title: string;
  description: string;
  compiled: string;
  schoolYear: string;
  count: number;
  disclaimer: string;
}

export interface RatingScales {
  effort: string;
  competitiveness: string;
  skills: string;
  prestige: string;
  clubFit: string;
  accessibility: string;
}

export interface Facets {
  types: string[];
  categories: string[];
}

export interface Ratings {
  effort: number;
  competitiveness: number;
  skills: number;
  prestige: number;
  clubFit: number;
  accessibility: number;
}

export type ClubStatus = "not-started" | "planned" | "entered" | "placed";

// "day": full date is real -- safe to show and to generate a .ics file for.
// "month-part": source only said "early/mid/late <month>" -- render as that,
//   never as a specific day; no .ics file (would assert a day that isn't real).
// "kind" separates "you can miss this" (deadline) from "fyi" (milestone) --
// the home page banner only pulls from "deadline".
export type DeadlinePrecision = "day" | "month-part" | "month";
export type DeadlineKind = "deadline" | "milestone";

export interface Deadline {
  label: string;
  date: string; // ISO YYYY-MM-DD; only as precise as `precision` claims
  estimated: boolean;
  precision: DeadlinePrecision;
  kind: DeadlineKind;
  // Short human-readable reason a date is a guess, e.g. "2025-26 cycle closed
  // Feb 20". Always null when estimated is false.
  estimatedFrom: string | null;
}

export interface Opportunity {
  id: string;
  name: string;
  type: string;
  category: string;
  organizer: string;
  prestigeTier: string;
  cost: string;
  commitment: string;
  eligibility: string;
  format: string;
  description: string;
  timing: string;
  deadlines: Deadline[];
  payoff: string;
  notes: string;
  url: string;
  confidence: string;
  verified: boolean;
  ratings: Ratings;
  difficultyIndex: number;
  clubStatus: ClubStatus;
  clubNotes: string;
  lastVerified: string;
}

export interface OpportunitiesData {
  meta: Meta;
  ratingScales: RatingScales;
  facets: Facets;
  opportunities: Opportunity[];
}
