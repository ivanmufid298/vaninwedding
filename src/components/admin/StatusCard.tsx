"use client";

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

/** The "Hasil Scan Terakhir" panel — the running record of who just came through. */
export default function StatusCard({ record }: { record: ScanRecord }) {
  const showsGuest = record.status === "present" || record.status === "already";

  return (
    <section className={`${styles.card} ${styles[record.status]}`} aria-live="polite">
      <header className={styles.head}>
        <div>
          <h2 className={styles.title}>Hasil Scan Terakhir</h2>
          <p className={styles.sub}>ID: {record.id}</p>
        </div>
        <span className={styles.pill}>{PILL[record.status]}</span>
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
