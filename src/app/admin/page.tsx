import type { Metadata, Viewport } from "next";
import AdminCheckIn from "./AdminCheckIn";
import styles from "./page.module.css";

/* The manifest is linked from this page's metadata rather than through Next's app/manifest.ts
   file convention. That convention emits <link rel="manifest"> into *every* page, which would
   offer the public invitation for installation too — the one thing this must not do. A static
   file in /public plus a page-level link keeps the PWA confined to /admin, and the manifest's own
   "scope": "/admin" keeps the installed app there as well. */
export const metadata: Metadata = {
  title: "Admin Check-in — Vanin Wedding",
  description: "Pencatatan kehadiran tamu melalui QR undangan.",
  // a door tool, not a page for search engines to hold on to
  robots: { index: false, follow: false },
  manifest: "/admin.webmanifest",
  /* iOS ignores the manifest's display mode on older versions and reads these instead; they are
     what makes a home-screen launch open without Safari's chrome. Page-level, so the invitation
     never advertises itself as a web app. */
  appleWebApp: {
    capable: true,
    title: "Vanin Admin",
    // the header sits on white, so dark text on a light bar is the readable pairing
    statusBarStyle: "default",
  },
  /* `capable: true` above emits the modern `mobile-web-app-capable`, which iOS only started
     honouring in 16.4. The Apple-prefixed name is the one every earlier iPhone reads, and without
     it those devices open the home-screen shortcut inside Safari's chrome instead of standalone.
     Next no longer emits it, so it is declared here by hand. */
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

/* Colours the Android task-switcher entry and the status bar of the installed app. Exported here
   rather than in the root layout so the invitation's own chrome is untouched; Next merges this
   with the layout's viewport, so width/initial-scale carry over. */
export const viewport: Viewport = {
  themeColor: "#4a5a3c",
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
