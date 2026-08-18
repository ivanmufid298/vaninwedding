"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGuest } from "../GuestContext";
import { fetchWishes, submitWish, type WishEntry } from "@/lib/rsvp";
import styles from "./WishesGiftSlide.module.css";

interface WishesGiftSlideProps {
  className: string;
  innerClassName: string;
}

/** one card on the wall, mapped from a Wish sheet row */
interface Wish {
  /** the sheet has no id column, so the key is built from the row's own content instead of a
   *  batch-local index, which would collide as batches are swapped in and out */
  key: string;
  name: string;
  message: string;
  /** already formatted by the script, e.g. "12 Agustus 2026 • 11.50" */
  when: string;
}

/** the cursor that produced a batch — null means "the newest page", which needs no cursor */
type Cursor = { before: string | null; beforeRow: number | null } | null;

const ACCOUNTS = [
  { bank: "BCA", logo: "/assets/bca.webp", holder: "Banin Azzibara", number: "8692136801" },
  { bank: "BCA", logo: "/assets/bca.webp", holder: "Ivan Muhammad Mufid", number: "0700340872" },
];

/** cards visible at once — must match the .wish flex-basis in the stylesheet */
const PER_VIEW = 2;
/** wishes fetched per batch, both for the initial load and every "load more" page */
const WISH_PAGE_SIZE = 10;
const AUTOPLAY_MS = 5000;
/** how long a manual swipe or dot tap pauses the auto-advance */
const AUTOPLAY_HOLD = 9000;
/** minimum horizontal travel before a drag counts as a swipe rather than a tap */
const SWIPE_MIN = 40;
/** how long a freshly sent wish keeps its highlight */
const NEW_WISH_MS = 2200;

/** nama + ucapan + created_at is the stable identity the sheet gives us — used both as the React
 *  key and to dedupe a freshly-loaded batch against wishes already on the wall */
function wishKey(entry: WishEntry) {
  return `${entry.nama}__${entry.ucapan}__${entry.created_at}`;
}

function toWish(entry: WishEntry): Wish {
  return {
    key: wishKey(entry),
    name: entry.nama || "Tamu",
    message: entry.ucapan,
    when: entry.created_at,
  };
}

/* The script hands back one preformatted string, but the card needs the halves separately so the
   stylesheet can stack the time under the date on the narrowest screens. Splitting on the script's
   own separator keeps the client from re-parsing (and possibly re-interpreting) the timestamp. */
function splitWhen(when: string) {
  const at = when.indexOf("•");
  if (at === -1) return { date: when, time: "" };
  return { date: when.slice(0, at).trim(), time: when.slice(at + 1).trim() };
}

function Icon({ name }: { name: "send" | "chat" | "heart" | "copy" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "send":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.5 2.5 10.8 13.2M21.5 2.5l-6.8 19-3.9-8.3-8.3-3.9z" {...common} />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 12.4c0 3.9-3.8 7-8.5 7-1 0-2-.14-2.9-.4l-5.1 1.7 1.6-3.9a6.5 6.5 0 0 1-2.1-4.4c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7Z" {...common} />
          <path d="M8.4 12.3h.01M12 12.3h.01M15.6 12.3h.01" {...common} strokeWidth={2} />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 22" aria-hidden="true">
          <path
            d="M12 20.5S2.6 14.6 2.6 8.2A5.2 5.2 0 0 1 12 5.1a5.2 5.2 0 0 1 9.4 3.1c0 6.4-9.4 12.3-9.4 12.3Z"
            {...common}
          />
        </svg>
      );
    case "copy":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" {...common} />
          <path d="M15.5 5.5h-9a2.5 2.5 0 0 0-2.5 2.5v9" {...common} />
        </svg>
      );
  }
}

