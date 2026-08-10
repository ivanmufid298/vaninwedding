"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { fetchGuest, type Guest } from "@/lib/rsvp";

/* One guest lookup for the whole invitation. The invite card gates entry on it and the RSVP
   slide gates its form on it, so it has to be resolved once and shared rather than fetched twice.
   Links come in two shapes:
     ?to=ivantest&id=IB001   → looked up by id
     ?to=ivantest            → looked up by name, and the id is written back into the URL */
export type GuestStatus = "checking" | "valid" | "invalid" | "error";

interface GuestState {
  status: GuestStatus;
  guest: Guest | null;
  /** the invitation id, from the URL or recovered by the name lookup */
  id: string | null;
  displayName: string;
}

const FALLBACK_NAME = "Bapak/Ibu/Saudara/i";

const GuestCtx = createContext<GuestState>({
  status: "error",
  guest: null,
  id: null,
  displayName: FALLBACK_NAME,
});

export function useGuest() {
  return useContext(GuestCtx);
}

export function GuestProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const to = searchParams.get("to")?.trim() ?? "";
  const idParam = searchParams.get("id")?.trim() ?? "";
  // the original hard-coded easter egg still works without a round trip
  const forcedNotInvited = to.toLowerCase() === "not-invited";

  const [state, setState] = useState<{ status: GuestStatus; guest: Guest | null }>(() => {
    if (forcedNotInvited) return { status: "invalid", guest: null };
    if (idParam || to) return { status: "checking", guest: null };
    return { status: "invalid", guest: null };
  });

  useEffect(() => {
    if (forcedNotInvited || (!idParam && !to)) return;
    const ac = new AbortController();
    fetchGuest({ id: idParam || undefined, nama: idParam ? undefined : to }, ac.signal)
      .then((g) => {
        if (ac.signal.aborted) return;
        if (!g) {
          setState({ status: "invalid", guest: null });
          return;
        }
        setState({ status: "valid", guest: g });
        // resolved from the name alone: put the id in the address bar so sharing or reloading
        // the link keeps working. replaceState rather than a router push, so it neither adds a
        // history entry nor remounts the deck mid-animation.
        if (!idParam && g.id && typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("id", g.id);
          window.history.replaceState(null, "", url.toString());
        }
      })
      .catch((err) => {
        if (ac.signal.aborted || (err as Error)?.name === "AbortError") return;
        // a network failure is not proof that someone is uninvited, so this is kept distinct
        // from "invalid" — the invitation still opens, only the RSVP form is held back
        setState({ status: "error", guest: null });
      });
    return () => ac.abort();
  }, [idParam, to, forcedNotInvited]);

  const value: GuestState = {
    status: state.status,
    guest: state.guest,
    id: state.guest?.id ?? (idParam || null),
    displayName:
      state.guest?.nama || (to && !forcedNotInvited ? to : FALLBACK_NAME),
  };

  return <GuestCtx.Provider value={value}>{children}</GuestCtx.Provider>;
}
