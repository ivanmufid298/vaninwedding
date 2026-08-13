"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import AccessCode from "@/components/admin/AccessCode";
import Scanner, { type CameraState } from "@/components/admin/Scanner";
import StatusCard, { type ScanRecord } from "@/components/admin/StatusCard";
import VerifiedOverlay, { type VerifiedGuest } from "@/components/admin/VerifiedOverlay";
import {
  extractGuestId,
  isVip,
  readServerToken,
  readToken,
  storeToken,
  submitAttendance,
  subscribeToken,
} from "@/lib/attendance";
import styles from "./AdminCheckIn.module.css";

/** how long a refusal card holds the camera before scanning picks up again */
const RESUME_AFTER_REFUSAL_MS = 1400;
/** the same code read twice inside this window is the same guest still standing there */
const SAME_CODE_COOLDOWN_MS = 4000;

export default function AdminCheckIn() {
  /* read straight from the session store: the server snapshot is always null, so SSR renders the
     access screen and the client swaps in the unlocked view after hydration without a mismatch */
  const token = useSyncExternalStore(subscribeToken, readToken, readServerToken);

  const [camera, setCamera] = useState<CameraState>("starting");
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [verified, setVerified] = useState<VerifiedGuest | null>(null);
  const [online, setOnline] = useState(true);

  /* Guards, all refs: the decode callback runs from the camera loop, outside React's render, so a
     state flag would still read stale on the very next frame — which is exactly when a second
     decode of the same code arrives. */
  const inFlight = useRef(false);
  const lastSeen = useRef<{ id: string; at: number } | null>(null);
  const resumeTimer = useRef<number | null>(null);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    },
    []
  );

  // storeToken notifies the store, which re-renders this component with the new snapshot
  const unlock = useCallback((issued: string) => storeToken(issued), []);

  const resume = useCallback(() => {
    inFlight.current = false;
    setBusy(false);
    setVerified(null);
  }, []);

  const handleDecode = useCallback(
    async (raw: string) => {
      if (inFlight.current) return;

      const id = extractGuestId(raw);
      if (!id) {
        inFlight.current = true;
        setBusy(true);
        setRecord({
          status: "invalid",
          id: "—",
          message: "Kode ini bukan QR undangan.",
        });
        resumeTimer.current = window.setTimeout(resume, RESUME_AFTER_REFUSAL_MS);
        return;
      }

      // the guest is probably still holding their phone up; don't check them in twice
      const seen = lastSeen.current;
      if (seen && seen.id === id && Date.now() - seen.at < SAME_CODE_COOLDOWN_MS) return;

      inFlight.current = true;
      lastSeen.current = { id, at: Date.now() };
      setBusy(true);
      // the overlay is gone in a second or two; the card is what staff still have to act on
      const vipNote = isVip(id) ? " Silakan arahkan ke jalur VIP." : "";

      try {
        const res = await submitAttendance({ id }, token);

        if (res.success) {
          const guest = { nama: res.nama || id, id, time: res.attendance_time || "—" };
          setRecord({
            status: "present",
            id,
            nama: guest.nama,
            time: guest.time,
            message: `Check-in berhasil dicatat.${vipNote}`,
          });
          // the overlay owns the pause from here; it calls resume() when it fades
          setVerified(guest);
          return;
        }

        if (res.code === "ALREADY_CHECKED_IN") {
          setRecord({
            status: "already",
            id,
            nama: res.nama,
            time: res.attendance_time,
            message: `Tamu ini sudah check-in sebelumnya.${vipNote}`,
          });
        } else {
          // NOT_FOUND covers "no such guest" and "hasn't RSVP'd" — one answer at a door
          setRecord({
            status: "invalid",
            id,
            message: res.message || "Data tamu tidak ditemukan.",
          });
        }
      } catch (err) {
        // a failed send must not poison the cooldown — this guest still needs checking in
        lastSeen.current = null;
        setRecord({
          status: "error",
          id,
          message:
            err instanceof Error
              ? `${err.message}. Periksa koneksi lalu scan ulang.`
              : "Periksa koneksi lalu scan ulang.",
        });
      }

      resumeTimer.current = window.setTimeout(resume, RESUME_AFTER_REFUSAL_MS);
    },
    [token, resume]
  );

  if (!token) {
    return (
      <div className={styles.gate}>
        <Header />
        <AccessCode onUnlock={unlock} />
      </div>
    );
  }

  return (
    <>
      <Header />

      <section className={styles.scannerCard}>
        <div className={styles.scannerHead}>
          <div>
            <h2 className={styles.scannerTitle}>
              {camera === "live" ? "Scanner Aktif" : "Scanner"}
            </h2>
            <p className={styles.scannerSub}>Arahkan kamera ke QR tamu</p>
          </div>
          <span className={styles.qrGlyph} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M14 14h2.5v2.5H14zM19.5 14H20v2.5M14 19.5h2.5V20M19.5 19.5H20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>

        <Scanner
          // parked while a check-in is in flight and while the overlay is up
          enabled={!busy}
          onDecode={(raw) => void handleDecode(raw)}
          onCameraState={setCamera}
        />

        <div className={styles.statusBar}>
          <span className={styles.statusItem}>
            <span
              className={`${styles.dot} ${online ? styles.dotOn : styles.dotOff}`}
              aria-hidden="true"
            />
            {online ? "Online" : "Offline"}
          </span>
          <span className={styles.statusItem}>
            <span className={styles.tick} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="m8 12.4 2.8 2.8L16 9.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {busy ? "Memproses" : camera === "live" ? "Ready" : "Standby"}
          </span>
        </div>
      </section>

      {record ? (
        <StatusCard record={record} />
      ) : (
        <p className={styles.empty}>
          Belum ada tamu yang di-scan. Hasil scan terakhir akan muncul di sini.
        </p>
      )}

      <p className={styles.foot}>
        Scanner berjalan terus — hasil muncul otomatis, tanpa menekan tombol.
      </p>

      {verified && (
        <VerifiedOverlay
          guest={verified}
          /* tier is read off the id prefix on the client — the sheet and the Apps Script
             know nothing about VIPs */
          variant={isVip(verified.id) ? "vip" : "regular"}
          onDone={resume}
        />
      )}
    </>
  );
}

function Header() {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.brand}>Vanin Wedding</h1>
        <p className={styles.role}>Admin Check-in</p>
      </div>
      <span className={styles.shield} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path
            d="M12 2.8 19 5.6v5.5c0 4.4-2.9 8.3-7 9.5-4.1-1.2-7-5.1-7-9.5V5.6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="m8.9 12.2 2.1 2.1 4.1-4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </header>
  );
}