export default function WishesGiftSlide({ className, innerClassName }: WishesGiftSlideProps) {
  // the id is what the script writes a wish against; the name comes back with the row
  const { id, status: link } = useGuest();

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wall, setWall] = useState<"loading" | "ready" | "error">("loading");
  // cursor for the next older batch, as handed back by the script; hasMore is what decides
  // whether the dots row carries a "tampilkan lebih banyak" trigger after the last dot
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [nextCursorRow, setNextCursorRow] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  /* The script only pages one way — `before` walks backwards in time — so stepping to a *newer*
     batch means re-fetching with the cursor that produced it. pageCursor is the one on screen,
     history the trail of newer ones behind it; its length is what decides whether "Sebelumnya"
     has anywhere to go. */
  const [pageCursor, setPageCursor] = useState<Cursor>(null);
  const [history, setHistory] = useState<Cursor[]>([]);
  const [draft, setDraft] = useState("");
  const [send, setSend] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [sendMsg, setSendMsg] = useState("");
  // which account number was copied last, so the confirmation shows on that row only
  const [copied, setCopied] = useState<string | null>(null);

  const [idx, setIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  /* Marks the wish that just arrived so the newest card can announce itself. Without it the strip
     is already on page 0 when a wish is sent, so the list grows with nothing moving — the card
     simply swaps content, which reads as the page having ignored you. */
  const [justAdded, setJustAdded] = useState(false);
  const newTimer = useRef<number | null>(null);

  /* Loads the first page of the wall — the newest WISH_PAGE_SIZE wishes. The script sorts
     newest-first, so the response is taken as given. Aborting matters because this also runs
     after a send, which resets the wall back to page one. */
  const loadWishes = useCallback((signal?: AbortSignal) => {
    return fetchWishes({ limit: WISH_PAGE_SIZE }, signal)
      .then((page) => {
        if (signal?.aborted) return;
        setWishes(page.data.map(toWish));
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);
        setNextCursorRow(page.nextCursorRow);
        setPageCursor(null);
        setHistory([]);
        setLoadMoreError(false);
        setWall("ready");
      })
      .catch((err) => {
        if (signal?.aborted || (err as Error)?.name === "AbortError") return;
        setWall("error");
      });
  }, []);

  /* Swaps the batch on screen for another one, in either direction — the wall stays ten cards and
     five dots however far back it is paged. loadingMore both drives the triggers' labels and
     guards against a second request landing while the first is still in flight. */
  const loadBatch = useCallback(
    async (cursor: Cursor, move: "older" | "newer") => {
      if (loadingMore) return;
      setLoadingMore(true);
      setLoadMoreError(false);
      try {
        const page = await fetchWishes({
          before: cursor?.before ?? null,
          beforeRow: cursor?.beforeRow ?? null,
          limit: WISH_PAGE_SIZE,
        });
        /* still deduped, now within the batch itself: two identical rows in one page would
           otherwise collide on the React key that nama+ucapan+created_at produces */
        const seen = new Set<string>();
        const fresh: Wish[] = [];
        for (const entry of page.data) {
          const w = toWish(entry);
          if (seen.has(w.key)) continue;
          seen.add(w.key);
          fresh.push(w);
        }
        setWishes(fresh);
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);
        setNextCursorRow(page.nextCursorRow);
        // going older buries the current cursor; going newer is what digs it back out
        setHistory((h) => (move === "older" ? [...h, pageCursor] : h.slice(0, -1)));
        setPageCursor(cursor);
        /* A replaced batch shares nothing with the old one, so the strip has to land somewhere
           deliberate: forwards at the first card, backwards at the last — the card you would have
           arrived from, and the end you carry on reading backwards from. */
        setIdx(move === "older" ? 0 : Math.max(0, Math.ceil(fresh.length / PER_VIEW) - 1));
      } catch {
        setLoadMoreError(true);
      } finally {
        setLoadingMore(false);
      }
    },
    [loadingMore, pageCursor]
  );

  const loadMoreWishes = useCallback(() => {
    if (!hasMore) return;
    return loadBatch({ before: nextCursor, beforeRow: nextCursorRow }, "older");
  }, [hasMore, nextCursor, nextCursorRow, loadBatch]);

  const loadPrevWishes = useCallback(() => {
    if (history.length === 0) return;
    return loadBatch(history[history.length - 1], "newer");
  }, [history, loadBatch]);

  useEffect(() => {
    const ac = new AbortController();
    void loadWishes(ac.signal);
    return () => ac.abort();
  }, [loadWishes]);

  useEffect(
    () => () => {
      if (newTimer.current) window.clearTimeout(newTimer.current);
    },
    []
  );

  /* Long wishes are clamped with an ellipsis and a "Selengkapnya" toggle. Which ones actually
     overflow can only be known after layout — it depends on the card width and where the words
     break — so the clamped paragraphs are measured rather than guessed at from their length. The
     ResizeObserver fires once as soon as it starts observing, which covers the first measurement
     too, and again whenever the carousel is resized. */
  const [overflowing, setOverflowing] = useState<string[]>([]);
  /* the wish shown in the popup, or null when it is closed. Replaces the old expand-in-place
     key: a card that grows is exactly what this must not do. */
  const [openWish, setOpenWish] = useState<Wish | null>(null);

  useEffect(() => {
    const car = carouselRef.current;
    if (!car) return;
    const ro = new ResizeObserver(() => {
      const next: string[] = [];
      car.querySelectorAll<HTMLElement>("[data-wish-text]").forEach((el) => {
        // an expanded paragraph is unclamped, so it never reports overflow — keep its toggle
        if (el.scrollHeight - el.clientHeight > 1) next.push(el.dataset.wishText ?? "");
      });
      setOverflowing((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next
      );
    });
    ro.observe(car);
    return () => ro.disconnect();
  }, [wishes]);
  // a timestamp, not a boolean: any manual swipe or dot tap holds the auto-advance off for a
  // while so the cards aren't yanked away from under someone mid-sentence
  const heldUntil = useRef(0);

  /* The strip holds real wish cards and nothing else — paging, dots and swipe all count the
     batch itself, so ten wishes is five dots exactly as it was before pagination existed. */
  const pageCount = Math.max(1, Math.ceil(wishes.length / PER_VIEW));
  const lastIdx = pageCount - 1;
  // a wish arriving or leaving can strand idx past the end
  const safeIdx = Math.min(idx, lastIdx);
  /* Each trigger belongs to one end of the batch and shows only there: you reach older wishes by
     paging to the last card, newer ones by paging back to the first. */
  const showNext = hasMore && safeIdx === lastIdx;
  const showPrev = history.length > 0 && safeIdx === 0;

  useEffect(() => {
    if (!openWish) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenWish(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openWish]);

  const goTo = useCallback((i: number) => {
    heldUntil.current = Date.now() + AUTOPLAY_HOLD;
    setIdx(i);
  }, []);

  /* Auto-advance. It counts elapsed *visible* time rather than firing on a plain 5s interval:
     every slide in the deck stays mounted, so a plain interval would spin the carousel on a page
     nobody is looking at and then move the cards a fraction of a second after the guest
     arrives. Only the active slide is visibility:visible, which is what gates the count. */
  useEffect(() => {
    if (lastIdx < 1) return;
    const STEP = 250;
    let dwell = 0;
    const t = setInterval(() => {
      const el = carouselRef.current;
      const paused =
        !el ||
        getComputedStyle(el).visibility !== "visible" ||
        Date.now() < heldUntil.current;
      if (paused) {
        dwell = 0;
        return;
      }
      dwell += STEP;
      if (dwell >= AUTOPLAY_MS) {
        dwell = 0;
        setIdx((i) => (i >= lastIdx ? 0 : i + 1));
      }
    }, STEP);
    return () => clearInterval(t);
  }, [lastIdx]);

  /* Swipe. Only a mostly-horizontal drag counts: the page itself scrolls vertically, so a
     diagonal flick has to stay with the page rather than moving the cards. */
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touch.current;
      touch.current = null;
      if (!start || lastIdx < 1) return;
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return;
      // stops at the ends rather than wrapping — a strip that jumps back to the start under your
      // finger reads as a glitch, where a card-at-a-time flip did not
      goTo(Math.min(lastIdx, Math.max(0, safeIdx + (dx < 0 ? 1 : -1))));
    },
    [safeIdx, lastIdx, goTo]
  );

  /* Writes to the Wish sheet, then reloads the wall from the script rather than prepending
     locally — the row comes back with the guest's name as the sheet has it and a timestamp
     formatted by the script, so a re-read is the only way the new card matches its neighbours. */
  const sendWish = useCallback(async () => {
    const ucapan = draft.trim();
    if (!ucapan || !id || send === "sending") return;
    setSend("sending");
    setSendMsg("");
    try {
      await submitWish({ id, ucapan });
      setDraft("");
      await loadWishes();
      setSend("ok");
      setSendMsg("Terima kasih, ucapan Anda sudah kami terima.");
      // the newest wish is the first card
      goTo(0);
      if (newTimer.current) window.clearTimeout(newTimer.current);
      setJustAdded(true);
      newTimer.current = window.setTimeout(() => setJustAdded(false), NEW_WISH_MS);
    } catch (err) {
      setSend("error");
      setSendMsg(err instanceof Error ? err.message : "Ucapan gagal dikirim.");
    }
  }, [draft, id, send, loadWishes, goTo]);

  const copyNumber = useCallback(async (number: string) => {
    try {
      await navigator.clipboard.writeText(number.replace(/\s/g, ""));
      setCopied(number);
      setTimeout(() => setCopied((c) => (c === number ? null : c)), 1800);
    } catch {
      /* clipboard blocked (insecure context or denied) — the number is on screen to copy by hand */
    }
  }, []);

  return (
    <section className={`${className} ${styles.wishesSection}`}>
      {/* This page is taller than the viewport by design, so it scrolls its own content. The deck's
          wheel/touch handlers look for [data-slide-scroll] and hold off changing slide until this
          is scrolled to the matching end. */}
      <div className={styles.scroller} data-slide-scroll>
        <div className={styles.page}>
          {/* The double gold hairline, drawn around the whole document rather than around the
              window: it belongs to the page like the corner bouquets do, so it holds its place
              against the content instead of sliding across it as you scroll. */}
          <div className={styles.frame} />
          {/* corner bouquets, anchored to the ends of the page rather than to the viewport: pinned
              to the viewport they would sit on top of the wish list for the whole scroll. Each
              asset is already drawn for its own corner (measured floral mass: top-left 33.6%
              across, top-right 61.4%, bottom-left 31.0%, bottom-right 66.6%), so none is mirrored.
              They are not tappable here — see the stylesheet. */}
          <img
            className={`${styles.corner} ${styles.cornerTL} floral rotate`}
            src="/assets/top-left-gift.webp"
            alt=""
          />
          <img
            className={`${styles.corner} ${styles.cornerTR} floral rotate d2`}
            src="/assets/top-right-gift.webp"
            alt=""
          />
          <img className={`${styles.corner} ${styles.cornerBL}`} src="/assets/bot-left-gift.webp" alt="" />
          <img className={`${styles.corner} ${styles.cornerBR}`} src="/assets/bot-right-gift.webp" alt="" />

          <div className={innerClassName}>
            <div className={styles.block}>
              <img className={styles.crown} src="/assets/crown-gift.webp" alt="" />

              <h2 className={styles.title}>Ucapan &amp; Doa</h2>

              <img className={styles.titleRule} src="/assets/title-stroke-gift.webp" alt="" />

              <p className={styles.intro}>
                Doa dan ucapan terbaik dari Anda
                <br />
                sangat berarti bagi kami.
              </p>

              <div className={styles.composer}>
                <textarea
                  className={styles.input}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Tulis ucapan dan doa terbaik untuk kami..."
                  rows={3}
                  aria-label="Tulis ucapan dan doa"
                />
                <img className={styles.quill} src="/assets/text-gift.webp" alt="" />
              </div>

              <button
                type="button"
                className={styles.sendBtn}
                onClick={() => void sendWish()}
                // no id means the link was never matched to a guest, and the script rejects a
                // wish without one — better to disable than to let it fail on submit
                disabled={!draft.trim() || !id || send === "sending"}
              >
                <span className={styles.sendIcon}>
                  <Icon name="send" />
                </span>
                {send === "sending" ? "Mengirim…" : "Kirim Ucapan"}
              </button>

              {(sendMsg || link === "invalid" || link === "error") && (
                <p
                  className={`${styles.sendNote}${send === "error" || link !== "valid" ? ` ${styles.sendNoteBad}` : ""}`}
                  role="status"
                >
                  {link === "invalid"
                    ? "Tautan undangan tidak valid, jadi ucapan belum bisa dikirim."
                    : link === "error"
                      ? "Gagal memuat data undangan. Periksa koneksi Anda lalu muat ulang halaman."
                      : sendMsg}
                </p>
              )}

              {/* stroke-gift.webp is drawn with its arrowhead at the LEFT end, so it is the
                  left-hand rule that has to be mirrored for the pair to aim inward at the label:
                  flipped on the left points right, unflipped on the right points left. */}
              <div className={styles.wallHead}>
                <img
                  className={`${styles.wallRule} ${styles.wallRuleFlip}`}
                  src="/assets/stroke-gift.webp"
                  alt=""
                />
                <span className={styles.wallLabel}>
                  <span className={styles.wallIcon}>
                    <Icon name="chat" />
                  </span>
                  Ucapan dari Keluarga &amp; Sahabat
                </span>
                <img className={styles.wallRule} src="/assets/stroke-gift.webp" alt="" />
              </div>

              {/* the wall's own states — the carousel below stays mounted either way, so its
                  ResizeObserver keeps its reference to the track */}
              {wall !== "ready" || wishes.length === 0 ? (
                <p className={styles.wallNote}>
                  {wall === "loading"
                    ? "Memuat ucapan…"
                    : wall === "error"
                      ? "Ucapan belum bisa dimuat. Periksa koneksi Anda lalu muat ulang halaman."
                      : "Belum ada ucapan. Jadilah yang pertama menuliskannya."}
                </p>
              ) : null}

              {/* Two cards across as in the design, advancing on their own and on a swipe —
                  no arrows. The whole strip is laid out side by side and slid with a transform,
                  so each card keeps its own height and nothing jumps as it moves. */}
              <div
                className={`${styles.carousel}${wishes.length === 0 ? ` ${styles.carouselEmpty}` : ""}`}
                ref={carouselRef}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <ul
                  className={styles.track}
                  style={{ transform: `translate3d(${-safeIdx * 100}%,0,0)` }}
                >
                  {wishes.map((w, i) => {
                    const onScreen =
                      i >= safeIdx * PER_VIEW && i < (safeIdx + 1) * PER_VIEW;

                    // only the first card, and only right after this guest sent it
                    const isNew = justAdded && i === 0;
                    // the same measurement as before — nothing clamps open now, so the flag
                    // from the ResizeObserver is the whole answer
                    const canExpand = overflowing.includes(w.key);
                    return (
                      <li
                        key={w.key}
                        className={`${styles.wish}${isNew ? ` ${styles.wishNew}` : ""}`}
                        // cards scrolled off the strip stay in the layout but out of the reading order
                        aria-hidden={!onScreen}
                      >
                        <div className={styles.wishCard}>
                          {/* both marks are ornament, not controls — they share one row so they
                              sit on the same line rather than the heart floating over the glyph */}
                          <div className={styles.wishHead} aria-hidden="true">
                            <span className={styles.quote}>&ldquo;</span>
                            <span className={styles.heart}>
                              <Icon name="heart" />
                            </span>
                          </div>

                          <div className={styles.wishBody}>
                            <p className={styles.wishName}>{w.name}</p>
                            {/* the paragraph holds CLAMP_LINES' worth of height whether or not the
                                wish fills them, so the rule and date below land at the same place
                                on every card instead of riding up and down with the text */}
                            <p
                              className={styles.wishText}
                              data-wish-text={w.key}
                            >
                              {w.message}
                            </p>
                            {/* always rendered, hidden when the wish fits — an appearing and
                                disappearing row would shift the footer again */}
                            <button
                              type="button"
                              className={`${styles.more}${canExpand ? "" : ` ${styles.moreHidden}`}`}
                              onClick={() => setOpenWish(w)}
                              disabled={!canExpand || !onScreen}
                              aria-hidden={!canExpand}
                              tabIndex={canExpand && onScreen ? undefined : -1}
                            >
                              Selengkapnya
                            </button>

                            <img className={styles.wishRule} src="/assets/akad-resepsi-loct.webp" alt="" />
                            <p className={styles.wishWhen}>
                              <span>{splitWhen(w.when).date}</span>
                              {splitWhen(w.when).time && (
                                <>
                                  <span className={styles.whenSep} aria-hidden="true">
                                    ·
                                  </span>
                                  <span>{splitWhen(w.when).time}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {openWish &&
                /* Portalled to <body> for the same reason as the gallery lightbox: .deck is
                   position:fixed with z-index:10, so nothing inside it can rise above the dots,
                   music toggle and scroll cue at z-index 60. */
                createPortal(
                  <div
                    className={styles.wishModal}
                    data-deck-lock
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Ucapan dari ${openWish.name}`}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setOpenWish(null);
                    }}
                  >
                    <div className={styles.wishModalWrap}>
                      <button
                        type="button"
                        className={styles.wishModalClose}
                        onClick={() => setOpenWish(null)}
                        aria-label="Tutup ucapan"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="m7 7 10 10M17 7 7 17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <div className={styles.wishModalCard}>
                        {/* same head ornament as the mini card this popup expanded from */}
                        <div className={styles.wishModalHead} aria-hidden="true">
                          <span className={styles.quote}>&ldquo;</span>
                          <span className={styles.heart}>
                            <Icon name="heart" />
                          </span>
                        </div>

                        <p className={styles.wishModalName}>{openWish.name}</p>
                        <p className={styles.wishModalText}>{openWish.message}</p>

                        <img className={styles.wishModalRule} src="/assets/akad-resepsi-loct.webp" alt="" />
                        <p className={styles.wishModalWhen}>
                          <span>{splitWhen(openWish.when).date}</span>
                          {splitWhen(openWish.when).time && (
                            <>
                              <span className={styles.whenSep} aria-hidden="true">
                                ·
                              </span>
                              <span>{splitWhen(openWish.when).time}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

              {/* One dot per page, with the batch triggers pinned to the rail's edges so the dots
                  themselves stay centred whether one, both or neither trigger is showing. Each
                  appears only at the end it belongs to: "Selanjutnya" on the last dot, where the
                  batch runs out, "Sebelumnya" on the first, where it began. */}
              {(pageCount > 1 || showPrev || showNext) && (
                <div className={styles.pager}>
                  <div className={styles.pagerSide}>
                    {showPrev && (
                      <button
                        type="button"
                        className={`${styles.more} ${styles.pagerBtn}`}
                        onClick={() => void loadPrevWishes()}
                        disabled={loadingMore}
                      >
                        {loadingMore ? "Memuat…" : loadMoreError ? "Coba lagi" : "« Sebelumnya"}
                      </button>
                    )}
                  </div>

                  <div className={styles.dots}>
                    {pageCount > 1 &&
                      Array.from({ length: pageCount }, (_, i) => (
                        <button
                          type="button"
                          key={i}
                          className={i === safeIdx ? styles.dotOn : styles.dot}
                          onClick={() => goTo(i)}
                          aria-label={`Ucapan ${i * PER_VIEW + 1}–${Math.min((i + 1) * PER_VIEW, wishes.length)} dari ${wishes.length}`}
                        />
                      ))}
                  </div>

                  <div className={`${styles.pagerSide} ${styles.pagerSideEnd}`}>
                    {showNext && (
                      <button
                        type="button"
                        className={`${styles.more} ${styles.pagerBtn}`}
                        onClick={() => void loadMoreWishes()}
                        disabled={loadingMore}
                      >
                        {loadingMore ? "Memuat…" : loadMoreError ? "Coba lagi" : "Selanjutnya »"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <img className={styles.giftRule} src="/assets/bot-stroke-gift.webp" alt="" />

              <h2 className={styles.title}>Kirim Hadiah</h2>

              {/* The design's three lines only hold where the column is wide enough for the
                  longest of them; below that the breaks are hidden and the text wraps as one
                  balanced block, rather than a hard-broken line wrapping again into a ragged one. */}
              <p className={styles.giftNote}>
                {/* the explicit spaces matter: JSX drops the whitespace around a tag on its own
                    line, so with the breaks hidden the sentences would run together */}
                Doa restu Anda merupakan karunia yang sangat berarti bagi kami.{" "}
                <br className={styles.brWide} />
                Namun jika memberi adalah ungkapan tanda kasih,{" "}
                <br className={styles.brWide} />
                Anda dapat memberikan kado secara cashless melalui rekening berikut:
              </p>

              <div className={styles.accounts}>
                {ACCOUNTS.map((a) => (
                  <div key={a.number} className={styles.account}>
                    <img className={styles.bankMark} src={a.logo} alt={a.bank} />
                    <span className={styles.accountSep} aria-hidden="true" />
                    <div className={styles.accountInfo}>
                      <p className={styles.number}>{a.number}</p>
                      <p className={styles.holder}>a.n. {a.holder}</p>
                    </div>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => copyNumber(a.number)}
                    >
                      <span className={styles.copyIcon}>
                        <Icon name="copy" />
                      </span>
                      {copied === a.number ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                ))}
              </div>

              <img className={styles.thanksRule} src="/assets/title-stroke-gift.webp" alt="" />

              <p className={styles.thanks}>
                Atas kebaikan dan perhatian Anda,
                <br />
                kami ucapkan terima kasih.
              </p>

              <div className={styles.sig}>Banin &amp; Ivan</div>

              <img className={styles.footer} src="/assets/footer-gift.webp" alt="" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}