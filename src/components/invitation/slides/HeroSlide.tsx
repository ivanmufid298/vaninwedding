"use client";

/* eslint-disable @next/next/no-img-element */

import { useFloralClick } from "../FloralClickContext";
import styles from "./HeroSlide.module.css";

interface HeroSlideProps {
  className: string;
  innerClassName: string;
}

export default function HeroSlide({ className, innerClassName }: HeroSlideProps) {
  const handleFloralClick = useFloralClick();

  return (
    <section className={`${className} ${styles.heroSection}`}>
      {/* faint watermark layer so the background doesn't read as empty */}
      <div className={styles.bgLayer} aria-hidden="true">
        <img
          className={`${styles.bgPillar} ${styles.bgPillarLeft}`}
          src="/assets/wedding-pillar.webp"
          alt=""
        />
        <img
          className={`${styles.bgPillar} ${styles.bgPillarRight}`}
          src="/assets/wedding-pillar.webp"
          alt=""
        />
        {/* garland bridges the gap between the two corner bouquets */}
        <img className={styles.bgGarland} src="/assets/flower-decor4.webp" alt="" />
        <img className={styles.bgBloom} src="/assets/flower-decor2.webp" alt="" />
      </div>

      {/* corner florals bleed off the top edges */}
      <img
        className={`${styles.decor} ${styles.decorTopLeft} floral rotate`}
        src="/assets/top-left.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.decor} ${styles.decorTopRight} floral rotate d2`}
        src="/assets/top-right.webp"
        alt=""
        onClick={handleFloralClick}
      />

      {/* gold filigree at the bottom corners */}
      <img className={`${styles.corner} ${styles.cornerLeft}`} src="/assets/bottom-left.webp" alt="" />
      <img className={`${styles.corner} ${styles.cornerRight}`} src="/assets/bottom-right.webp" alt="" />

      <div className={innerClassName}>
        <div className={styles.crownWrap}>
          <img className={styles.crown} src="/assets/crown.webp" alt="" />
        </div>

        <div className={styles.eyebrow}>Undangan Pernikahan</div>

        <div className={`${styles.divider} ${styles.dividerSm}`}>
          <img src="/assets/stroke.webp" alt="" />
        </div>

        <div className={styles.names}>
          Ivan Muhammad Mufid
          <span className={styles.amp}>&amp;</span>
          Banin Azzibara
        </div>

        <div className={styles.divider}>
          <img src="/assets/stroke.webp" alt="" />
        </div>

        <div className={styles.date}>Minggu, 30 Agustus 2026</div>
        <div className={styles.venue}>Saung Engkong Ano</div>

        <div className={styles.stageWrap}>
          <img
            className={`${styles.stage} floral float`}
            src="/assets/wedding-stage.webp"
            alt=""
            onClick={handleFloralClick}
          />
        </div>
      </div>
    </section>
  );
}
