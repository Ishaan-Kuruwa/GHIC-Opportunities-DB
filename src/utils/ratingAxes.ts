import type { Ratings } from "../data/types";

// Single source of truth for the six-axis order RatingRadar plots in, clockwise
// from the top. RatingMeter can opt into the same order (via its
// `matchRadarOrder` prop) so that on the detail page, reading down the numbers
// traces the same sequence as reading around the shape -- radar and meter stay
// two representations of one thing, not two components that happen to agree by
// coincidence.
export const RATING_AXES: { key: keyof Ratings; label: string }[] = [
  { key: "clubFit", label: "Club fit" },
  { key: "prestige", label: "Prestige" },
  { key: "accessibility", label: "Accessibility" },
  { key: "effort", label: "Effort" },
  { key: "competitiveness", label: "Competitiveness" },
  { key: "skills", label: "Skills" },
];
