"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { useFloralClick } from "../FloralClickContext";
import { useGuest } from "../GuestContext";
import { submitRsvp } from "@/lib/rsvp";
import styles from "./RsvpSlide.module.css";

interface RsvpSlideProps {
  className: string;
  innerClassName: string;
}

const RSVP_DEADLINE = "22 Agustus 2026";
const MAX_GUESTS = 10;

function Icon({ name }: { name: "check" | "cross" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "check":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="m8 12.4 2.8 2.8L16 9.6" {...common} />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="m9 9 6 6M15 9l-6 6" {...common} />
        </svg>
      );
  }
}

export default function RsvpSlide({ className, innerClassName }: RsvpSlideProps) {
  const handleFloralClick = useFloralClick();
  // the lookup itself lives in GuestProvider so the invite card and this form agree on one
  // answer and only one request is made
  const { status: link, id, displayName } = useGuest();

  const [guests, setGuests] = useState(1);
  const [attending, setAttending] = useState<"hadir" | "tidak" | null>(null);
  const [send, setSend] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [sendMsg, setSendMsg] = useState("");

  // a request counter, so a slow earlier reply can't overwrite the result of a later one
  const reqRef = useRef(0);

  const doSend = useCallback(
    async (choice: "hadir" | "tidak", pax: number) => {
      if (!id) return;
      const token = ++reqRef.current;
      setSend("sending");
      setSendMsg("");
      try {
        const { action } = await submitRsvp({
          id,
          status: choice === "hadir" ? "Hadir" : "Tidak Hadir",
          pax,
        });
        if (reqRef.current !== token) return; // superseded by a newer send
        setSend("ok");
        setSendMsg(
          action === "updated"
            ? "Konfirmasi Anda berhasil diperbarui."
            : "Konfirmasi Anda berhasil dikirim."
        );
      } catch (err) {
        if (reqRef.current !== token) return;
        setSend("error");
        setSendMsg(err instanceof Error ? err.message : "Konfirmasi gagal dikirim.");
      }
    },
    [id]
  );

  /* Tapping Hadir/Tidak Hadir is the send — there is no separate submit button. Changing the
     guest count after a choice re-sends too, otherwise the sheet would keep the pax from the
     moment of the tap; the script upserts on id, so this updates one row rather than adding
     duplicates. The delay coalesces rapid +/- taps into a single write. */
  useEffect(() => {
    if (!attending || link !== "valid") return;
    const t = setTimeout(() => void doSend(attending, guests), 450);
    return () => clearTimeout(t);
  }, [attending, guests, link, doSend]);

  return (
    <section className={`${className} ${styles.rsvpSection}`}>
      {/* top-rsvp.webp's floral mass sits at 25.7% across — it is drawn as a top-LEFT piece */}
      <img
        className={`${styles.corner} ${styles.cornerTL} floral rotate`}
        src="/assets/top-rsvp.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img className={`${styles.corner} ${styles.cornerBL}`} src="/assets/bot-left-rsvp.webp" alt="" />
      <img className={`${styles.corner} ${styles.cornerBR}`} src="/assets/bot-right-rsvp.webp" alt="" />

      {/* the double gold hairline framing the whole page */}
      <div className={styles.frame} />

      <div className={innerClassName}>
        <div className={styles.block}>
          <img className={styles.crown} src="/assets/crown-rsvp.webp" alt="" />

          <h2 className={styles.title}>RSVP</h2>

          <img className={styles.rule} src="/assets/stroke-rsvp.webp" alt="" />

          <p className={styles.intro}>
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
            Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
          </p>

          <p className={styles.sub}>Mohon konfirmasi kehadiran Anda sebelum tanggal</p>

          {/* date-rsvp.webp is a hollow frame, so the date simply sits inside it */}
          <div className={styles.datePlate}>
            <img src="/assets/date-rsvp.webp" alt="" />
            <span className={styles.dateText}>{RSVP_DEADLINE}</span>
          </div>

          <p className={styles.fieldLabel}>Kepada Bapak/Ibu/Saudara/i</p>
          <div className={styles.nameWrap}>
            <span className={styles.nameValue}>{displayName}</span>
          </div>

          <p className={styles.fieldLabel}>Jumlah Tamu</p>
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1 || link !== "valid"}
              aria-label="Kurangi jumlah tamu"
            >
              &minus;
            </button>
            <span className={styles.stepVal}>{guests}</span>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))}
              disabled={guests >= MAX_GUESTS || link !== "valid"}
              aria-label="Tambah jumlah tamu"
            >
              +
            </button>
          </div>

          <p className={styles.fieldLabel}>Konfirmasi Kehadiran</p>
          <div className={styles.choices}>
            <button
              type="button"
              className={`${styles.choice} ${attending === "hadir" ? styles.choiceOn : ""}`}
              onClick={() => setAttending("hadir")}
              disabled={link !== "valid"}
              aria-pressed={attending === "hadir"}
            >
              <span className={styles.choiceInner}>
                <span className={styles.choiceIcon}>
                  <Icon name="check" />
                </span>
                Hadir
              </span>
            </button>
            <button
              type="button"
              className={`${styles.choice} ${attending === "tidak" ? styles.choiceOn : ""}`}
              onClick={() => setAttending("tidak")}
              disabled={link !== "valid"}
              aria-pressed={attending === "tidak"}
            >
              <span className={styles.choiceInner}>
                <span className={styles.choiceIcon}>
                  <Icon name="cross" />
                </span>
                Tidak Hadir
              </span>
            </button>
          </div>

          <p className={`${styles.status} ${send === "error" || link === "invalid" || link === "error" ? styles.statusBad : ""}`}>
            {send === "sending"
              ? <>Mengirim konfirmasi<span className={styles.dots} aria-hidden="true" /></>
              : link === "checking"
              ? "Memeriksa tautan undangan…"
              : link === "invalid"
                ? "Tautan undangan tidak valid, silakan gunakan tautan yang kami kirimkan."
                : link === "error"
                  ? "Gagal memuat data undangan. Periksa koneksi Anda lalu muat ulang halaman."
                  : sendMsg || "Terima kasih atas konfirmasi dan doa terbaik dari Anda."}
          </p>

          <img className={styles.footer} src="/assets/footer-rsvp.webp" alt="" />
        </div>
      </div>
    </section>
  );
}
