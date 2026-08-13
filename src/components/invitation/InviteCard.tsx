"use client";

/* eslint-disable @next/next/no-img-element */

import type { KeyboardEvent } from "react";
import { useGuest } from "./GuestContext";
import GuestQrCard from "../qr/GuestQrCard";
import styles from "./InviteCard.module.css";

interface InviteCardProps {
  shown: boolean;
  leaving: boolean;
  onContinue: () => void;
}

export default function InviteCard({
  shown,
  leaving,
  onContinue,
}: InviteCardProps) {
  const { status, displayName, id } = useGuest();
  // only a definitive "not on the guest list" closes the door. A network failure ("error") is
  // not proof of anything, so those guests are let through — the RSVP form still holds back.
  const isNotInvited = status === "invalid";
  const isChecking = status === "checking";
  const blocked = isNotInvited || isChecking;

  function handleContainerClick() {
    if (blocked) return;
    onContinue();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (blocked) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onContinue();
    }
  }

  return (
    <div
      className={`${styles.overlay}${shown ? ` ${styles.shown}` : ""}${leaving ? ` ${styles.leaving}` : ""}`}
      role={blocked ? undefined : "button"}
      tabIndex={blocked ? -1 : shown ? 0 : -1}
      aria-label={blocked ? undefined : "Lanjutkan ke undangan"}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
    >
      {/* Decoration only. This screen promises "tap anywhere to continue", so these must not
          swallow the tap — they are pointer-events:none rather than petal-burst targets. */}
      <img
        className={styles.bgWatermark}
        src="/assets/flower-decor4.webp"
        alt=""
        aria-hidden="true"
      />

      <img
        className={`${styles.corner} ${styles.cornerLeft} floral rotate`}
        src="/assets/top-left3.webp"
        alt=""
        aria-hidden="true"
      />
      <img
        className={`${styles.corner} ${styles.cornerRight} floral rotate d2`}
        src="/assets/top-right2.webp"
        alt=""
        aria-hidden="true"
      />

      <img
        className={`${styles.bottomBand} floral`}
        src="/assets/flower-decor2.webp"
        alt=""
        aria-hidden="true"
      />
      {/* holds the perspective so the card keeps its 3D flip now that it has a sibling */}
      <div className={styles.stack}>
        <div className={styles.card}>
          {/* decorative border; sits behind cardBody so it never covers the text */}
          <div className={styles.frame} aria-hidden="true" />
          <div className={styles.cardBody}>
            {/* The invited layout is always laid out — while the lookup is in flight, or when
                the guest isn't on the list, it is only made invisible. That keeps the card one
                height across all three states instead of collapsing to a squat box, and
                visibility:hidden also drops the download link out of the tab order. */}
            <div
              className={blocked ? styles.reserve : undefined}
              aria-hidden={blocked}
            >
              <div className={styles.eyebrow}>You&apos;re Invited</div>
              <div className={styles.guestName}>{displayName}</div>

              {/* keepSpace so a guest with no id still reserves the plate's height — the block
                  doubles as the spacer that keeps all three card states the same size */}
              <GuestQrCard value={id} keepSpace />

              <p className={styles.qrHint}>
                Tunjukkan kode ini kepada penerima tamu saat tiba di lokasi.
              </p>
            </div>

            {/* stacked over the reserved space above, centred in it */}
            {blocked && (
              <div className={styles.stateLayer}>
                {isChecking ? (
                  <>
                    <div className={styles.eyebrow}>Mohon Tunggu</div>
                    <div className={styles.guestName}>Memuat undangan…</div>
                  </>
                ) : (
                  <>
                    <div className={styles.eyebrow}>Sorry</div>
                    <div className={styles.guestName}>
                      You&apos;re Not Invited
                    </div>
                    <p className={styles.notInvitedNote}>
                      Sepertinya tautan ini bukan untukmu. Coba hubungi mempelai
                      untuk mendapatkan undangan yang benar, ya.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {/* outside the card: inside it, this line ran across the frame's bottom-right floral */}
        {!blocked && (
          <div className={styles.continueHint}>
            Ketuk di mana saja untuk melanjutkan
          </div>
        )}
      </div>
    </div>
  );
}
