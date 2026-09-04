"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ROAD_LENGTH } from "../content";
import { createRoadTexture } from "./roadTexture";
import { ROAD_WIDTH, TILE_LENGTH } from "./space";

/**
 * Ground, road surface, and the two embankments that hem the drive in.
 *
 * Everything here is authored as react-three-fiber JSX. Each lowercase tag is
 * a Three.js class: `<mesh>` is `new THREE.Mesh(...)`, `<planeGeometry>` is
 * `new THREE.PlaneGeometry(...)` assigned to that mesh, and `args` is the
 * constructor's argument list. React is managing a scene graph rather than a
 * DOM tree, but the mental model is the same — parents position children.
 *
 * A note on the plane rotation you will see repeatedly: `PlaneGeometry` is
 * built standing up in the XY plane, so it faces the camera like a wall.
 * Rotating it -90° about X lays it flat, which maps the plane's local +Y onto
 * world -Z — the direction of travel. That is why the road's "height" argument
 * is its length down the road.
 */

/** A margin past the last sign so the road never visibly ends in the fog. */
const RUN_OUT = 200;
const TOTAL_LENGTH = ROAD_LENGTH + RUN_OUT;

export default function Road() {
  // The renderer knows the GPU's anisotropy ceiling; asking for more than it
  // supports is silently clamped, but reading it keeps the intent honest.
  const gl = useThree((state) => state.gl);

  const roadTexture = useMemo(() => {
    const texture = createRoadTexture(gl.capabilities.getMaxAnisotropy());
    // One copy across the width, one per TILE_LENGTH down the road.
    texture.repeat.set(1, TOTAL_LENGTH / TILE_LENGTH);
    return texture;
  }, [gl]);

  // Textures hold GPU memory. React will not free that for us, so the texture
  // is disposed when this component unmounts.
  useEffect(() => () => roadTexture.dispose(), [roadTexture]);

  // The road runs from z = 0 back to z = -TOTAL_LENGTH, so its centre sits at
  // half that.
  const midZ = -TOTAL_LENGTH / 2;

  return (
    <group>
      {/* Ground. Wider than the fog can ever reveal, so there is no visible
          edge to the world. Dropped fractionally below the road so the two
          surfaces cannot z-fight along the shoulder. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, midZ]} receiveShadow={false}>
        <planeGeometry args={[600, TOTAL_LENGTH + 400]} />
        <meshLambertMaterial color="#9c9781" />
      </mesh>

      {/* Road surface. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]}>
        <planeGeometry args={[ROAD_WIDTH, TOTAL_LENGTH]} />
        <meshLambertMaterial map={roadTexture} />
      </mesh>

      {/* Embankments. Low walls either side: they give the fog something to
          eat into, which is most of what sells depth at this stage. */}
      <Embankment side={-1} midZ={midZ} />
      <Embankment side={1} midZ={midZ} />
    </group>
  );
}

function Embankment({ side, midZ }: { side: -1 | 1; midZ: number }) {
  const height = 1.3;
  const width = 3;
  // Sit the inner face just off the road edge, leaving a shoulder.
  const x = side * (ROAD_WIDTH / 2 + 1.2 + width / 2);

  return (
    <mesh position={[x, height / 2, midZ]}>
      <boxGeometry args={[width, height, TOTAL_LENGTH]} />
      <meshLambertMaterial color="#8b8574" />
    </mesh>
  );
}
