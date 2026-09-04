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

export type TierId = "one-page" | "small-site" | "editable";

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
  /**
   * Every tier is quoted as a floor, not a fixed fee — scope moves the final
   * number. The word matters commercially, so it is data rather than something
   * each consumer remembers to prepend.
   */
  from: boolean;
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

/** Where the road ends. The fork has one lane per tier, in this order. */
export const TIER_ORDER: readonly TierId[] = [
  "one-page",
  "small-site",
  "editable",
];

/**
 * Contact route for the inquiry. `INQUIRY_URL` is the external intake form;
 * until it is set, the mailto is a working fallback rather than a dead button.
 * The chosen lane rides along as `?tier=` so the fork at the end of the drive
 * still means something after the visitor leaves the page.
 */
export const INQUIRY_EMAIL = "stringham00@gmail.com";
export const INQUIRY_URL = "";

export function inquiryHref(tier?: TierId): string {
  if (INQUIRY_URL) {
    return tier ? `${INQUIRY_URL}?tier=${tier}` : INQUIRY_URL;
  }
  const label = tier
    ? EXIT_SIGNS.find((s) => s.tier === tier)?.label
    : undefined;
  const subject = label ? `Website inquiry — ${label}` : "Website inquiry";
  return `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/** Total project length, in weeks. Drives how many markers the road carries. */
export const PROJECT_WEEKS = 3;

/**
 * The road, in order.
 *
 * The three exits are real and quoted. The week markers exist structurally but
 * their copy is not written yet, and is left empty rather than filled with
 * plausible placeholder prose — empty renders as an obvious gap, whereas
 * plausible copy ships by accident.
 */
export const SIGNS: DriveSign[] = [
  {
    kind: "exit",
    id: "tier-one-page",
    distance: 120,
    label: "One page",
    detail:
      "Single scrolling page, mobile-ready, contact form, live on your domain.",
    tier: "one-page",
    price: 1200,
    from: true,
    includes: [
      "Single scrolling page",
      "Mobile-ready",
      "Contact form",
      "Live on your domain",
    ],
  },
  {
    kind: "exit",
    id: "tier-small-site",
    distance: 220,
    label: "Small site",
    detail:
      "Four to six pages, contact form, basic search setup, live on your domain.",
    tier: "small-site",
    price: 2800,
    from: true,
    includes: [
      "Four to six pages",
      "Contact form",
      "Basic search setup",
      "Live on your domain",
    ],
  },
  {
    kind: "exit",
    id: "tier-editable",
    distance: 320,
    label: "Site you can edit",
    detail:
      "Everything above, plus a simple editor so you change your own text and photos.",
    tier: "editable",
    price: 4500,
    from: true,
    includes: [
      "Everything in Small site",
      "A simple editor so you change your own text and photos",
    ],
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

/**
 * Ongoing, not a lane. The road forks three ways at the end and this is a
 * recurring fee rather than a project, so it rides alongside the tiers instead
 * of becoming a fourth exit.
 */
export const CARE_PLAN = {
  label: "Care plan",
  price: 125,
  cadence: "month" as const,
  detail: "Hosting, updates, backups, small changes.",
};

/** Commercial terms. Quoted on the static page; not yet placed on the road. */
export const PAYMENT_TERMS = {
  deposit:
    "50% deposit to start, 50% at launch.",
  method:
    "ACH by default — card fees on a deposit this size run about $65 against $5 for ACH.",
};

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
