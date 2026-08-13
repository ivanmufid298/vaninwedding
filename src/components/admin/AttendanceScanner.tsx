"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { extractGuestId, submitAttendance } from "@/lib/rsvp";
import ScanResultCard, { type ScanOutcome } from "./ScanResultCard";
import styles from "./AttendanceScanner.module.css";

/** the element html5-qrcode mounts its video into */
const READER_ID = "attendance-reader";

type Phase = "idle" | "starting" | "scanning" | "checking" | "done" | "denied";

export default function AttendanceScanner() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [cameraMsg, setCameraMsg] = useState("");
  /** the last id sent, so re-reading the same code while the card is up doesn't fire again */
  const lastSent = useRef<string | null>(null);
  /* html5-qrcode keeps decoding for a few frames after stop() is asked for, and a guest holding
     their phone still will produce several callbacks for one code. A ref, not state, because the
     callback closes over its value synchronously — a state flag would still be false on the
     frame that follows. */
  const busy = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the lib ships no stable type for its instance
  const scannerRef = useRef<any>(null);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      /* already stopped, or the element is gone — nothing left to tear down */
    }
  }, []);

  const checkIn = useCallback(
    async (id: string) => {
      setPhase("checking");
      try {
        const res = await submitAttendance({ id });
        if (res.success) {
          setOutcome({
            kind: "success",
            nama: res.nama || id,
            time: res.attendance_time || "-",
          });
        } else if (res.code === "ALREADY_CHECKED_IN") {
          setOutcome({
            kind: "already",
            nama: res.nama || id,
            time: res.attendance_time || "-",
          });
        } else {
          // NOT_FOUND covers both "no such guest" and "hasn't RSVP'd", which is the same
          // answer at the door: this code can't be checked in
          setOutcome({
            kind: "invalid",
            message: res.message || `Data untuk ${id} tidak ditemukan.`,
          });
        }
      } catch (err) {
        setOutcome({
          kind: "error",
          message:
            err instanceof Error
              ? `${err.message}. Periksa koneksi lalu coba lagi.`
              : "Periksa koneksi lalu coba lagi.",
        });
      } finally {
        setPhase("done");
      }
    },
    []
  );

  const start = useCallback(async () => {
    setPhase("starting");
    setCameraMsg("");
    setOutcome(null);
    busy.current = false;
    lastSent.current = null;

    try {
      // imported here rather than at module scope: html5-qrcode touches document/navigator on
      // load, which would break the server render of this route
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          // a square box sized to the viewport, so the guest's code fills a useful part of it
          qrbox: (w: number, h: number) => {
            const edge = Math.floor(Math.min(w, h) * 0.75);
            return { width: edge, height: edge };
          },
        },
        (decoded: string) => {
          if (busy.current) return;
          const id = extractGuestId(decoded);
          if (!id) {
            busy.current = true;
            void stopCamera();
            setOutcome({
              kind: "invalid",
              message: "Kode ini bukan QR undangan.",
            });
            setPhase("done");
            return;
          }
          if (lastSent.current === id) return;
          busy.current = true;
          lastSent.current = id;
          void stopCamera();
          void checkIn(id);
        },
        () => {
          /* per-frame "no code in view" — normal, and far too noisy to surface */
        }
      );
      setPhase("scanning");
    } catch (err) {
      await stopCamera();
      setPhase("denied");
      /* html5-qrcode rejects with whatever getUserMedia gave it, and not always as an Error — it
         can be the bare string of the DOMException — so the name and the stringified value are
         both folded in before deciding which of the two fixes to suggest. */
      const detail = err instanceof Error ? `${err.name} ${err.message}` : String(err);
      setCameraMsg(
        /notallowed|notreadable|permission|denied|dismissed/i.test(detail)
          ? "Akses kamera ditolak. Izinkan kamera di pengaturan browser, lalu coba lagi."
          : "Kamera tidak bisa dibuka. Pastikan halaman dibuka lewat HTTPS dan tidak ada aplikasi lain yang memakai kamera."
      );
    }
  }, [checkIn, stopCamera]);

  // the camera must not keep running after the page is left
  useEffect(() => () => void stopCamera(), [stopCamera]);

  const scanning = phase === "scanning" || phase === "starting";

  return (
    <div className={styles.wrap}>
      {/* html5-qrcode needs this node to exist before start(), so it is always mounted and only
          hidden — mounting it on demand would race the library's own DOM lookup */}
      <div
        id={READER_ID}
        className={`${styles.reader}${scanning ? "" : ` ${styles.readerIdle}`}`}
      />

      {phase === "idle" && (
        <div className={styles.panel}>
          <p className={styles.lead}>
            Arahkan kamera ke QR code pada undangan tamu untuk mencatat kehadiran.
          </p>
          <button type="button" className={styles.primary} onClick={() => void start()}>
            Mulai Scan
          </button>
        </div>
      )}

      {phase === "starting" && <p className={styles.hint}>Menyalakan kamera…</p>}
      {phase === "scanning" && <p className={styles.hint}>Mencari QR code…</p>}
      {phase === "checking" && <p className={styles.hint}>Mencatat kehadiran…</p>}

      {phase === "denied" && (
        <div className={styles.panel}>
          <p className={styles.lead}>{cameraMsg}</p>
          <button type="button" className={styles.primary} onClick={() => void start()}>
            Coba Lagi
          </button>
        </div>
      )}

      {phase === "done" && outcome && (
        <ScanResultCard outcome={outcome} onScanAgain={() => void start()} />
      )}
    </div>
  );
}
