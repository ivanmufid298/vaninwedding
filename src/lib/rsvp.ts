/* Client for the Google Apps Script web app backing the RSVP form.
   Two sheets sit behind it: "Guest" (ID, Nama) is the guest list the invitation links are checked
   against, and "RSVP" (ID, Nama, Status, Pax, Timestamp) is where confirmations land. */

/* Guest and wish traffic goes through the Next.js proxy at /api/* — the script URL lives in
   GOOGLE_SCRIPT_URL, server-side (see src/lib/gscript.ts), so it is not in the browser bundle.
   This constant now serves only submitRsvp below, which is left exactly as it was. */
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
  const res = await fetch(`/api/guest?${key}`, { signal });
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

/** One page of the guestbook wall, as handed back by the script's cursor pagination. The script
 *  is the sole authority on ordering and on when the wall is exhausted — the client just carries
 *  `nextCursor`/`nextCursorRow` back on the following call and stops once `hasMore` is false. */
export interface WishPage {
  data: WishEntry[];
  hasMore: boolean;
  nextCursor: string | null;
  nextCursorRow: number | null;
}

/** Fetches one page of wishes, newest-first. With no params this is the initial ten for the
 *  guestbook wall. To page further back, pass the previous page's `nextCursor`/`nextCursorRow`
 *  as `before`/`beforeRow` — the script excludes anything at or after that point. */
export async function fetchWishes(
  params?: { before?: string | null; beforeRow?: number | null; limit?: number },
  signal?: AbortSignal
): Promise<WishPage> {
  const qs = [`limit=${params?.limit ?? 10}`];
  if (params?.before) qs.push(`before=${encodeURIComponent(params.before)}`);
  if (params?.beforeRow != null) qs.push(`beforeRow=${params.beforeRow}`);

  const res = await fetch(`/api/wish?${qs.join("&")}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.success || !Array.isArray(data.data)) {
    throw new Error(data?.message || "Ucapan gagal dimuat.");
  }
  return {
    data: data.data.map((w: Partial<WishEntry>) => ({
      nama: String(w?.nama ?? ""),
      ucapan: String(w?.ucapan ?? ""),
      created_at: String(w?.created_at ?? ""),
    })),
    hasMore: Boolean(data.hasMore),
    nextCursor: data.nextCursor ?? null,
    nextCursorRow: data.nextCursorRow ?? null,
  };
}

/** Appends a wish to the Wish sheet. The guest's name is looked up from the id server-side, so
 *  only the id and the message go up. Note the ?action=wish on the URL: doPost routes on the
 *  query parameter, and without it the script would treat this as an RSVP. */
export async function submitWish(input: { id: string; ucapan: string }): Promise<void> {
  const res = await fetch("/api/wish", {
    method: "POST",
    // the proxy forwards this content-type on to the script unchanged
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.success) throw new Error(data?.message || "Ucapan gagal dikirim.");
}