"use client";

/* eslint-disable @next/next/no-img-element */

import { useFloralClick } from "../FloralClickContext";
import styles from "./DetailsSlide.module.css";

interface DetailsSlideProps {
  className: string;
  innerClassName: string;
}

const VENUE = "Saung Engkong Ano";
const ADDRESS = "Jl. M. Sanun No.44-46, Harapan Jaya, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16914";
const MAPS_URL = "https://maps.app.goo.gl/8ibCY3s1YyinHdEv7";
// the short link can't be framed; the embed takes a plain query instead (no API key needed)
const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`;

function Icon({ name }: { name: "rings" | "glass" | "calendar" | "clock" | "pin" | "heart" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "rings":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9.5" cy="14" r="6" {...common} />
          <circle cx="15.5" cy="14" r="6" {...common} />
          <path d="M13 4.5 15.5 2l2.5 2.5-2.5 2z" {...common} />
        </svg>
      );
    case "glass":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 2h5l-1 8a1.5 1.5 0 0 1-3 0z" {...common} />
          <path d="M13 2h5l1 8a1.5 1.5 0 0 1-3 0z" {...common} />
          <path d="M8.5 11.5V21M8.5 21H6m2.5 0H11M16.5 11.5V21M16.5 21H14m2.5 0H19" {...common} />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2.5" {...common} />
          <path d="M3 10h18M8 3v4M16 3v4" {...common} />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M12 7v5.5l3.5 2" {...common} />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" {...common} />
          <circle cx="12" cy="10" r="2.6" {...common} />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 22" aria-hidden="true">
          <path
            d="M12 20.5S2.6 14.6 2.6 8.2A5.2 5.2 0 0 1 12 5.1a5.2 5.2 0 0 1 9.4 3.1c0 6.4-9.4 12.3-9.4 12.3Z"
            {...common}
          />
        </svg>
      );
  }
}

function MapsButton() {
  return (
    <a className={styles.mapBtn} href={MAPS_URL} target="_blank" rel="noopener noreferrer">
      <span className={styles.mapBtnIcon}>
        <Icon name="pin" />
      </span>
      Lihat di Google Maps
    </a>
  );
}

export default function DetailsSlide({ className, innerClassName }: DetailsSlideProps) {
  const handleFloralClick = useFloralClick();

  return (
    <section className={`${className} ${styles.detailsSection}`}>
      <img
        className={`${styles.corner} ${styles.cornerTL} floral rotate`}
        src="/assets/top-left.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.corner} ${styles.cornerTR} floral rotate d2`}
        src="/assets/top-right.webp"
        alt=""
        onClick={handleFloralClick}
      />
      {/* top-corner pieces turned 180° become bottom-corner pieces */}
      <img className={`${styles.corner} ${styles.cornerBL}`} src="/assets/top-right4.webp" alt="" />
      <img className={`${styles.corner} ${styles.cornerBR}`} src="/assets/top-left4.webp" alt="" />

      <div className={innerClassName}>
        <div className={styles.block}>
          <h2 className={styles.title}>
            Info
            <br />
            Acara &amp; Lokasi
          </h2>

          <div className={styles.ruleWrap}>
            <img className={styles.rule} src="/assets/stroke-gallery.webp" alt="" />
          </div>

          <p className={styles.intro}>
            Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk
            hadir di hari bahagia kami.
          </p>

          <div className={styles.cards}>
            <article className={styles.card}>
              <span className={styles.badge}>
                <Icon name="rings" />
              </span>
              <h3 className={styles.cardTitle}>Akad Nikah</h3>
              <span className={styles.cardDot} />
              <p className={styles.row}>
                <span className={styles.rowIcon}>
                  <Icon name="calendar" />
                </span>
                Minggu, 30 Agustus 2026
              </p>
              <p className={styles.row}>
                <span className={styles.rowIcon}>
                  <Icon name="clock" />
                </span>
                08.00 WIB
              </p>
              <span className={styles.dashed} />
              <p className={styles.venue}>
                <span className={styles.rowIcon}>
                  <Icon name="pin" />
                </span>
                {VENUE}
              </p>
              <p className={styles.address}>{ADDRESS}</p>
              <MapsButton />
            </article>

            <article className={styles.card}>
              <span className={styles.badge}>
                <Icon name="glass" />
              </span>
              <h3 className={styles.cardTitle}>Resepsi</h3>
              <span className={styles.cardDot} />
              <p className={styles.row}>
                <span className={styles.rowIcon}>
                  <Icon name="clock" />
                </span>
                11.00 WIB &ndash; Selesai
              </p>
              <span className={styles.dashed} />
              <p className={styles.venue}>
                <span className={styles.rowIcon}>
                  <Icon name="pin" />
                </span>
                {VENUE}
              </p>
              <p className={styles.address}>{ADDRESS}</p>
              <MapsButton />
            </article>
          </div>

          <article className={`${styles.card} ${styles.cardWide}`}>
            <span className={styles.badge}>
              <Icon name="pin" />
            </span>
            <div className={styles.wideRow}>
              <div className={styles.wideInfo}>
                <h3 className={styles.cardTitle}>Lokasi</h3>
                <span className={styles.cardDot} />
                <p className={styles.venue}>{VENUE}</p>
                <p className={styles.address}>{ADDRESS}</p>
                <MapsButton />
              </div>
              {/* the iframe is pointer-events:none so it can't swallow the deck's swipe/scroll;
                  the wrapping link is what actually opens Maps */}
              <a
                className={styles.mapWrap}
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Buka lokasi di Google Maps"
              >
                <iframe className={styles.map} src={MAPS_EMBED} loading="lazy" title="Peta lokasi" />
              </a>
            </div>
          </article>

          <span className={styles.heart}>
            <Icon name="heart" />
          </span>
          <p className={styles.closing}>
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
            Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada
            kedua mempelai.
          </p>
        </div>
      </div>
    </section>
  );
}
