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
    <section className={className}>
      <img
        className={`${styles.sideFloral} ${styles.sideFloralL} floral rotate`}
        src="/assets/spray.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.sideFloral} ${styles.sideFloralR} floral rotate d2`}
        src="/assets/spray.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <div className={innerClassName}>
        <img
          className={`${styles.heroBackdrop} floral float`}
          src="/assets/backdrop.webp"
          alt=""
          onClick={handleFloralClick}
        />
        <div className={styles.lamps}>
          <span className={styles.lamp} />
          <span className={styles.lamp} />
          <span className={styles.lamp} />
        </div>
        <div className={styles.eyebrow}>Undangan Pernikahan</div>
        <div className={styles.names}>
          Ivan Muhammad Mufid
          <span className={styles.amp}>&amp;</span>
          Banin Azzibara
        </div>
        <div className={styles.sub}>Minggu, 30 Agustus 2026 &middot; Saung Engkong Ano</div>
      </div>
    </section>
  );
}
