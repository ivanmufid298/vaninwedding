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

/** how far to zoom the lens once the stream is live; clamped to what the camera actually offers */
const ZOOM_TARGET = 2;

/* Zoom has to come from the camera track, not from CSS. A transform on the <video> would magnify
   only what the operator sees — html5-qrcode decodes from the source frames, so it would still be
   reading the same wide, small-QR image while the screen implied otherwise.

   Applied straight to the track rather than through the library's applyVideoConstraints(), which
   validates against its own allow-list and does not know about zoom. Wrapped in every guard going:
   zoom is a real capability on Android Chrome, absent on iOS Safari, and asking for it there must
   be a no-op rather than a broken camera. */
async function applyZoom(readerId: string, target: number): Promise<number | null> {
  try {
    const video = document.querySelector<HTMLVideoElement>(`#${readerId} video`);
    const track = (video?.srcObject as MediaStream | null)?.getVideoTracks?.()[0];
    if (!track?.getCapabilities) return null;

    // zoom is not in the standard MediaTrackCapabilities type yet, hence the local widening
    const caps = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: { min: number; max: number; step?: number };
    };
    if (!caps.zoom) return null;

    // a lens that only goes to 1.5x should give its best, not throw OverconstrainedError
    const zoom = Math.min(caps.zoom.max, Math.max(caps.zoom.min, target));
    await track.applyConstraints({
      advanced: [{ zoom }],
    } as unknown as MediaTrackConstraints);
    return zoom;
  } catch {
    // an unsupported or refused zoom leaves the camera exactly as it was
    return null;
  }
}

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
  /* The overlay asks for a frozen preview behind it. Stopping the camera tears the <video> out,
     so the last frame is copied onto a canvas first and shown in its place. Driven through the
     DOM rather than React state: this is a picture of an external system, not app state, and
     routing it through setState inside an effect is the cascade the lint rule guards against. */
  const freezeRef = useRef<HTMLCanvasElement>(null);
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

  const freeze = useCallback(() => {
    const canvas = freezeRef.current;
    const video = document.querySelector<HTMLVideoElement>(`#${READER_ID} video`);
    if (!canvas || !video || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.style.opacity = "1";
  }, []);

  const thaw = useCallback(() => {
    const canvas = freezeRef.current;
    if (canvas) canvas.style.opacity = "0";
  }, []);

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
      thaw();
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
      // after start(), never before: the track only exists once the stream is attached. A new
      // stream is created on every resume, so the zoom is re-applied each time rather than once.
      await applyZoom(READER_ID, ZOOM_TARGET);
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
  }, [report, stop, thaw]);

  useEffect(() => {
    if (enabled) {
      void start();
      return;
    }
    // grabbed before stop(), while the <video> still has pixels in it
    freeze();
    void stop().then(() => {
      // a failed camera stays failed; pausing is only meaningful for one that was working
      if (store.get().state !== "failed") report("paused");
    });
  }, [enabled, start, stop, store, report, freeze]);

  // the camera must not outlive the page
  useEffect(() => () => void stop(), [stop]);

  return (
    <div className={styles.frame}>
      {/* always mounted: html5-qrcode looks this node up by id before it will start, so creating
          it on demand would race the library */}
      <div id={READER_ID} className={styles.reader} />
      {/* the held frame, faded in only while the camera is parked */}
      <canvas ref={freezeRef} className={styles.freeze} aria-hidden="true" />

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
