import * as THREE from "three";
import { ROAD_WIDTH, TILE_LENGTH } from "./space";

/** Pixels per world unit in the generated bitmap. */
const PPU = 25.6;

/**
 * Paints the road surface — asphalt, two solid edge lines, one dashed centre
 * line — into a <canvas> and hands it to Three.js as a texture.
 *
 * Drawing it in code rather than shipping a .png means zero bytes over the
 * wire and no image decode, and the markings stay editable as numbers.
 *
 * Two Three.js concepts here:
 *
 * - **Wrapping.** A texture's coordinates run 0..1 across the surface. Setting
 *   `wrapT = RepeatWrapping` and `repeat.y = n` tells the GPU to tile the
 *   image n times down the road's length instead of stretching one copy over
 *   740 units, which would smear the dashes into unreadable streaks. Across
 *   the width we want exactly one copy, so `wrapS` stays clamped.
 *
 * - **Anisotropic filtering.** The road recedes to the horizon, so far-away
 *   pixels are sampled at a punishing angle. Without anisotropy the lane lines
 *   dissolve into shimmering noise a short way out. It is the single highest
 *   value-per-cost setting on a surface like this.
 */
export function createRoadTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(ROAD_WIDTH * PPU); // 256
  canvas.height = Math.round(TILE_LENGTH * PPU); // 512

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas unavailable — cannot build the road texture.");
  }

  const u = (units: number) => units * PPU;

  // Asphalt. Warm mid-grey so it sits under the fog colour rather than
  // fighting it.
  ctx.fillStyle = "#57534b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Solid edge lines, inset from the shoulder.
  const edgeInset = 0.45;
  const edgeWidth = 0.2;
  ctx.fillStyle = "#cfc9bd";
  ctx.fillRect(u(edgeInset), 0, u(edgeWidth), canvas.height);
  ctx.fillRect(
    canvas.width - u(edgeInset + edgeWidth),
    0,
    u(edgeWidth),
    canvas.height,
  );

  // Dashed centre line. One dash per tile, drawn from the tile's top edge so
  // the pattern repeats seamlessly.
  const dashWidth = 0.16;
  const dashLength = 6;
  ctx.fillStyle = "#c9b071";
  ctx.fillRect(
    canvas.width / 2 - u(dashWidth) / 2,
    0,
    u(dashWidth),
    u(dashLength),
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  // Bitmaps that carry colour must be tagged sRGB, or Three.js treats the
  // values as linear and the road comes out visibly washed out.
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}
