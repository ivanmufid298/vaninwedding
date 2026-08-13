"use client";

import { useState, type FormEvent } from "react";
import { verifyAccessCode } from "@/lib/attendance";
import styles from "./AccessCode.module.css";

interface AccessCodeProps {
  /** handed the verified token, which the page puts in sessionStorage */
  onUnlock: (token: string) => void;
}

export default function AccessCode({ onUnlock }: AccessCodeProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = verifyAccessCode(code);
    if (!token) {
      setError("Kode akses salah. Coba lagi.");
      return;
    }
    setError("");
    onUnlock(token);
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <span className={styles.badge} aria-hidden="true">
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

      <h2 className={styles.title}>Kode Akses</h2>
      <p className={styles.lead}>
        Masukkan kode untuk membuka scanner. Perangkat tetap terbuka sampai tab
        browser ditutup.
      </p>

      <input
        className={`${styles.input}${error ? ` ${styles.inputBad}` : ""}`}
        type="password"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        // the staff open this at a door on a phone; focus saves a tap
        autoFocus
        placeholder="••••••••"
        aria-label="Kode akses"
        aria-invalid={!!error}
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          if (error) setError("");
        }}
      />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={!code.trim()}>
        Start Scanner
      </button>
    </form>
  );
}
