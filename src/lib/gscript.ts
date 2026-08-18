/* Server-side proxy to the Google Apps Script web app.
   Imported only by route handlers under src/app/api, so the script URL never reaches the browser
   bundle — that is the point of this file, and why the variable is GOOGLE_SCRIPT_URL rather than
   NEXT_PUBLIC_*. */

// same default as before so a missing .env.local degrades to today's behaviour rather than 500ing
const SCRIPT_URL =
  process.env.GOOGLE_SCRIPT_URL ??
  "https://script.google.com/macros/s/AKfycbx_d3REGFl-yGRVd1f-X1IYSz2u0oKpPI50zGrX0GZny56UFoKhLR8LQNVOL8LYgcQ/exec";

/** Forwards the request to the script with `action` pinned, passing every query parameter through
 *  untouched (id, limit, before, beforeRow, anything added later) and handing the script's JSON
 *  back verbatim, so no response shape changes. */
export async function proxyToScript(req: Request, action: string): Promise<Response> {
  const url = new URL(SCRIPT_URL);
  new URL(req.url).searchParams.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.set("action", action);

  const init: RequestInit = { method: req.method, cache: "no-store", redirect: "follow" };
  if (req.method === "POST") {
    /* text/plain for the same reason the client used to send it: Apps Script has no doOptions.
       It is kept here so the script keeps reading e.postData.contents exactly as before. */
    init.headers = { "Content-Type": "text/plain;charset=utf-8" };
    init.body = await req.text();
  }

  const upstream = await fetch(url, init);
  const body = await upstream.text();

  /* Apps Script answers an uncaught exception with an HTML error page under a 200. Passing that
     through would surface in the browser as an unparseable body; turning it into the script's own
     error shape means the existing `!data.success` handling reports it like any other failure. */
  if (!(upstream.headers.get("content-type") ?? "").includes("application/json")) {
    return Response.json(
      { success: false, message: "Google Apps Script error (non-JSON response)." },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }

  return new Response(body, {
    status: upstream.status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
