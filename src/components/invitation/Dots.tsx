"use client";

import styles from "./Dots.module.css";

interface DotsProps {
  total: number;
  current: number;
  show: boolean;
  onSelect: (idx: number) => void;
}

export default function Dots({ total, current, show, onSelect }: DotsProps) {
  return (
    <div className={`${styles.dots}${show ? ` ${styles.show}` : ""}`}>
      {Array.from({ length: total }, (_, idx) => (
        <button
          key={idx}
          aria-label={`Bagian ${idx + 1}`}
          className={idx === current ? styles.on : ""}
          onClick={() => onSelect(idx)}
        />
      ))}
    </div>
  );
}
