import type { Metadata } from "next";
import styles from "./drive.module.css";
import DriveLauncher from "./DriveLauncher";
import {
  CARE_PLAN,
  CAUTION_SIGNS,
  EXIT_SIGNS,
  MARKER_SIGNS,
  PAYMENT_TERMS,
  PROJECT_WEEKS,
  contentGaps,
  inquiryHref,
} from "./content";

export const metadata: Metadata = {
  title: "Services and pricing — Stringham Sites",
  description:
    "Website tiers, prices, a three-week timeline, and what I need from you to hit it.",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function DrivePage() {
  const gaps = contentGaps();

  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <p className={styles.eyebrow}>Services</p>
        <h1 className={styles.title}>
          What a site costs, how long it takes, and what I need from you.
        </h1>
        <p className={styles.lede}>
          Three tiers, a {PROJECT_WEEKS}-week build, and a short list of things
          only you can hand me. Everything is on this page — no forms to fill
          in before you can see a price.
        </p>
        <div className={styles.actions}>
          <a className={styles.cta} href={inquiryHref()}>
            Start a project
          </a>
          {/* Mounts the 3D drive only where it can actually run, and only
              after a deliberate click. Renders nothing otherwise, which
              leaves this page standing on its own. */}
          <DriveLauncher />
        </div>
      </header>

      {gaps.length > 0 && (
        <aside className={styles.gaps} aria-label="Unfinished content">
          <p className={styles.gapsTitle}>
            This page is not finished. Still to write:
          </p>
          <ul>
            {gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </aside>
      )}

      <section className={styles.section} aria-labelledby="pricing">
        <h2 className={styles.sectionTitle} id="pricing">
          Pricing
        </h2>
        <ul className={styles.tiers}>
          {EXIT_SIGNS.map((tier) => (
            <li className={styles.tier} key={tier.id}>
              <p className={styles.tierName}>{tier.label}</p>
              <p className={styles.price}>
                {tier.from && <span className={styles.from}>from </span>}
                {money.format(tier.price)}
              </p>
              <p className={styles.tierDetail}>{tier.detail}</p>
              {tier.includes.length > 0 && (
                <ul className={styles.includes}>
                  {tier.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              <a className={styles.tierCta} href={inquiryHref(tier.tier)}>
                Choose this tier
              </a>
            </li>
          ))}
        </ul>

        <div className={styles.terms}>
          <p className={styles.carePlan}>
            <span className={styles.carePlanName}>{CARE_PLAN.label}</span>{" "}
            <span className={styles.carePlanPrice}>
              {money.format(CARE_PLAN.price)}/{CARE_PLAN.cadence}
            </span>{" "}
            — {CARE_PLAN.detail}
          </p>
          <p className={styles.termsLine}>{PAYMENT_TERMS.deposit}</p>
          <p className={styles.termsLine}>{PAYMENT_TERMS.method}</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="timeline">
        <h2 className={styles.sectionTitle} id="timeline">
          Timeline
        </h2>
        <ol className={styles.timeline}>
          {MARKER_SIGNS.map((marker) => (
            <li className={styles.week} key={marker.id}>
              <p className={styles.weekNumber}>
                <span className={styles.weekLabel}>Week</span> {marker.week}
              </p>
              <div>
                <p className={styles.weekName}>{marker.label}</p>
                <p className={styles.weekDetail}>{marker.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="requirements">
        <h2 className={styles.sectionTitle} id="requirements">
          What I need from you
        </h2>
        <p className={styles.sectionLede}>
          The {PROJECT_WEEKS}-week timeline assumes these arrive when I ask for
          them. Every day one of them is outstanding is a day the build sits
          still.
        </p>
        {CAUTION_SIGNS.length > 0 ? (
          <ul className={styles.requirements}>
            {CAUTION_SIGNS.map((req) => (
              <li className={styles.requirement} key={req.id}>
                <p className={styles.requirementName}>{req.label}</p>
                <p className={styles.requirementDetail}>{req.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.pending}>Not written yet.</p>
        )}
      </section>

      <footer className={styles.footer}>
        <p>
          Ready, or want to talk it through first?{" "}
          <a href={inquiryHref()}>Start a project</a>.
        </p>
      </footer>
    </main>
  );
}
