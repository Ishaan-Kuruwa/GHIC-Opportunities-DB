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
