/* Client for the door check-in. The Apps Script web app is shared with the RSVP and wish flows —
   see src/lib/rsvp.ts — but attendance is the staff-facing half, so it lives on its own. */

const ENDPOINT =
  process.env.NEXT_PUBLIC_RSVP_ENDPOINT ??
  "https://script.google.com/macros/s/AKfycbx_d3REGFl-yGRVd1f-X1IYSz2u0oKpPI50zGrX0GZny56UFoKhLR8LQNVOL8LYgcQ/exec";

/** What the staff type on the access screen. Override per deployment. */
export const ACCESS_CODE = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE ?? "vanin2026";

/** sessionStorage key — deliberately session-scoped, so closing the tab locks the device again */
const TOKEN_KEY = "vanin.admin.token";

/* How the bearer token reaches Apps Script.

   "body"   — sent as a field inside the JSON body. This is what works today: the POST stays a
              CORS "simple request", so the browser sends it straight through.
   "header" — sent as `Authorization: Bearer <token>`. A custom header makes the request
              non-simple, so the browser first sends an OPTIONS preflight. Apps Script has no
              doOptions handler and answers it with a redirect, the preflight fails, and the POST
              never leaves the browser — the same trap that forces text/plain on every write here.

   Flip this to "header" the day the token is validated behind something that can answer OPTIONS
   (a Next.js route handler proxying to Apps Script, say). Both paths are built below, so that
   change is one word plus a redeploy. */
export const AUTH_TRANSPORT: "body" | "header" = "body";

export interface AttendanceResult {
  success: boolean;
  /** "BAD_REQUEST" | "NOT_FOUND" | "ALREADY_CHECKED_IN" | "SERVER_ERROR" */
  code?: string;
  message?: string;
  nama?: string;
  /** formatted by the script as `dd MMMM yyyy • HH.mm`, for both a fresh and a prior check-in */
  attendance_time?: string;
}

/* ---- access gate ---------------------------------------------------------------------------- */

/** Local check only — the code never leaves the device. Apps Script will do the real validation
 *  once it can; until then this stops a stray tap on a shared phone, nothing more. */
export function verifyAccessCode(code: string): string | null {
  const entered = code.trim();
  if (!entered || entered !== ACCESS_CODE) return null;
  // the token *is* the code for now; keeping them separate means swapping in a server-issued
  // token later touches only this function
  return entered;
}

/* sessionStorage exposed as a subscribable store, so the page can read it with
   useSyncExternalStore. That is what keeps the server render (no session, so: locked) and the
   client's first paint (session present, so: scanner) from disagreeing during hydration, without
   a setState-in-effect that React now flags as a cascading render. */
const listeners = new Set<() => void>();

export function subscribeToken(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    // private mode or storage disabled — the staff can still unlock, just not stay unlocked
    return null;
  }
}

/** the server has no session, so it always renders the access screen */
export function readServerToken(): string | null {
  return null;
}

export function storeToken(token: string): void {
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* nothing to do: the session simply won't survive a reload */
  }
  listeners.forEach((l) => l());
}

export function clearToken(): void {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/* ---- scanning ------------------------------------------------------------------------------- */

/** Pulls the invitation id out of whatever the camera read. Guests may show a bare id, a
 *  `guest:`-prefixed one, or the whole invitation URL, and there is no chance to explain the
 *  difference at a door — so all three are accepted. */
export function extractGuestId(scanned: string): string | null {
  const raw = scanned.trim();
  if (!raw) return null;

  // a full invitation link: take ?id=, falling back to ?to= for links minted before ids existed
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const fromQuery = url.searchParams.get("id") ?? url.searchParams.get("to");
      return fromQuery ? normalizeId(fromQuery) : null;
    } catch {
      return null;
    }
  }

  return normalizeId(raw);
}

function normalizeId(value: string): string | null {
  // "guest:IB000" — reserved for a future QR payload that names its own scheme
  const bare = value.trim().replace(/^guest:/i, "").trim();
  return /^[A-Za-z0-9_-]{1,32}$/.test(bare) ? bare : null;
}

/* ---- check-in ------------------------------------------------------------------------------- */

/** Marks a guest present in the RSVP sheet (columns Attendance / Attendance Time). The script
 *  refuses a second check-in rather than overwriting the first, so the earlier time survives —
 *  which is why the payload, not an exception, carries the ALREADY_CHECKED_IN answer back. */
export async function submitAttendance(
  input: { id: string },
  token?: string | null
): Promise<AttendanceResult> {
  const headers: Record<string, string> = {
    /* text/plain, not application/json: Apps Script has no doOptions handler, so a JSON
       content-type would trigger a CORS preflight it cannot answer. The script reads the body
       with JSON.parse(e.postData.contents) either way. */
    "Content-Type": "text/plain;charset=utf-8",
  };
  const body: Record<string, unknown> = { id: input.id };

  if (token) {
    if (AUTH_TRANSPORT === "header") headers.Authorization = `Bearer ${token}`;
    else body.token = token;
  }

  const res = await fetch(`${ENDPOINT}?action=attendance`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as AttendanceResult;
}
