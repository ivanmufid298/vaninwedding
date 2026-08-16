"use client";

/* eslint-disable @next/next/no-img-element */

import { useSyncExternalStore } from "react";
import { useFloralClick } from "../FloralClickContext";
import styles from "./DetailsSlide.module.css";

interface DetailsSlideProps {
  className: string;
  innerClassName: string;
}

const VENUE = "Saung Engkong Ano";
const ADDRESS = "Jl. M. Sanun No.44-46, Harapan Jaya, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16914";
// the resepsi block sits beside its artwork at roughly half the page width, where the full address
// runs to four lines — it shows the locality, and the Lokasi block carries the address in full
const ADDRESS_SHORT = "Cibinong, Kabupaten Bogor";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Saung+Engkong+Ano,+Jl.+M.+Sanun+No.44-46,+Harapan+Jaya,+Cibinong,+Kabupaten+Bogor";

/** the moment the countdown runs to — resepsi, 11.00 WIB (UTC+7) on the wedding day */
const EVENT_AT = Date.parse("2026-08-30T11:00:00+07:00");

/* ---- countdown -------------------------------------------------------------------------------
   A ticking clock is an external system, so it is read through a store rather than mirrored into
   React state from an effect. The snapshot is a *string*, not an object: getSnapshot runs on every
   render and has to return something stable by value, or useSyncExternalStore never settles. */
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let snapshot = "0|0|0|0";

function compute(): string {
  const left = Math.max(0, EVENT_AT - Date.now());
  const s = Math.floor(left / 1000);
  return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].join("|");
}

function getSnapshot(): string {
  const next = compute();
  if (next !== snapshot) snapshot = next;
  return snapshot;
}

/** the server has no clock the client would agree with, so it renders zeros and hydrates over them */
function getServerSnapshot(): string {
  return "0|0|0|0";
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  timer ??= setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(cb);
    // the deck keeps every slide mounted, so the interval is stopped only when nothing reads it
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const UNITS = ["Hari", "Jam", "Menit", "Detik"];

function Countdown() {
  const parts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).split("|");

  return (
    <div className={styles.countdown}>
      <p className={styles.countdownLabel}>
        <span className={styles.countdownRule} aria-hidden="true" />
        Menuju Hari Bahagia
        <span className={styles.countdownRule} aria-hidden="true" />
      </p>
      <div className={styles.clock}>
        {parts.map((value, i) => (
          <div className={styles.unit} key={UNITS[i]}>
            {/* a plain rule between the figures, as asked — no ornament */}
            {i > 0 && <span className={styles.tick} aria-hidden="true" />}
            <span className={styles.value}>{value.padStart(2, "0")}</span>
            <span className={styles.unitName}>{UNITS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- icons ----------------------------------------------------------------------------------- */

function Icon({ name }: { name: "calendar" | "clock" | "pin" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
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
  }
}

export default function DetailsSlide({ className, innerClassName }: DetailsSlideProps) {
  const handleFloralClick = useFloralClick();

  return (
    <section className={`${className} ${styles.detailsSection}`}>
      {/* Taller than the viewport by design, so it scrolls its own content. The deck's wheel and
          touch handlers look for [data-slide-scroll] and hold off changing slide until this has
          been scrolled to the matching end. */}
      <div className={styles.scroller} data-slide-scroll>
        <div className={styles.page}>
          {/* The thin inset frame, drawn around the whole document rather than around the window:
              it belongs to the page like the corner bouquets do, so it holds its place against
              the content instead of sliding across it as you scroll. */}
          <div className={styles.frame} />
          {/* The same corner bouquets as before, now anchored to the ends of the document rather
              than to the window — pinned to the viewport they would hover over the middle of a
              page this long. top-loct.webp is drawn as a top-RIGHT piece (its floral mass sits at
              73% across), so the left corner takes the pre-flipped copy; flipping in CSS is not an
              option because the .rotate sway sets the whole transform every frame. */}
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

              <h2 className={styles.title}>Waktu &amp; Tempat</h2>

              <img className={styles.crownBottom} src="/assets/crown-2-loct.webp" alt="" />

              <p className={styles.intro}>
                Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk
                hadir di hari bahagia kami.
              </p>

              <Countdown />

              {/* Text and artwork in two columns, alternating which side the artwork falls on. */}
              <section className={styles.info}>
                <div className={styles.infoText}>
                  <p className={styles.eyebrow}>Waktu</p>
                  <h3 className={styles.infoTitle}>Resepsi</h3>
                  <img className={styles.infoRule} src="/assets/akad-resepsi-loct.webp" alt="" />
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
                  <p className={styles.row}>
                    <span className={styles.rowIcon}>
                      <Icon name="pin" />
                    </span>
                    <span>
                      <span className={styles.venue}>{VENUE}</span>
                      <span className={styles.address}>{ADDRESS_SHORT}</span>
                    </span>
                  </p>
                </div>
                <img className={styles.infoArt} src="/assets/ring-box.webp" alt="" />
              </section>

              <img className={styles.divider} src="/assets/date-loct.webp" alt="" />

              {/* artwork first, so the bouquet sits on the left as in the design */}
              <section className={`${styles.info} ${styles.infoFlip}`}>
                <div className={styles.infoText}>
                  {/* "Waktu", not "Info" — this block is the throw time, not a venue */}
                  <p className={styles.eyebrow}>Waktu</p>
                  <h3 className={styles.infoTitle}>Lempar Bunga</h3>
                  <img className={styles.infoRule} src="/assets/akad-resepsi-loct.webp" alt="" />
                  <p className={`${styles.row} ${styles.rowCenter}`}>
                    <span className={styles.rowIcon}>
                      <Icon name="clock" />
                    </span>
                    <span className={styles.row}>12.30 WIB</span>
                  </p>
                  <p className={styles.note}>
                    Jangan lupa untuk berdiri di barisan depan dan bersiap mendapatkan
                    keberuntungan dari lemparan bunga spesial untukmu!
                  </p>
                </div>
                <img
                  className={`${styles.infoArt} ${styles.artBouquet}`}
                  src="/assets/flower-bouquet.webp"
                  alt=""
                />
              </section>

              <img className={styles.divider} src="/assets/date-loct.webp" alt="" />

              <section className={styles.info}>
                <div className={styles.infoText}>
                  <p className={styles.eyebrow}>Info</p>
                  <h3 className={styles.infoTitle}>Lokasi</h3>
                  <img className={styles.infoRule} src="/assets/akad-resepsi-loct.webp" alt="" />
                  <p className={styles.venueLead}>{VENUE}</p>
                  <p className={styles.addressFull}>{ADDRESS}</p>
                  {/* the only Maps button on the slide */}
                  <a
                    className={styles.mapBtn}
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={styles.mapBtnIcon}>
                      <Icon name="pin" />
                    </span>
                    Lihat di Google Maps
                  </a>
                </div>
                <img className={styles.infoArt} src="/assets/wedding-venue.webp" alt="" />
              </section>

              <img className={styles.footerTop} src="/assets/footer-1-loct.webp" alt="" />
              <p className={styles.closing}>
                Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
                Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada
                kedua mempelai.
              </p>
              <img className={styles.footerBottom} src="/assets/footer-2-loct.webp" alt="" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}