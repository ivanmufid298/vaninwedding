import { proxyToScript } from "@/lib/gscript";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return proxyToScript(req, "guest");
}
