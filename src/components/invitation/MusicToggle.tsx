"use client";

import styles from "./MusicToggle.module.css";

interface MusicToggleProps {
  playing: boolean;
  show: boolean;
  onToggle: () => void;
}

export default function MusicToggle({ playing, show, onToggle }: MusicToggleProps) {
  return (
    <button
      type="button"
      className={`${styles.musicBtn}${show ? ` ${styles.show}` : ""}`}
      onClick={onToggle}
      aria-label={playing ? "Matikan musik" : "Nyalakan musik"}
      aria-pressed={playing}
      tabIndex={show ? 0 : -1}
    >
      <svg
        className={`${styles.icon}${playing ? ` ${styles.spinning}` : ""}`}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M13 2.6 6 4.3v6.4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M13 2.6v6.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="4.4" cy="11.4" r="1.9" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="11.4" cy="9.4" r="1.9" stroke="currentColor" strokeWidth="1.3" />
        {!playing && (
          <path d="M2 14 14 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
