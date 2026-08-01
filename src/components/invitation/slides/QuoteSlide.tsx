"use client";

/* eslint-disable @next/next/no-img-element */

import { useFloralClick } from "../FloralClickContext";
import styles from "./QuoteSlide.module.css";

interface QuoteSlideProps {
  className: string;
  innerClassName: string;
}

function Divider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <img src="/assets/stroke2.webp" alt="" />
    </div>
  );
}

function Heart() {
  return (
    <svg className={styles.heart} viewBox="0 0 24 22" aria-hidden="true">
      <path
        d="M12 20.5S2.6 14.6 2.6 8.2A5.2 5.2 0 0 1 12 5.1a5.2 5.2 0 0 1 9.4 3.1c0 6.4-9.4 12.3-9.4 12.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export default function QuoteSlide({
  className,
  innerClassName,
}: QuoteSlideProps) {
  const handleFloralClick = useFloralClick();

  return (
    <section className={className}>
      <img
        className={`${styles.topFloral} ${styles.topFloralLeft} floral rotate`}
        src="/assets/top-left4.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.topFloral} ${styles.topFloralRight} floral rotate d2`}
        src="/assets/top-right4.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.corner} ${styles.cornerLeft}`}
        src="/assets/bottom-left2.webp"
        alt=""
      />
      <img
        className={`${styles.corner} ${styles.cornerRight}`}
        src="/assets/bottom-right2.webp"
        alt=""
      />

      <div className={innerClassName}>
        {/* nested rather than restyling slideInner, so there is no cross-module specificity fight */}
        <div className={styles.doaBlock}>
          <div className={styles.crownWrap}>
            <img className={styles.crown} src="/assets/crown.webp" alt="" />
          </div>

          <div className={styles.eyebrow}>Doa Untuk</div>
          <h2 className={styles.title}>Pengantin</h2>

          <Divider />

          <p className={styles.arabic} lang="ar" dir="rtl">
            بَارَكَ اللهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي
            خَيْرٍ
          </p>
          <p className={styles.translit}>
            &ldquo;Barakallahu laka wa baraka &lsquo;alaika wa jama&rsquo;a
            bainakuma fii khair.&rdquo;
          </p>

          <Divider />

          <p className={styles.body}>
            Ya Allah,
            <br />
            Jadikanlah pernikahan ini sebagai ibadah yang Engkau ridai.
            Anugerahkan kepada kedua mempelai keluarga yang sakinah, mawaddah,
            wa rahmah.
          </p>

          <Heart />
          <Divider />

          <p className={styles.body}>
            &ldquo;Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan
            untukmu pasangan dari jenismu sendiri agar kamu memperoleh
            ketenangan hati kepadanya, dan Dia menjadikan di antaramu rasa kasih
            dan sayang.&rdquo;
          </p>
          <div className={styles.source}>(QS. Ar-Rum : 21)</div>

          <Heart />

          <p className={styles.body}>
            Semoga Allah senantiasa melimpahkan keberkahan, kesehatan,
            kebahagiaan, serta keturunan yang shalih dan shalihah.
          </p>
        </div>
      </div>
    </section>
  );
}
