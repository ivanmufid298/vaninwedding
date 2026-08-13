"use client";

import { useEffect } from "react";
import styles from "./VerifiedOverlay.module.css";

export interface VerifiedGuest {
  nama: string;
  id: string;
  /** as the script formatted it, e.g. "30 Agustus 2026 • 09.14" */
  time: string;
}

interface VerifiedOverlayProps {
  guest: VerifiedGuest;
  /** fired once the overlay has had its moment; the page resumes scanning here */
  onDone: () => void;
  durationMs?: number;
}

/* A short chime, synthesised rather than shipped as an audio file: two quick sine partials with an
   exponential decay. No asset to load means it can never be late for the first scan of the night,
   which is exactly when a silent "did that work?" hurts most. */
function playDing() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    // a major sixth reads as "done" rather than as an alarm
    [1318.5, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      osc.connect(gain);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.6);
    });

    // release the hardware once the tail has run, or phones accumulate live contexts all evening
    window.setTimeout(() => void ctx.close().catch(() => {}), 800);
  } catch {
    /* autoplay policy, or no Web Audio — the visual and the buzz still land */
  }
}

export default function VerifiedOverlay({
  guest,
  onDone,
  durationMs = 1100,
}: VerifiedOverlayProps) {
  useEffect(() => {
    playDing();
    // ignored on desktop and on iOS Safari; harmless where unsupported
    try {
      navigator.vibrate?.(100);
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(t);
  }, [onDone, durationMs, guest.id]);

  return (
    <div className={styles.backdrop} role="status" aria-live="assertive">
      <div className={styles.card}>
        <span className={styles.check} aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle className={styles.ring} cx="26" cy="26" r="23" />
            <path className={styles.tick} d="M15.5 27.2 22.6 34l14-15" />
          </svg>
        </span>

        <p className={styles.verified}>Verified</p>
        <p className={styles.name}>{guest.nama}</p>
        <p className={styles.id}>{guest.id}</p>
        <p className={styles.time}>{guest.time}</p>
      </div>
    </div>
  );
}
