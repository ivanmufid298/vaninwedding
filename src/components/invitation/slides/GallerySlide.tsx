"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useState } from "react";
import { useFloralClick } from "../FloralClickContext";
import styles from "./GallerySlide.module.css";

interface GallerySlideProps {
  className: string;
  innerClassName: string;
}

/* Display-sized copies, not the masters. The originals run to 4000x6000 — 24 megapixels, which a
   phone must decode to a ~96 MB bitmap each and then resample down to a ~340px box on every frame
   of the slide. The files are small (WebP compresses them well); it is the decode and the memory
   that cost. The masters stay in /assets untouched. */
const PHOTOS = [
  "/assets/gallery/photo-1.webp",
  "/assets/gallery/photo-2.webp",
  "/assets/gallery/photo-3.webp",
  "/assets/gallery/photo-4.webp",
  "/assets/gallery/photo-5.webp",
];

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 12 20" width="12" height="20" aria-hidden="true">
      <path
        d={dir === "prev" ? "M10 1 2 10l8 9" : "M2 1l8 9-8 9"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function GallerySlide({ className, innerClassName }: GallerySlideProps) {
  const handleFloralClick = useFloralClick();
  const [idx, setIdx] = useState(0);
  const n = PHOTOS.length;

  const go = useCallback(
    (step: number) => setIdx((i) => (i + step + n) % n),
    [n]
  );

  return (
    <section className={`${className} ${styles.gallerySection}`}>
      <img
        className={`${styles.corner} ${styles.cornerTL} floral rotate`}
        src="/assets/top-left-gallery.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.corner} ${styles.cornerTR} floral rotate d2`}
        src="/assets/top-right-gallery.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img className={`${styles.corner} ${styles.cornerBL}`} src="/assets/bot-left-gallery.webp" alt="" />
      <img className={`${styles.corner} ${styles.cornerBR}`} src="/assets/bot-right-gallery.webp" alt="" />

      <div className={innerClassName}>
        <div className={styles.block}>
          <div className={styles.crownWrap}>
            <img className={styles.crown} src="/assets/crown-gallery.webp" alt="" />
          </div>

          <div className={styles.eyebrow}>Our Moments</div>
          <h2 className={styles.title}>Foto Kita</h2>

          <div className={`${styles.strokeWrapH} ${styles.strokeWrapHLg}`}>
            <img className={styles.strokeH} src="/assets/stroke-gallery.webp" alt="" />
          </div>

          <p className={styles.subtitle}>
            Setiap momen bersama adalah cerita yang tak ingin kami lewatkan.
          </p>

          <div className={styles.carousel}>
            {PHOTOS.map((src, i) => {
              // shortest-path offset so the strip wraps around
              let off = i - idx;
              if (off > n / 2) off -= n;
              if (off < -n / 2) off += n;
              // off-strip photos park on their own side so they slide in from the edge
              const cls =
                off === 0
                  ? `${styles.slot} ${styles.slotCenter}`
                  : Math.abs(off) === 1
                    ? `${styles.slot} ${off < 0 ? styles.slotLeft : styles.slotRight}`
                    : `${styles.slot} ${off < 0 ? styles.slotHiddenLeft : styles.slotHiddenRight}`;
              return (
                <div className={cls} key={src}>
                  {/* async decoding keeps a photo's decode off the frame that reveals the slide */}
                  <img className={styles.photo} src={src} alt="" decoding="async" />
                  {/* dims the neighbours by compositing one flat colour, rather than running a
                      brightness/saturate filter over the whole bitmap every frame */}
                  <span className={styles.shade} aria-hidden="true" />
                  {off === 0 && (
                    <img
                      className={styles.photoFrame}
                      src="/assets/gallery/frame-gallery.webp"
                      alt=""
                      decoding="async"
                    />
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={() => go(-1)}
              aria-label="Foto sebelumnya"
            >
              <Chevron dir="prev" />
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={() => go(1)}
              aria-label="Foto berikutnya"
            >
              <Chevron dir="next" />
            </button>
          </div>

          <div className={styles.dots}>
            {PHOTOS.map((src, i) => (
              <button
                type="button"
                key={src}
                className={i === idx ? styles.dotOn : styles.dot}
                onClick={() => setIdx(i)}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>

          <div className={styles.aboutHead}>
            <span className={styles.aboutRule}>
              <img src="/assets/about-gallery.webp" alt="" />
            </span>
            <span className={styles.aboutLabel}>Tentang Kami</span>
            {/* same asset flipped so its ornament points back toward the label */}
            <span className={`${styles.aboutRule} ${styles.aboutRuleFlip}`}>
              <img src="/assets/about-gallery.webp" alt="" />
            </span>
          </div>

          <div className={styles.couple}>
            <div className={styles.person}>
              <div className={styles.nameOrnWrapSm}>
                <img className={styles.nameOrn} src="/assets/name-gallery.webp" alt="" />
              </div>
              <h3 className={styles.personName}>Ivan Muhammad Mufid, S.Kom</h3>
              <div className={styles.strokeWrapH}>
                <img className={styles.strokeH} src="/assets/stroke-gallery.webp" alt="" />
              </div>
              <p className={styles.personMeta}>
                Putra kedua dari
                <br />
                Bapak Arif Chaeruddin
                <br />
                dan Ibu Puji Hartini
              </p>
            </div>

            <img className={styles.vRule} src="/assets/stroke-gallery.webp" alt="" aria-hidden="true" />

            <div className={styles.person}>
              <div className={styles.nameOrnWrapSm}>
                <img className={styles.nameOrn} src="/assets/name-gallery.webp" alt="" />
              </div>
              <h3 className={styles.personName}>Banin Azzibara, S.Ars</h3>
              <div className={styles.strokeWrapH}>
                <img className={styles.strokeH} src="/assets/stroke-gallery.webp" alt="" />
              </div>
              <p className={styles.personMeta}>
                Putri kedua dari
                <br />
                Bapak Yusuf
                <br />
                dan Ibu Dahliawati
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
