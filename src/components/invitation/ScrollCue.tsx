"use client";

import styles from "./ScrollCue.module.css";

interface ScrollCueProps {
  current: number;
  total: number;
}

export default function ScrollCue({ current, total }: ScrollCueProps) {
  const className = [
    styles.scrollCue,
    current === 1 ? styles.onDark : "",
    current < total - 1 ? styles.show : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <span className={styles.cueMouse}>
        <i />
      </span>
      <span className={styles.cueText}>Keep Scrolling</span>
      <svg className={styles.cueChev} width="16" height="9" viewBox="0 0 16 9">
        <path d="M1 1l7 6 7-6" fill="none" stroke="#5f6f4c" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
