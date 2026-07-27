"use client";

/* eslint-disable @next/next/no-img-element */

import type { MouseEvent } from "react";
import { useFloralClick } from "../FloralClickContext";
import styles from "./ClosingSlide.module.css";

interface ClosingSlideProps {
  className: string;
  innerClassName: string;
  onRsvpClick: (e: MouseEvent) => void;
}

export default function ClosingSlide({ className, innerClassName, onRsvpClick }: ClosingSlideProps) {
  const handleFloralClick = useFloralClick();

  return (
    <section className={className}>
      <div className={innerClassName}>
        <img
          className={`${styles.vase} floral float`}
          src="/assets/vase.webp"
          alt=""
          onClick={handleFloralClick}
        />
        <p className={styles.note}>
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
          Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu
          kepada kami.
        </p>
        <a className={styles.rsvpBtn} href="#" onClick={onRsvpClick}>
          Konfirmasi Kehadiran
        </a>
        <div className={styles.sig}>Ivan &amp; Banin</div>
        <div className={styles.love}>Menantikan kehadiran Anda</div>
      </div>
    </section>
  );
}
