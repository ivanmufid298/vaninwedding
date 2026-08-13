"use client";

import styles from "./Deck.module.css";
import HeroSlide from "./slides/HeroSlide";
import QuoteSlide from "./slides/QuoteSlide";
import GallerySlide from "./slides/GallerySlide";
import DetailsSlide from "./slides/DetailsSlide";
import RsvpSlide from "./slides/RsvpSlide";
import WishesGiftSlide from "./slides/WishesGiftSlide";

interface DeckProps {
  current: number;
}

const BACKGROUNDS = ["hero", "quote", "gallery", "details", "rsvp", "wishes"] as const;

export default function Deck({ current }: DeckProps) {
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
      <WishesGiftSlide className={sectionClassName(5)} innerClassName={styles.slideInner} />
    </div>
  );
}
