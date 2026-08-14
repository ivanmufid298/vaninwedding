"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./ManualEntryCard.module.css";

interface ManualEntryCardProps {
  open: boolean;
  /** true while a check-in is in flight — drives the spinner and locks the button */
  submitting: boolean;
  /** raw text; the page validates it with the same extractGuestId() the scanner uses */
  onSubmit: (raw: string) => void;
  onCancel: () => void;
}

/* The emergency lane. It stays mounted so the expand/collapse can animate, and so the input keeps
   what was typed if a check-in fails and the staff want to correct one character rather than
   retype the id. */
export default function ManualEntryCard({
  open,
  submitting,
  onSubmit,
  onCancel,
}: ManualEntryCardProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // one less tap at a door: opening the card puts the cursor in the field
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = value.trim();
    if (!id || submitting) return;
    onSubmit(id);
  }

  function handleCancel() {
    setValue("");
    onCancel();
  }

  return (
    // grid-template-rows 0fr -> 1fr animates to the content's own height, with no magic max-height
    // to outgrow. aria-hidden and inert keep the collapsed copy out of reach entirely.
    <div className={`${styles.wrap}${open ? ` ${styles.wrapOpen}` : ""}`} aria-hidden={!open}>
      <div className={styles.clip}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <header className={styles.head}>
            <span className={styles.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect
                  x="2.6"
                  y="6.2"
                  width="18.8"
                  height="11.6"
                  rx="2.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M6.4 9.9h.01M9.6 9.9h.01M12.8 9.9h.01M16 9.9h.01M17.6 13h.01M6.4 13h.01M8.6 15.6h6.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <h2 className={styles.title}>Input Manual</h2>
              <p className={styles.sub}>
                Kalau QR sulit terbaca atau jaringan bermasalah, masukkan ID tamu.
              </p>
            </div>
          </header>

          <label className={styles.label} htmlFor="manual-guest-id">
            ID Tamu
          </label>
          <input
            id="manual-guest-id"
            ref={inputRef}
            className={styles.input}
            value={value}
            /* uppercased as it is typed, so IB001 and ib001 look the same to the staff — the id
               itself is matched case-insensitively further down anyway */
            onChange={(e) => setValue(e.target.value.toUpperCase().trim())}
            placeholder="Contoh: IB001 atau VIB001"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            disabled={submitting}
            // tabbing must not reach the field while the card is closed
            tabIndex={open ? undefined : -1}
          />

          <div className={styles.actions}>
            {/* type=submit, so Enter in the field fires this without a keydown handler */}
            <button
              type="submit"
              className={styles.verify}
              disabled={!value.trim() || submitting}
              tabIndex={open ? undefined : -1}
            >
              {submitting && <span className={styles.spinner} aria-hidden="true" />}
              {submitting ? "Memverifikasi…" : "Verifikasi Manual"}
            </button>
            <button
              type="button"
              className={styles.cancel}
              onClick={handleCancel}
              disabled={submitting}
              tabIndex={open ? undefined : -1}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
