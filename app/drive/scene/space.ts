/**
 * The scene's coordinate convention, in one place.
 *
 * Three.js cameras look down their own -Z by default, so "forward" along the
 * road is negative Z. Content is authored in `distance` — metres travelled,
 * counting up — and everything that places an object in the world converts
 * through `zForDistance`. Nothing else should do the negation by hand.
 */

/** Road width in world units: two 5-unit lanes. */
export const ROAD_WIDTH = 10;

/** Length of one repeat of the road markings, in world units. */
export const TILE_LENGTH = 20;

/** Seated driving eye height. */
export const CAMERA_HEIGHT = 1.1;

/**
 * Linear fog: fully clear at `FOG_NEAR`, fully fogged at `FOG_FAR`. The colour
 * is shared with the scene background — see Drive.tsx for why that matters.
 */
export const FOG_COLOR = "#b9b2a6";
export const FOG_NEAR = 30;
export const FOG_FAR = 220;

/** Cruising speed, world units per second. */
export const CRUISE_SPEED = 22;

/** Distance travelled -> world Z. */
export function zForDistance(distance: number): number {
  return -distance;
}
