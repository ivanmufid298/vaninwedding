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
