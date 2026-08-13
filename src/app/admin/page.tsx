import type { Metadata } from "next";
import AdminCheckIn from "./AdminCheckIn";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Admin Check-in — Vanin Wedding",
  description: "Pencatatan kehadiran tamu melalui QR undangan.",
  // a door tool, not a page for search engines to hold on to
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminCheckIn />
      </div>
    </main>
  );
}
