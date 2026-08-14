"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./InstallCard.module.css";

/** the event Chromium fires when it is willing to install; not in lib.dom yet */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "vanin.admin.installDismissed";

/* Everything this card needs to know about is outside React — a media query, the user agent, and
   a localStorage flag — so it is read through a store rather than mirrored into state by an
   effect. getSnapshot recomputes but returns the *same object* unless a value actually changed,
   which is what keeps useSyncExternalStore from looping. */
interface InstallSnapshot {
  /** already launched from the home screen, so there is nothing left to suggest */
  installed: boolean;
  /** iOS has no install prompt at all — Safari's Share sheet is the only route */
  ios: boolean;
  dismissed: boolean;
}

const SERVER_SNAPSHOT: InstallSnapshot = { installed: false, ios: false, dismissed: true };
let snapshot: InstallSnapshot = SERVER_SNAPSHOT;
const subs = new Set<() => void>();

function compute(): InstallSnapshot {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Safari's own flag, which predates display-mode and is still what iOS sets
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  const ua = window.navigator.userAgent;
  const ios =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports a Mac UA; the touch points are what give it away
    (/macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1);

  let dismissed = false;
  try {
    dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    /* storage blocked — the card simply reappears next time, which is harmless */
  }
  return { installed: standalone, ios, dismissed };
}

function getSnapshot(): InstallSnapshot {
  const next = compute();
  if (
    next.installed !== snapshot.installed ||
    next.ios !== snapshot.ios ||
    next.dismissed !== snapshot.dismissed
  ) {
    snapshot = next;
  }
  return snapshot;
}

function subscribe(cb: () => void): () => void {
  subs.add(cb);
  const mq = window.matchMedia?.("(display-mode: standalone)");
  const onChange = () => subs.forEach((s) => s());
  mq?.addEventListener?.("change", onChange);
  return () => {
    subs.delete(cb);
    mq?.removeEventListener?.("change", onChange);
  };
}

function notify() {
  subs.forEach((s) => s());
}

/* A quiet footer note, not a banner: the scanner is what the staff came for, and four people are
   working a door. It disappears once the app is installed, and stays gone once dismissed. */
export default function InstallCard() {
  const { installed, ios, dismissed } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SERVER_SNAPSHOT
  );

  /* Chromium hands over an event we are allowed to replay later. Captured in an event listener,
     so no effect writes state here — and it may never fire at all, which is the normal case
     without a service worker (see the note in the manifest docs). */
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      // holding the event back is what lets the card offer the prompt on the staff's terms
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    // fired after a successful install; the display-mode query then hides the card anyway
    const onInstalled = () => setCanPrompt(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const evt = deferred.current;
    if (!evt) return;
    deferred.current = null;
    setCanPrompt(false);
    try {
      await evt.prompt();
      await evt.userChoice;
    } catch {
      /* the prompt can only be replayed once; a refusal just leaves the instructions */
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    notify();
  }, []);

  if (installed || dismissed) return null;

  return (
    <section className={styles.card}>
      <button
        type="button"
        className={styles.summary}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect
              x="6.4"
              y="2.6"
              width="11.2"
              height="18.8"
              rx="2.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 7.4v6.4m0 0 2.4-2.4M12 13.8l-2.4-2.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={styles.summaryText}>Install Vanin Admin</span>
        <span className={`${styles.chev} ${open ? styles.chevOpen : ""}`} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="m6 9.5 6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          <p className={styles.lead}>
            Tambahkan scanner ke Home Screen agar lebih cepat digunakan saat check-in.
          </p>

          {canPrompt ? (
            <button type="button" className={styles.install} onClick={() => void install()}>
              Install Sekarang
            </button>
          ) : (
            <p className={styles.steps}>
              {ios ? "Safari → Bagikan → Add to Home Screen" : "Chrome → menu ⋮ → Add to Home Screen"}
            </p>
          )}

          <button type="button" className={styles.dismiss} onClick={dismiss}>
            Jangan tampilkan lagi
          </button>
        </div>
      )}
    </section>
  );
}
