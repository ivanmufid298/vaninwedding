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
// the two event cards are ~139px wide, where the full address runs to four lines and would
// blow out the card's height — they show the locality, and the Lokasi card directly below
// carries the address in full
const ADDRESS_SHORT = "Cibinong, Kabupaten Bogor";
const MAPS_URL = "https://maps.app.goo.gl/8ibCY3s1YyinHdEv7";

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
      {/* top-loct.webp is drawn as a top-RIGHT corner piece (its floral mass sits at 73% across),
          so the left corner takes the pre-flipped copy. Flipping in CSS isn't an option here: the
          .rotate sway animation sets the whole transform property every frame with no scaleX term,
          so it would clobber a static scaleX(-1). */}
      <img
        className={`${styles.corner} ${styles.cornerTL} floral rotate`}
        src="/assets/top-loct-mirror.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.corner} ${styles.cornerTR} floral rotate d2`}
        src="/assets/top-loct.webp"
        alt=""
        onClick={handleFloralClick}
      />
      {/* bot-loct.webp is a bottom-RIGHT piece (mass at 70% across), so the left gets the flip */}
      <img className={`${styles.corner} ${styles.cornerBL}`} src="/assets/bot-loct-mirror.webp" alt="" />
      <img className={`${styles.corner} ${styles.cornerBR}`} src="/assets/bot-loct.webp" alt="" />

      <div className={innerClassName}>
        <div className={styles.block}>
          <img className={styles.crownTop} src="/assets/crown-loct.webp" alt="" />

          <h2 className={styles.title}>
            Acara &amp; Lokasi
          </h2>

          <img className={styles.crownBottom} src="/assets/crown-2-loct.webp" alt="" />

          <p className={styles.intro}>
            Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk
            hadir di hari bahagia kami.
          </p>

          <div className={styles.cards}>
            {/* .cardOuter/.cardInner: a pure-CSS double-line gold frame with scooped (concave)
                corners — see the stylesheet. No image asset, so padding is just padding again,
                not a percentage tied to some SVG's internal geometry. */}
            <article className={styles.cardOuter}>
              <img className={styles.badge} src="/assets/akad-loct.webp" alt="" />
              <div className={styles.cardInner}>
                <h3 className={styles.cardTitle}>Akad Nikah</h3>
                <img className={styles.cardRule} src="/assets/akad-resepsi-loct.webp" alt="" />
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
                  08.00 WIB &ndash; 10.00 WIB
                </p>
                <img className={styles.dateRule} src="/assets/date-loct.webp" alt="" />
                <p className={styles.venue}>
                  <span className={styles.rowIcon}>
                    <Icon name="pin" />
                  </span>
                  {VENUE}
                </p>
                <p className={styles.address}>{ADDRESS_SHORT}</p>
                <MapsButton />
              </div>
            </article>

            <article className={styles.cardOuter}>
              <img className={styles.badge} src="/assets/resepsi-loct.webp" alt="" />
              <div className={styles.cardInner}>
                <h3 className={styles.cardTitle}>Resepsi</h3>
                <img className={styles.cardRule} src="/assets/akad-resepsi-loct.webp" alt="" />
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
                  11.00 WIB &ndash; 13.00 WIB
                </p>
                <img className={styles.dateRule} src="/assets/date-loct.webp" alt="" />
                <p className={styles.venue}>
                  <span className={styles.rowIcon}>
                    <Icon name="pin" />
                  </span>
                  {VENUE}
                </p>
                <p className={styles.address}>{ADDRESS_SHORT}</p>
                <MapsButton />
              </div>
            </article>
          </div>

          <article className={`${styles.cardOuter} ${styles.cardWide}`}>
            <img className={styles.badge} src="/assets/icon-loct.webp" alt="" />
            <div className={styles.cardInner}>
              <div className={styles.wideRow}>
                <div className={styles.wideInfo}>
                  <h3 className={styles.cardTitle}>Lokasi</h3>
                  <img className={styles.cardRule} src="/assets/akad-resepsi-loct.webp" alt="" />
                  <p className={styles.venue}>{VENUE}</p>
                  <p className={styles.address}>{ADDRESS}</p>
                  <MapsButton />
                </div>
                {/* a printed snapshot rather than a live map — the "Lihat di Google Maps"
                    button beside it is what actually opens the location */}
                <figure className={styles.snapshot}>
                  <img src="/assets/wedding-venue.webp" alt="Saung Engkong Ano" />
                </figure>
              </div>
            </div>
          </article>

          <img className={styles.footerTop} src="/assets/footer-1-loct.webp" alt="" />
          <p className={styles.closing}>
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
            Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada
            kedua mempelai.
          </p>
          <img className={styles.footerBottom} src="/assets/footer-2-loct.webp" alt="" />
        </div>
      </div>
    </section>
  );
}
