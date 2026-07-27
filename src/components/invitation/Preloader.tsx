"use client";

import styles from "./Preloader.module.css";

interface PreloaderProps {
  hidden: boolean;
}

export default function Preloader({ hidden }: PreloaderProps) {
  return (
    <div className={`${styles.preloader}${hidden ? ` ${styles.hidden}` : ""}`}>
      <div className={styles.mark}>I&nbsp;&amp;&nbsp;B</div>
      {/* reserves the space IntroLabel visually occupies at this point, so the dots don't collide with it */}
      <div className={styles.titleSpacer} aria-hidden="true">
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
