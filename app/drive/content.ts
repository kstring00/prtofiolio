/**
 * The single source of truth for the drive.
 *
 * Everything downstream reads from here: the 3D signs placed along the road,
 * the dashboard log, and the static page at /drive that ships when there is no
 * GPU, no WebGL, or a `prefers-reduced-motion` preference.
 *
 * `distance` is the organising key. It is metres travelled down the road, and
 * it does three jobs at once:
 *   - z-position of the sign in the 3D scene
 *   - sort order of the log and of the static page
 *   - the scrub target when a log entry is clicked
 *
 * One number, three consumers. Nothing else needs to know about ordering.
 */

export type TierId = "starter" | "standard" | "full";

interface SignBase {
  /** Stable across content edits — used for log keys and scrub targets. */
  id: string;
  /** Metres down the road. Must be unique and ascending within the array. */
  distance: number;
  /** Short line on the sign face itself. Kept terse; signs are read at speed. */
  label: string;
  /** The full sentence. Feeds the log and the static page. */
  detail: string;
}

/** Overhead green gantry. Carries a service tier and its price. */
export interface ExitSign extends SignBase {
  kind: "exit";
  tier: TierId;
  /** Whole US dollars. Rendered with the display face. */
  price: number;
  includes: string[];
}

/** Small roadside marker. One per week of the project. */
export interface MarkerSign extends SignBase {
  kind: "marker";
  week: number;
}

/**
 * Yellow diamond. The car eases down to `speedFactor` of cruising speed as it
 * passes, then builds back up. This is the one sign type with a physical
 * consequence, and it is the point of the whole piece: a delay the visitor
 * feels rather than reads.
 */
export interface CautionSign extends SignBase {
  kind: "caution";
  /** Multiplier on cruising speed while passing. Spec calls for ~0.4. */
  speedFactor: number;
}

export type DriveSign = ExitSign | MarkerSign | CautionSign;

/** Where the road ends. The fork has one lane per tier. */
export const TIER_ORDER: readonly TierId[] = ["starter", "standard", "full"];

/**
 * Contact route for the inquiry. `INQUIRY_URL` is the external intake form;
 * until it is set, the mailto is a working fallback rather than a dead button.
 */
export const INQUIRY_EMAIL = "stringham00@gmail.com";
export const INQUIRY_URL = "";

export function inquiryHref(tier?: TierId): string {
  if (INQUIRY_URL) {
    return tier ? `${INQUIRY_URL}?tier=${tier}` : INQUIRY_URL;
  }
  const subject = tier
    ? `Website inquiry — ${tier} tier`
    : "Website inquiry";
  return `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/** Total project length, in weeks. Drives how many markers the road carries. */
export const PROJECT_WEEKS = 3;

/**
 * The road, in order.
 *
 * Prices and the three-week timeline are real. The naming and the prose are
 * not written yet, and are deliberately left empty rather than filled with
 * plausible placeholder copy — empty renders as an obvious gap, whereas
 * plausible copy ships by accident.
 */
export const SIGNS: DriveSign[] = [
  {
    kind: "exit",
    id: "tier-starter",
    distance: 120,
    label: "",
    detail: "",
    tier: "starter",
    price: 500,
    includes: [],
  },
  {
    kind: "exit",
    id: "tier-standard",
    distance: 220,
    label: "",
    detail: "",
    tier: "standard",
    price: 1000,
    includes: [],
  },
  {
    kind: "exit",
    id: "tier-full",
    distance: 320,
    label: "",
    detail: "",
    tier: "full",
    price: 1500,
    includes: [],
  },
  {
    kind: "marker",
    id: "week-1",
    distance: 420,
    label: "",
    detail: "",
    week: 1,
  },
  {
    kind: "marker",
    id: "week-2",
    distance: 520,
    label: "",
    detail: "",
    week: 2,
  },
  {
    kind: "marker",
    id: "week-3",
    distance: 620,
    label: "",
    detail: "",
    week: 3,
  },
];

export const EXIT_SIGNS = SIGNS.filter(
  (s): s is ExitSign => s.kind === "exit",
);
export const MARKER_SIGNS = SIGNS.filter(
  (s): s is MarkerSign => s.kind === "marker",
);
export const CAUTION_SIGNS = SIGNS.filter(
  (s): s is CautionSign => s.kind === "caution",
);

/** Length of road, with a little run-out past the last sign before the fork. */
export const ROAD_LENGTH =
  SIGNS.reduce((max, s) => Math.max(max, s.distance), 0) + 120;

/**
 * Content that is structurally present but not yet written. Rendered as a
 * visible notice on the page so an unfinished tier cannot quietly ship.
 */
export function contentGaps(): string[] {
  const gaps: string[] = [];
  for (const sign of SIGNS) {
    if (!sign.label) gaps.push(`${sign.id}: no label`);
    if (!sign.detail) gaps.push(`${sign.id}: no detail`);
    if (sign.kind === "exit" && sign.includes.length === 0) {
      gaps.push(`${sign.id}: nothing listed under "includes"`);
    }
  }
  if (CAUTION_SIGNS.length === 0) {
    gaps.push("no caution signs — what do you need from a client?");
  }
  if (!INQUIRY_URL) {
    gaps.push("no external inquiry URL — falling back to mailto");
  }
  return gaps;
}
