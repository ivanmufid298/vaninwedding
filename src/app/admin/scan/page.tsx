import type { Metadata } from "next";
import AttendanceScanner from "@/components/admin/AttendanceScanner";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Scan Kehadiran — Ivan & Banin",
  description: "Halaman penerima tamu untuk mencatat kehadiran melalui QR code undangan.",
  // a door tool, not a page for search engines to hold on to
  robots: { index: false, follow: false },
};

export default function AdminScanPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Penerima Tamu</p>
          <h1 className={styles.title}>Scan Kehadiran</h1>
          <span className={styles.rule} aria-hidden="true" />
        </header>

        <AttendanceScanner />

        <p className={styles.foot}>Ivan &amp; Banin &middot; 30 Agustus 2026</p>
      </div>
    </main>
  );
}
