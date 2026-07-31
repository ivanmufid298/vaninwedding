"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { FloralClickProvider, type FloralClickHandler } from "./FloralClickContext";
import Preloader from "./Preloader";
import IntroLabel from "./IntroLabel";
import Envelope from "./Envelope";
import InviteCard from "./InviteCard";
import Curtain from "./Curtain";
import Deck, { type Countdown } from "./Deck";
import ScrollCue from "./ScrollCue";
import Dots from "./Dots";
import MusicToggle from "./MusicToggle";
import PetalLayer, { type Petal } from "./PetalLayer";

const TOTAL_SLIDES = 5;
const PETAL_COLORS = ["#8fa178", "#fffdf8", "#5f6f4c", "#e3cd9a", "#e7b9c2"];
const WEDDING_TARGET = new Date("2026-08-30T10:30:00+07:00").getTime();
const PRELOAD_ASSETS = [
  "/assets/spray.webp",
  "/assets/backdrop.webp",
  "/assets/cluster.webp",
  "/assets/cluster_small.webp",
  "/assets/vase.webp",
];
const MIN_PRELOAD_DURATION = 1200;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Invitation() {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const busyRef = useRef(true);
  const deckReadyRef = useRef(false);

  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [envelopeHidden, setEnvelopeHidden] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [curtainGone, setCurtainGone] = useState(true);
  const [dotsShow, setDotsShow] = useState(false);
  const [inviteShown, setInviteShown] = useState(false);
  const [inviteLeaving, setInviteLeaving] = useState(false);
  const openedRef = useRef(false);
  const continuedRef = useRef(false);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [petals, setPetals] = useState<Petal[]>([]);
  const petalIdRef = useRef(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicOn, setMusicOn] = useState(false);

  const [introReady, setIntroReady] = useState(false);

  const [countdown, setCountdown] = useState<Countdown>({
    days: "00",
    hours: "00",
    mins: "00",
    secs: "00",
  });

  const goTo = useCallback((idx: number) => {
    if (!deckReadyRef.current || busyRef.current) return;
    if (idx < 0 || idx > TOTAL_SLIDES - 1 || idx === currentRef.current) return;
    busyRef.current = true;
    currentRef.current = idx;
    setCurrent(idx);
    setTimeout(() => {
      busyRef.current = false;
    }, 1000);
  }, []);

  const next = useCallback(() => goTo(currentRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(currentRef.current - 1), [goTo]);

  const openEnvelope = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    setEnvelopeOpen(true);

    // envelope fades out and the invite card flips/zooms in at the same moment, so the
    // card's opaque background covers the envelope with no gap where anything behind could show
    timeoutIdsRef.current.push(
      setTimeout(() => {
        setEnvelopeHidden(true);
        setInviteShown(true);
      }, 1000)
    );
  }, []);

  const handleContinue = useCallback(() => {
    if (continuedRef.current) return;
    continuedRef.current = true;
    setInviteLeaving(true);
    setInviteShown(false);
    // reveal the closed curtain immediately so it crossfades in as the invite card fades out
    setCurtainGone(false);

    timeoutIdsRef.current.push(
      setTimeout(() => {
        setCurtainOpen(true);
      }, 700)
    );

    timeoutIdsRef.current.push(
      setTimeout(() => {
        setCurtainGone(true);
        deckReadyRef.current = true;
        busyRef.current = false;
        setDotsShow(true);
        // music only starts here — never during the preloader, envelope or invite card
        const el = audioRef.current;
        if (el) {
          el.volume = 0.55;
          el.play().catch(() => {
            /* browser refused autoplay; the toggle button can still start it */
          });
        }
      }, 700 + 1950)
    );
  }, []);

  useEffect(() => {
    const ids = timeoutIdsRef.current;
    return () => {
      ids.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    const loaders = PRELOAD_ASSETS.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    );

    Promise.all(loaders).then(() => {
      if (cancelled) return;
      const remaining = Math.max(0, MIN_PRELOAD_DURATION - (Date.now() - start));
      setTimeout(() => {
        if (!cancelled) setIntroReady(true);
      }, remaining);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const spawnPetals = useCallback((x: number, y: number) => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const newPetals: Petal[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 36;
      newPetals.push({
        id: petalIdRef.current++,
        x,
        y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 28,
        color: PETAL_COLORS[i % PETAL_COLORS.length],
      });
    }
    setPetals((prev) => [...prev, ...newPetals]);
  }, []);

  const removePetal = useCallback((id: number) => {
    setPetals((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleFloralClick: FloralClickHandler = useCallback(
    (e) => {
      e.stopPropagation();
      const r = e.currentTarget.getBoundingClientRect();
      spawnPetals(r.left + r.width / 2, r.top + r.height / 2);
    },
    [spawnPetals]
  );

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, WEDDING_TARGET - Date.now());
      setCountdown({
        days: pad(Math.floor(diff / 86400000)),
        hours: pad(Math.floor((diff % 86400000) / 3600000)),
        mins: pad(Math.floor((diff % 3600000) / 60000)),
        secs: pad(Math.floor((diff % 60000) / 1000)),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let wheelLock = 0;
    let touchY: number | null = null;

    const handleWheel = (e: WheelEvent) => {
      if (!deckReadyRef.current) return;
      const now = Date.now();
      if (now - wheelLock < 900) return;
      if (Math.abs(e.deltaY) < 12) return;
      wheelLock = now;
      if (e.deltaY > 0) next();
      else prev();
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!deckReadyRef.current || touchY === null) return;
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 45) {
        if (dy > 0) next();
        else prev();
      }
      touchY = null;
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (!deckReadyRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [next, prev]);

  const toggleMusic = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, []);

  const handleRsvpClick = (e: MouseEvent) => {
    e.preventDefault();
    alert(
      "Ganti tautan tombol ini dengan nomor WhatsApp atau formulir RSVP Anda."
    );
  };

  return (
    <FloralClickProvider value={handleFloralClick}>
      <Preloader hidden={introReady} />
      <IntroLabel phase={introReady ? "envelope" : "preload"} visible={!envelopeHidden} />
      <Envelope open={envelopeOpen} hidden={envelopeHidden} onOpen={openEnvelope} />
      <InviteCard shown={inviteShown} leaving={inviteLeaving} onContinue={handleContinue} />
      <Curtain open={curtainOpen} gone={curtainGone} />
      <Deck current={current} countdown={countdown} onRsvpClick={handleRsvpClick} />
      <ScrollCue current={current} total={TOTAL_SLIDES} />
      <Dots total={TOTAL_SLIDES} current={current} show={dotsShow} onSelect={goTo} />
      <MusicToggle playing={musicOn} show={dotsShow} onToggle={toggleMusic} />
      <PetalLayer petals={petals} onDone={removePetal} />

      {/* no autoplay attribute: playback is started explicitly once the deck is revealed.
          State is driven by the element's own events so the icon always matches reality. */}
      <audio
        ref={audioRef}
        src="/assets/berpayung-tuhan.mp3"
        loop
        preload="auto"
        onPlay={() => setMusicOn(true)}
        onPause={() => setMusicOn(false)}
      />
    </FloralClickProvider>
  );
}
