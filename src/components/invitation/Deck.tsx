"use client";

import type { MouseEvent } from "react";
import styles from "./Deck.module.css";
import HeroSlide from "./slides/HeroSlide";
import QuoteSlide from "./slides/QuoteSlide";
import GallerySlide from "./slides/GallerySlide";
import DetailsSlide from "./slides/DetailsSlide";
import RsvpSlide from "./slides/RsvpSlide";
import ClosingSlide from "./slides/ClosingSlide";

interface DeckProps {
  current: number;
  onRsvpClick: (e: MouseEvent) => void;
}

const BACKGROUNDS = ["hero", "quote", "gallery", "details", "rsvp", "closing"] as const;

export default function Deck({ current, onRsvpClick }: DeckProps) {
  function sectionClassName(i: number) {
    const parts: string[] = [styles.slide, styles[BACKGROUNDS[i]]];
    if (i === current) parts.push(styles.active);
    else if (i < current) parts.push(styles.past);
    return parts.join(" ");
  }

  return (
    <div className={styles.deck}>
      <HeroSlide className={sectionClassName(0)} innerClassName={styles.slideInner} />
      <QuoteSlide className={sectionClassName(1)} innerClassName={styles.slideInner} />
      <GallerySlide className={sectionClassName(2)} innerClassName={styles.slideInner} />
      <DetailsSlide className={sectionClassName(3)} innerClassName={styles.slideInner} />
      <RsvpSlide className={sectionClassName(4)} innerClassName={styles.slideInner} />
      <ClosingSlide
        className={sectionClassName(5)}
        innerClassName={styles.slideInner}
        onRsvpClick={onRsvpClick}
      />
    </div>
  );
}
