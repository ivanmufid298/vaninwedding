"use client";

import styles from "./ScanResultCard.module.css";

export type ScanOutcome =
  | { kind: "success"; nama: string; time: string }
  | { kind: "already"; nama: string; time: string }
  | { kind: "invalid"; message: string }
  | { kind: "error"; message: string };

interface ScanResultCardProps {
  outcome: ScanOutcome;
  onScanAgain: () => void;
}

function Glyph({ kind }: { kind: ScanOutcome["kind"] }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "success") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9.2" {...common} />
        <path d="m7.8 12.4 2.9 2.9L16.4 9.6" {...common} />
      </svg>
    );
  }
  if (kind === "already") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9.2" {...common} />
        <path d="M12 7.4v5.2l3.3 2" {...common} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" {...common} />
      <path d="m9 9 6 6M15 9l-6 6" {...common} />
    </svg>
  );
}

const HEADING: Record<ScanOutcome["kind"], string> = {
  success: "Check-in Berhasil",
  already: "Sudah Check-in",
  invalid: "Tidak Ditemukan",
  error: "Gagal Terhubung",
};

export default function ScanResultCard({ outcome, onScanAgain }: ScanResultCardProps) {
  return (
    <div className={`${styles.card} ${styles[outcome.kind]}`} role="status" aria-live="polite">
      <span className={styles.glyph}>
        <Glyph kind={outcome.kind} />
      </span>

      <h2 className={styles.heading}>{HEADING[outcome.kind]}</h2>

      {outcome.kind === "success" || outcome.kind === "already" ? (
        <>
          <p className={styles.name}>{outcome.nama}</p>
          <p className={styles.meta}>
            {outcome.kind === "already" ? "Tercatat hadir pada" : "Waktu check-in"}
            <br />
            <span className={styles.time}>{outcome.time}</span>
          </p>
        </>
      ) : (
        <p className={styles.meta}>{outcome.message}</p>
      )}

      <button type="button" className={styles.again} onClick={onScanAgain}>
        Scan Lagi
      </button>
    </div>
  );
}
