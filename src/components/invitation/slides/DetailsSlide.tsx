"use client";

/* eslint-disable @next/next/no-img-element */

import { useFloralClick } from "../FloralClickContext";
import styles from "./DetailsSlide.module.css";

interface DetailsSlideProps {
  className: string;
  innerClassName: string;
}

export default function DetailsSlide({ className, innerClassName }: DetailsSlideProps) {
  const handleFloralClick = useFloralClick();

  return (
    <section className={className}>
      <div className={innerClassName}>
        <div className={styles.title}>Resepsi Pernikahan</div>
        <div className={styles.subtitle}>Dengan penuh syukur, kami mengundang Anda</div>
        <img
          className={`${styles.cluster} floral float`}
          src="/assets/cluster.webp"
          alt=""
          onClick={handleFloralClick}
        />
        <div className={styles.card}>
          <h3>Saung Engkong Ano</h3>
          <p>Pukul 10.30 &mdash; 12.30 WIB</p>
          <span className={styles.day}>Minggu, 30 Agustus 2026</span>
        </div>
      </div>
    </section>
  );
}
