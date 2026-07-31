"use client";

/* eslint-disable @next/next/no-img-element */

import styles from "./Preloader.module.css";

interface PreloaderProps {
  hidden: boolean;
}

export default function Preloader({ hidden }: PreloaderProps) {
  return (
    <div className={`${styles.preloader}${hidden ? ` ${styles.hidden}` : ""}`}>
      <div className={styles.markWrap}>
        <img className={styles.wreath} src="/assets/preload.webp" alt="" />
        <div className={styles.mark}>I&nbsp;&amp;&nbsp;B</div>
      </div>
      {/* reserves the space IntroLabel visually occupies at this point, and is the position
          IntroLabel measures itself against while in the preload phase */}
      <div className={styles.titleSpacer} data-intro-anchor="preload" aria-hidden="true">
        The Wedding Of
      </div>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
