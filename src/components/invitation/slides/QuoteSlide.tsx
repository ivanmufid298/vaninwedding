"use client";

/* eslint-disable @next/next/no-img-element */

import { useFloralClick } from "../FloralClickContext";
import styles from "./QuoteSlide.module.css";

interface QuoteSlideProps {
  className: string;
  innerClassName: string;
}

export default function QuoteSlide({ className, innerClassName }: QuoteSlideProps) {
  const handleFloralClick = useFloralClick();

  return (
    <section className={className}>
      <img
        className={`${styles.quoteCorner} ${styles.quoteCornerL} floral rotate`}
        src="/assets/spray.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.quoteCorner} ${styles.quoteCornerR} floral rotate d3`}
        src="/assets/spray.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <div className={innerClassName}>
        <p className={styles.quoteText}>
          &quot;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan
          untukmu istri-istri dari jenismu sendiri, supaya kamu cenderung dan
          merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih
          dan sayang. Sesungguhnya pada yang demikian itu benar-benar
          terdapat tanda-tanda bagi kaum yang berpikir.&quot;
        </p>
        <div className={styles.quoteSource}>Q.S. Ar-Rum : 21</div>
      </div>
    </section>
  );
}
