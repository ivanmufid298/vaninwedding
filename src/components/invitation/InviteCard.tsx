"use client";

/* eslint-disable @next/next/no-img-element */

import { useSearchParams } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";
import { useFloralClick } from "./FloralClickContext";
import styles from "./InviteCard.module.css";

interface InviteCardProps {
  shown: boolean;
  leaving: boolean;
  onContinue: () => void;
}

export default function InviteCard({ shown, leaving, onContinue }: InviteCardProps) {
  const handleFloralClick = useFloralClick();
  const searchParams = useSearchParams();
  const guestName = searchParams.get("to")?.trim();
  const displayName = guestName && guestName.length > 0 ? guestName : "Bapak/Ibu/Saudara/i";

  function handleDownloadClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    alert(
      "QR code kehadiran akan segera tersedia. Tombol ini akan otomatis mengunduh QR asli setelah dipasang."
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onContinue();
    }
  }

  return (
    <div
      className={`${styles.overlay}${shown ? ` ${styles.shown}` : ""}${leaving ? ` ${styles.leaving}` : ""}`}
      role="button"
      tabIndex={shown ? 0 : -1}
      aria-label="Lanjutkan ke undangan"
      onClick={onContinue}
      onKeyDown={handleKeyDown}
    >
      <img
        className={`${styles.corner} ${styles.cornerLeft} floral rotate`}
        src="/assets/spray.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.corner} ${styles.cornerRight} floral rotate d2`}
        src="/assets/spray.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <div className={styles.card}>
        <div className={styles.eyebrow}>You&apos;re Invited</div>
        <div className={styles.guestName}>{displayName}</div>

        <div className={styles.qrBox} aria-hidden="true">
          <svg viewBox="0 0 100 100" width="100" height="100">
            <rect x="6" y="6" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5" />
            <rect x="15" y="15" width="8" height="8" fill="currentColor" />
            <rect x="68" y="6" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5" />
            <rect x="77" y="15" width="8" height="8" fill="currentColor" />
            <rect x="6" y="68" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5" />
            <rect x="15" y="77" width="8" height="8" fill="currentColor" />
            <rect x="42" y="8" width="6" height="6" fill="currentColor" />
            <rect x="52" y="18" width="6" height="6" fill="currentColor" />
            <rect x="42" y="28" width="6" height="6" fill="currentColor" />
            <rect x="60" y="42" width="6" height="6" fill="currentColor" />
            <rect x="42" y="42" width="6" height="6" fill="currentColor" />
            <rect x="76" y="42" width="6" height="6" fill="currentColor" />
            <rect x="42" y="60" width="6" height="6" fill="currentColor" />
            <rect x="52" y="70" width="6" height="6" fill="currentColor" />
            <rect x="68" y="60" width="6" height="6" fill="currentColor" />
            <rect x="80" y="76" width="6" height="6" fill="currentColor" />
            <rect x="60" y="84" width="6" height="6" fill="currentColor" />
          </svg>
        </div>
        <div className={styles.qrLabel}>QR Code Kehadiran</div>

        <a className={styles.downloadBtn} href="#" onClick={handleDownloadClick}>
          Unduh QR Code
        </a>

        <div className={styles.continueHint}>Ketuk di mana saja untuk melanjutkan</div>
      </div>
    </div>
  );
}
