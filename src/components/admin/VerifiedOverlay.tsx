"use client";

import { useEffect } from "react";
import styles from "./VerifiedOverlay.module.css";

export type VerifiedVariant = "regular" | "vip";

export interface VerifiedGuest {
  nama: string;
  id: string;
  /** as the script formatted it, e.g. "30 Agustus 2026 • 09.14" */
  time: string;
}

interface VerifiedOverlayProps {
  guest: VerifiedGuest;
  /** "vip" swaps the whole treatment — see isVip() for who gets it */
  variant?: VerifiedVariant;
  /** fired once the overlay has had its moment; the page resumes scanning here */
  onDone: () => void;
  durationMs?: number;
}

/** how long each variant holds the screen before scanning picks up again */
const HOLD_MS: Record<VerifiedVariant, number> = { regular: 1100, vip: 2000 };

/* Sparkles are placed by hand rather than randomised: a fixed set reads as designed, where a
   random one occasionally clumps. Values are % of the card box, so they scale with it. */
const SPARKLES = [
  { top: "6%", left: "8%", delay: 0.16, size: 13 },
  { top: "-3%", left: "34%", delay: 0.3, size: 10 },
  { top: "4%", left: "88%", delay: 0.22, size: 15 },
  { top: "30%", left: "97%", delay: 0.42, size: 9 },
  { top: "78%", left: "93%", delay: 0.34, size: 12 },
  { top: "96%", left: "62%", delay: 0.48, size: 10 },
  { top: "88%", left: "12%", delay: 0.26, size: 14 },
  { top: "44%", left: "2%", delay: 0.38, size: 11 },
];

/* Chimes are synthesised rather than shipped as audio files: no asset can be late for the first
   scan of the night, which is exactly when a silent "did that work?" hurts most. The regular cue
   is a two-note major sixth; the VIP one is a slower major triad with a longer tail, which reads
   as ceremony rather than as an alert. */
function playChime(variant: VerifiedVariant) {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;

    const notes = variant === "vip" ? [1046.5, 1318.5, 1568, 2093] : [1318.5, 1760];
    const step = variant === "vip" ? 0.1 : 0.06;
    const tail = variant === "vip" ? 1.5 : 0.6;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(variant === "vip" ? 0.2 : 0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tail);

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * step);
      osc.connect(gain);
      osc.start(now + i * step);
      osc.stop(now + tail + 0.05);
    });

    // release the hardware once the tail has run, or phones accumulate live contexts all evening
    window.setTimeout(() => void ctx.close().catch(() => {}), (tail + 0.3) * 1000);
  } catch {
    /* autoplay policy, or no Web Audio — the visual and the buzz still land */
  }
}

export default function VerifiedOverlay({
  guest,
  variant = "regular",
  onDone,
  durationMs,
}: VerifiedOverlayProps) {
  const hold = durationMs ?? HOLD_MS[variant];

  useEffect(() => {
    playChime(variant);
    try {
      // a three-pulse pattern for VIP, so staff can tell the tiers apart without looking down
      navigator.vibrate?.(variant === "vip" ? [60, 45, 60, 45, 130] : 100);
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(onDone, hold);
    return () => window.clearTimeout(t);
  }, [onDone, hold, variant, guest.id]);

  return (
    <div
      className={`${styles.backdrop} ${variant === "vip" ? styles.backdropVip : ""}`}
      role="status"
      aria-live="assertive"
    >
      {variant === "vip" ? <VipCard guest={guest} /> : <RegularCard guest={guest} />}
    </div>
  );
}

function RegularCard({ guest }: { guest: VerifiedGuest }) {
  return (
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
  );
}

function VipCard({ guest }: { guest: VerifiedGuest }) {
  return (
    <div className={styles.vipCard}>
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className={styles.sparkle}
          aria-hidden="true"
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      <header className={styles.vipHead}>
        <div>
          <p className={styles.vipTitle}>VIP Verified</p>
          <p className={styles.vipSub}>Special Guest Check-in</p>
        </div>
        <span className={styles.crown} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M3.6 8.2 7 11.4l3.6-5.6a1.7 1.7 0 0 1 2.8 0L17 11.4l3.4-3.2c.9-.8 2.2.1 1.8 1.2l-2.5 7.4a1.7 1.7 0 0 1-1.6 1.1H5.9a1.7 1.7 0 0 1-1.6-1.1L1.8 9.4c-.4-1.1.9-2 1.8-1.2Z"
              fill="currentColor"
            />
          </svg>
        </span>
      </header>

      <div className={styles.vipBody}>
        <p className={styles.vipName}>{guest.nama}</p>
        <p className={styles.vipMeta}>
          {guest.id} &middot; {guest.time}
        </p>
      </div>

      <p className={styles.vipNotice}>
        <span className={styles.vipNoticeIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M12 3.4 13.7 8l4.6 1.7-4.6 1.7L12 16l-1.7-4.6L5.7 9.7 10.3 8z"
              fill="currentColor"
            />
            <path d="M18.6 15.2 19.4 17l1.8.7-1.8.7-.8 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="currentColor" />
          </svg>
        </span>
        Silakan arahkan ke jalur VIP.
      </p>
    </div>
  );
}
