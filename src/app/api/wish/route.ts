import { proxyToScript } from "@/lib/gscript";

// never prerendered or cached: the wall must reflect the sheet as it is now
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return proxyToScript(req, "wish");
}

// submitWish posts here too, so no wish traffic touches script.google.com from the browser
export function POST(req: Request) {
  return proxyToScript(req, "wish");
}
