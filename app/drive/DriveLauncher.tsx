"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import styles from "./drive.module.css";

/**
 * The drive's entry point, and the thing that keeps it isolated.
 *
 * `dynamic(..., { ssr: false })` means the Drive module — and with it three,
 * @react-three/fiber and drei — is a separate chunk that is never server
 * rendered and is not fetched until <Drive> first renders. Because that only
 * happens after a click, arriving at /drive costs nothing: the page is static
 * HTML plus this small gate.
 */
const Drive = dynamic(() => import("./Drive"), { ssr: false });

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Browser capabilities are read through `useSyncExternalStore` rather than an
 * effect. It is built for exactly this: it renders `getServerSnapshot` on the
 * server and during hydration, then swaps to the live value — so there is no
 * hydration mismatch and no render-then-correct flicker.
 */
function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * WebGL support is a runtime question, not a user-agent question — the only
 * honest test is to ask for a context and see what comes back. The answer
 * cannot change during a session, so it is probed once and cached; a snapshot
 * getter may be called on every render and must stay cheap.
 */
let webglSupport: boolean | null = null;
function getWebglSupport(): boolean {
  if (webglSupport === null) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = Boolean(
        canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
      );
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

/** WebGL never changes mid-session, so there is nothing to subscribe to. */
const subscribeToNothing = () => () => {};

export default function DriveLauncher() {
  const [driving, setDriving] = useState(false);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

  const hasWebgl = useSyncExternalStore(
    subscribeToNothing,
    getWebglSupport,
    () => false,
  );

  if (!hasWebgl) return null;

  // A reduced-motion preference gets the static page, not a gentler drive.
  // Saying so is better than silently withholding the control.
  if (prefersReducedMotion) {
    return (
      <p className={styles.reducedMotion}>
        There is an animated version of this page. It is hidden because your
        system is set to reduce motion.
      </p>
    );
  }

  return (
    <>
      <button className={styles.start} onClick={() => setDriving(true)}>
        Start the drive
      </button>
      {driving && <Drive onExit={() => setDriving(false)} />}
    </>
  );
}
