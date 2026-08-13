/* Client for the Google Apps Script web app backing the RSVP form.
   Two sheets sit behind it: "Guest" (ID, Nama) is the guest list the invitation links are checked
   against, and "RSVP" (ID, Nama, Status, Pax, Timestamp) is where confirmations land. */

// Apps Script mints a new /exec URL for every *new* deployment, so this is overridable without a
// code change — set NEXT_PUBLIC_RSVP_ENDPOINT if the script is redeployed rather than updated.
const ENDPOINT =
  process.env.NEXT_PUBLIC_RSVP_ENDPOINT ??
  "https://script.google.com/macros/s/AKfycbx_d3REGFl-yGRVd1f-X1IYSz2u0oKpPI50zGrX0GZny56UFoKhLR8LQNVOL8LYgcQ/exec";

export interface Guest {
  id: string;
  nama: string;
}

export type RsvpStatus = "Hadir" | "Tidak Hadir";

/** Looks a guest up in the Guest sheet, by invitation id when the link has one, otherwise by
 *  name so a bare ?to=ivantest link still resolves. Returns null when there's no match — that's
 *  a normal "this link isn't valid" answer, not a failure, so it isn't thrown. */
export async function fetchGuest(
  query: { id?: string; nama?: string },
  signal?: AbortSignal
): Promise<Guest | null> {
  const key = query.id ? `id=${encodeURIComponent(query.id)}` : `nama=${encodeURIComponent(query.nama ?? "")}`;
  const res = await fetch(`${ENDPOINT}?action=guest&${key}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.success) return null;
  return { id: String(data.id), nama: String(data.nama ?? "") };
}

/** Writes the confirmation to the RSVP sheet. The script upserts on id, so re-submitting updates
 *  the guest's existing row rather than adding a duplicate. */
export async function submitRsvp(input: {
  id: string;
  status: RsvpStatus;
  pax: number;
}): Promise<{ action: "created" | "updated" }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    /* text/plain deliberately, not application/json: Apps Script has no doOptions handler, so a
       JSON content-type would trigger a CORS preflight it cannot answer and the POST would fail
       in the browser. text/plain keeps this a "simple request", and the script reads the body as
       raw text (e.postData.contents) and JSON.parses it either way. */
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || "Konfirmasi gagal dikirim.");
  return { action: data.action === "updated" ? "updated" : "created" };
}

/** A row from the Wish sheet. `created_at` arrives already formatted by the script
 *  (`dd MMMM yyyy • HH.mm` in the script's timezone), so the client never parses it. */
export interface WishEntry {
  nama: string;
  ucapan: string;
  created_at: string;
}

/** The newest wishes for the guestbook wall. The script already sorts newest-first and caps the
 *  list at ten, so this returns them as they come. */
export async function fetchWishes(signal?: AbortSignal): Promise<WishEntry[]> {
  const res = await fetch(`${ENDPOINT}?action=wish`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.success || !Array.isArray(data.data)) {
    throw new Error(data?.message || "Ucapan gagal dimuat.");
  }
  return data.data.map((w: Partial<WishEntry>) => ({
    nama: String(w?.nama ?? ""),
    ucapan: String(w?.ucapan ?? ""),
    created_at: String(w?.created_at ?? ""),
  }));
}

/** Appends a wish to the Wish sheet. The guest's name is looked up from the id server-side, so
 *  only the id and the message go up. Note the ?action=wish on the URL: doPost routes on the
 *  query parameter, and without it the script would treat this as an RSVP. */
export async function submitWish(input: { id: string; ucapan: string }): Promise<void> {
  const res = await fetch(`${ENDPOINT}?action=wish`, {
    method: "POST",
    // text/plain for the same reason as submitRsvp — see the note there
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || "Ucapan gagal dikirim.");
}

/** What checkAttendance() answers with. `code` is only present on a refusal, and the door staff
 *  need to tell those refusals apart, so this is the one call that hands the payload back instead
 *  of throwing on `success:false`. */
export interface AttendanceResult {
  success: boolean;
  /** "BAD_REQUEST" | "NOT_FOUND" | "ALREADY_CHECKED_IN" | "SERVER_ERROR" */
  code?: string;
  message?: string;
  nama?: string;
  /** already formatted by the script (`dd MMMM yyyy • HH.mm`), for both the fresh and prior check-in */
  attendance_time?: string;
}

/** Marks a guest present in the RSVP sheet (columns Attendance / Attendance Time). The script
 *  refuses a second check-in rather than overwriting the first, so the earlier time survives. */
export async function submitAttendance(input: { id: string }): Promise<AttendanceResult> {
  const res = await fetch(`${ENDPOINT}?action=attendance`, {
    method: "POST",
    // text/plain for the same reason as submitRsvp — see the note there
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as AttendanceResult;
}

/** Pulls the invitation id out of whatever the camera read. Guests will be showing either a bare
 *  id or the whole invitation URL depending on how the QR was made, and at the door there is no
 *  chance to explain the difference — so both are accepted. */
export function extractGuestId(scanned: string): string | null {
  const raw = scanned.trim();
  if (!raw) return null;

  // a full invitation link: take ?id=, and fall back to ?to= for links minted before ids existed
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const fromQuery = url.searchParams.get("id") ?? url.searchParams.get("to");
      return fromQuery?.trim() || null;
    } catch {
      return null;
    }
  }

  // a bare id — anything else is not one, and guessing would check the wrong guest in
  return /^[A-Za-z0-9_-]{1,32}$/.test(raw) ? raw : null;
}
