"use client";

/* eslint-disable @next/next/no-img-element */

import { useFloralClick } from "../FloralClickContext";
import styles from "./CountdownSlide.module.css";
import type { Countdown } from "../Deck";

interface CountdownSlideProps {
  className: string;
  innerClassName: string;
  countdown: Countdown;
}

export default function CountdownSlide({ className, innerClassName, countdown }: CountdownSlideProps) {
  const handleFloralClick = useFloralClick();

  return (
    <section className={className}>
      <div className={innerClassName}>
        <div className={styles.label}>Menghitung Hari Bahagia</div>
        <div className={styles.grid}>
          <div className={styles.box}>
            <div className={styles.num}>{countdown.days}</div>
            <div className={styles.tag}>Hari</div>
          </div>
          <div className={styles.box}>
            <div className={styles.num}>{countdown.hours}</div>
            <div className={styles.tag}>Jam</div>
          </div>
          <div className={styles.box}>
            <div className={styles.num}>{countdown.mins}</div>
            <div className={styles.tag}>Menit</div>
          </div>
          <div className={styles.box}>
            <div className={styles.num}>{countdown.secs}</div>
            <div className={styles.tag}>Detik</div>
          </div>
        </div>
        <img
          className={`${styles.cdFloral} floral float`}
          src="/assets/cluster_small.webp"
          alt=""
          onClick={handleFloralClick}
        />
      </div>
    </section>
  );
}
