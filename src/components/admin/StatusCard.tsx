"use client";

import { isVip } from "@/lib/attendance";
import styles from "./StatusCard.module.css";

export type ScanStatus = "present" | "already" | "invalid" | "error";

export interface ScanRecord {
  status: ScanStatus;
  id: string;
  nama?: string;
  time?: string;
  message: string;
}

const PILL: Record<ScanStatus, string> = {
  present: "Present",
  already: "Sudah Hadir",
  invalid: "Tidak Valid",
  error: "Gagal",
};

function NoteIcon({ status }: { status: ScanStatus }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" {...common} />
      {status === "present" ? (
        <path d="m7.9 12.4 2.9 2.9 5.4-6.1" {...common} />
      ) : status === "already" ? (
        <path d="M12 7.3v5.2l3.3 2" {...common} />
      ) : (
        <path d="M12 7.4v5.6M12 16.3v.1" {...common} />
      )}
    </svg>
  );
}

function Crown() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.6 8.2 7 11.4l3.6-5.6a1.7 1.7 0 0 1 2.8 0L17 11.4l3.4-3.2c.9-.8 2.2.1 1.8 1.2l-2.5 7.4a1.7 1.7 0 0 1-1.6 1.1H5.9a1.7 1.7 0 0 1-1.6-1.1L1.8 9.4c-.4-1.1.9-2 1.8-1.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** The "Hasil Scan Terakhir" panel — the running record of who just came through. */
export default function StatusCard({ record }: { record: ScanRecord }) {
  const showsGuest = record.status === "present" || record.status === "already";
  /* Derived from the id rather than passed in: the prefix is the only source of truth for tier,
     and the overlay reads it the same way. Tier is orthogonal to outcome, so it gets its own
     badge and a champagne card — the outcome pill keeps its own colour, or a VIP who was already
     checked in would lose that fact to the gold. */
  const vip = isVip(record.id);

  return (
    <section
      className={`${styles.card} ${styles[record.status]}${vip ? ` ${styles.vip}` : ""}`}
      aria-live="polite"
    >
      <header className={styles.head}>
        <div className={styles.headText}>
          <h2 className={styles.title}>Hasil Scan Terakhir</h2>
          <p className={styles.sub}>ID: {record.id}</p>
        </div>
        <div className={styles.tags}>
          {vip && (
            <span className={styles.vipTag}>
              <span className={styles.vipTagIcon}>
                <Crown />
              </span>
              VIP
            </span>
          )}
          <span className={styles.pill}>{PILL[record.status]}</span>
        </div>
      </header>

      <hr className={styles.rule} />

      {showsGuest ? (
        <dl className={styles.grid}>
          <div className={styles.field}>
            <dt className={styles.label}>Nama</dt>
            <dd className={styles.value}>{record.nama || "—"}</dd>
          </div>
          <div className={styles.field}>
            <dt className={styles.label}>Waktu</dt>
            <dd className={styles.value}>{record.time || "—"}</dd>
          </div>
        </dl>
      ) : null}

      <p className={styles.note}>
        <span className={styles.noteIcon}>
          <NoteIcon status={record.status} />
        </span>
        {record.message}
      </p>
    </section>
  );
}
