"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { NoToneMapping } from "three";
import Road from "./scene/Road";
import {
  CAMERA_HEIGHT,
  CRUISE_SPEED,
  FOG_COLOR,
  FOG_FAR,
  FOG_NEAR,
  zForDistance,
} from "./scene/space";
import { ROAD_LENGTH } from "./content";
import styles from "./drive.module.css";

/**
 * Reads a fog distance from the URL so the one value worth tuning at this
 * stage can be tried without a rebuild: /drive?fogFar=120. Falls back to the
 * value in space.ts, which is the real default.
 */
function fogFarFromUrl(): number {
  if (typeof window === "undefined") return FOG_FAR;
  const raw = new URLSearchParams(window.location.search).get("fogFar");
  const parsed = Number(raw);
  if (!raw || !Number.isFinite(parsed)) return FOG_FAR;
  // Keep it in front of the camera and behind the far clip plane.
  return Math.min(Math.max(parsed, FOG_NEAR + 5), 590);
}

/**
 * Stage 1: the road.
 *
 * The camera drives itself forward at a constant speed. Stage 5 replaces that
 * with scroll-driven motion that has mass; for now it is a fixed crawl, which
 * is enough to judge fog depth, marking density, and whether the sense of
 * speed reads at all.
 */

/**
 * Advances the camera down the road.
 *
 * `useFrame` registers a callback that react-three-fiber runs once per
 * rendered frame, just before drawing. `delta` is seconds since the previous
 * frame — multiplying by it is what makes the speed frame-rate independent,
 * so the car covers the same ground per second on a 144Hz monitor as on a
 * 60Hz one. Multiplying by nothing is the classic way to make a scene run
 * twice as fast on better hardware.
 *
 * Note this mutates `camera.position` directly rather than going through React
 * state. Sixty state updates a second would be sixty re-renders a second; the
 * whole point of the frame loop is that it sidesteps React entirely.
 */
function Driver({ onDistance }: { onDistance: (d: number) => void }) {
  const camera = useThree((state) => state.camera);
  const distance = useRef(0);

  useFrame((_, delta) => {
    // Guard against the huge delta a backgrounded tab produces when it wakes.
    const step = Math.min(delta, 0.1) * CRUISE_SPEED;
    distance.current = (distance.current + step) % ROAD_LENGTH;

    camera.position.set(0, CAMERA_HEIGHT, zForDistance(distance.current));

    // Aim straight down the road, every frame.
    //
    // This line is not optional. react-three-fiber points a newly created
    // default camera at the scene origin, and our camera sits at (0, 1.1, 0)
    // — directly above (0, 0, 0) — so "look at the origin" resolves to
    // "look at the tarmac under your own wheels", pitched 90 degrees down.
    // Zeroing the rotation restores the Three.js default of looking down -Z,
    // which is the direction of travel. Stage 5's sway will layer its sine
    // waves on top of this baseline rather than replacing it.
    camera.rotation.set(0, 0, 0);

    onDistance(distance.current);
  });

  return null;
}

/** Samples the real frame rate. Reported, never used to drive anything. */
function FpsMeter({ onSample }: { onSample: (fps: number) => void }) {
  const frames = useRef(0);
  const since = useRef(0);

  useFrame((_, delta) => {
    frames.current += 1;
    since.current += delta;
    if (since.current >= 0.5) {
      onSample(Math.round(frames.current / since.current));
      frames.current = 0;
      since.current = 0;
    }
  });

  return null;
}

export default function Drive({ onExit }: { onExit: () => void }) {
  const exitRef = useRef<HTMLButtonElement>(null);
  const [fps, setFps] = useState<number | null>(null);
  const [distance, setDistance] = useState(0);
  const [fogFar] = useState(fogFarFromUrl);

  // Pause the render loop when the tab is not visible. A backgrounded drive
  // burning GPU is pure cost, and this is the cheapest possible version of the
  // "pause when offscreen" rule.
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  useEffect(() => {
    const sync = () =>
      setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // The drive is a modal layer over the static page: lock the page behind it,
  // move focus to the way out, and honour Escape.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    exitRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onExit]);

  const handleDistance = useCallback((d: number) => {
    // Cheap throttle: the readout only needs whole units, so this re-renders
    // about twenty times a second rather than sixty.
    setDistance((prev) => (Math.abs(d - prev) > 1 ? d : prev));
  }, []);

  return (
    <div
      className={styles.stage}
      role="dialog"
      aria-modal="true"
      aria-label="The drive"
    >
      <Canvas
        // Caps the render resolution on high-density screens. Rendering a
        // retina phone at its true 3x is three times the pixels for a
        // difference nobody looking at a foggy road can see.
        dpr={[1, 1.75]}
        frameloop={frameloop}
        // react-three-fiber defaults to ACES filmic tone mapping, which is
        // built for photographic HDR scenes and noticeably crushes midtones.
        // On flat painted surfaces it just reads as "everything is too dark".
        // Turning it off makes the colours literal: the hex you type is the
        // hex that lands on screen, which is what you want for signage.
        gl={{ toneMapping: NoToneMapping }}
        camera={{
          position: [0, CAMERA_HEIGHT, 0],
          fov: 62,
          near: 0.1,
          // Comfortably past FOG_FAR, so geometry is hidden by fog rather
          // than popping out of existence at the clip plane.
          far: 600,
        }}
      >
        {/* Background and fog share one colour, always. Linear fog blends
            geometry toward its colour with distance; if the sky behind it is
            any other value, distant objects appear to dissolve into a flat
            wall hanging in mid-air instead of into the horizon. */}
        <color attach="background" args={[FOG_COLOR]} />
        <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, fogFar]} />

        {/* Overcast daylight: a broad sky-to-ground wash plus one weak sun for
            a little form on the embankments. */}
        <hemisphereLight args={["#ffffff", "#8a8578", 1.9]} />
        <directionalLight position={[-8, 12, -6]} intensity={0.55} />

        <Road />
        <Driver onDistance={handleDistance} />
        <FpsMeter onSample={setFps} />
      </Canvas>

      <div className={styles.stageChrome}>
        <p className={styles.readout}>
          <span>{Math.round(distance)} m</span>
          <span aria-hidden="true"> · </span>
          <span>{fps === null ? "—" : `${fps} fps`}</span>
        </p>
        <button ref={exitRef} className={styles.exit} onClick={onExit}>
          Skip the drive
        </button>
      </div>
    </div>
  );
}
