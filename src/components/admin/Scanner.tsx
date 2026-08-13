"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./Scanner.module.css";

/** the node html5-qrcode mounts its <video> into */
const READER_ID = "vanin-admin-reader";

export type CameraState = "starting" | "live" | "paused" | "failed";

interface ScannerProps {
  /** false parks the camera — used while a check-in is in flight and while the overlay is up */
  enabled: boolean;
  /** a decoded payload, raw; the caller decides what is and isn't an invitation id */
  onDecode: (raw: string) => void;
  onCameraState?: (state: CameraState) => void;
}

/* The camera's own state lives in this little store rather than in useState. A camera is an
   external system, and its lifecycle is driven from an effect — mirroring it back through
   setState is exactly the cascading-render pattern React now warns about. Subscribing to it with
   useSyncExternalStore says the same thing without the cascade. */
interface CameraSnapshot {
  state: CameraState;
  failMsg: string;
}

function createCameraStore() {
  let snapshot: CameraSnapshot = { state: "starting", failMsg: "" };
  const subs = new Set<() => void>();
  return {
    subscribe(cb: () => void) {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    // getSnapshot must be referentially stable between notifications, so the object is replaced
    // only when something actually changed
    get: () => snapshot,
    set(next: CameraState, failMsg = "") {
      if (snapshot.state === next && snapshot.failMsg === failMsg) return;
      snapshot = { state: next, failMsg };
      subs.forEach((s) => s());
    },
  };
}

const SERVER_SNAPSHOT: CameraSnapshot = { state: "starting", failMsg: "" };

/* The camera half of the door tool, deliberately free of decisions: it starts, it reports what it
   read, and it stops when told. Everything about guests, tokens and outcomes lives in the page. */
export default function Scanner({ enabled, onDecode, onCameraState }: ScannerProps) {
  const [store] = useState(createCameraStore);
  const { state, failMsg } = useSyncExternalStore(
    store.subscribe,
    store.get,
    () => SERVER_SNAPSHOT
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the lib ships no stable instance type
  const scannerRef = useRef<any>(null);
  /* start() and stop() are async and the effect can re-run under them, so a plain "is it running"
     flag would lie. This tracks the transition, not the result. */
  const transitioning = useRef(false);
  // kept in a ref so the decode callback, which html5-qrcode holds for the camera's lifetime,
  // always calls the current handler rather than the one from the render that started it.
  // Written in an effect, not during render — a ref is not a render-time value.
  const onDecodeRef = useRef(onDecode);
  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  const report = useCallback(
    (next: CameraState, failMsg = "") => {
      store.set(next, failMsg);
      onCameraState?.(next);
    },
    [store, onCameraState]
  );

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      /* already stopped, or the node is gone — nothing left to tear down */
    }
  }, []);

  const start = useCallback(async () => {
    if (scannerRef.current || transitioning.current) return;
    transitioning.current = true;
    try {
      // imported here, not at module scope: html5-qrcode touches document on load, which would
      // break this route's server render. It also puts the first state change after an await,
      // so mounting this component never cascades a render synchronously from its own effect.
      const { Html5Qrcode } = await import("html5-qrcode");
      report("starting");
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 12,
          // a generous square: guests hold phones at arm's length and rarely centre them
          qrbox: (w: number, h: number) => {
            const edge = Math.floor(Math.min(w, h) * 0.82);
            return { width: edge, height: edge };
          },
        },
        (decoded: string) => onDecodeRef.current(decoded),
        () => {
          /* per-frame "nothing in view" — normal, and far too noisy to surface */
        }
      );
      report("live");
    } catch (err) {
      await stop();
      /* html5-qrcode rejects with whatever getUserMedia gave it, and not always as an Error — it
         can be the bare string of the DOMException — so name and value are both folded in. */
      const detail = err instanceof Error ? `${err.name} ${err.message}` : String(err);
      report(
        "failed",
        /notallowed|notreadable|permission|denied|dismissed/i.test(detail)
          ? "Akses kamera ditolak. Izinkan kamera di pengaturan browser, lalu muat ulang halaman."
          : "Kamera tidak bisa dibuka. Pastikan halaman dibuka lewat HTTPS dan tidak ada aplikasi lain yang memakai kamera."
      );
    } finally {
      transitioning.current = false;
    }
  }, [report, stop]);

  useEffect(() => {
    if (enabled) {
      void start();
      return;
    }
    void stop().then(() => {
      // a failed camera stays failed; pausing is only meaningful for one that was working
      if (store.get().state !== "failed") report("paused");
    });
  }, [enabled, start, stop, store, report]);

  // the camera must not outlive the page
  useEffect(() => () => void stop(), [stop]);

  return (
    <div className={styles.frame}>
      {/* always mounted: html5-qrcode looks this node up by id before it will start, so creating
          it on demand would race the library */}
      <div id={READER_ID} className={styles.reader} />

      {state !== "live" && (
        <div className={styles.placeholder}>
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M4.5 8.4h2.7l1.3-2.1h6.9l1.3 2.1h2.8a1.6 1.6 0 0 1 1.6 1.6v7.2a1.6 1.6 0 0 1-1.6 1.6H4.5a1.6 1.6 0 0 1-1.6-1.6V10a1.6 1.6 0 0 1 1.6-1.6Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="13.4"
                r="3.1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </span>
          <p className={styles.placeholderTitle}>
            {state === "failed" ? "Kamera bermasalah" : state === "paused" ? "Menunggu…" : "Menyalakan kamera"}
          </p>
          <p className={styles.placeholderNote}>
            {state === "failed" ? failMsg : "QR otomatis terbaca tanpa menekan tombol."}
          </p>
        </div>
      )}
    </div>
  );
}
