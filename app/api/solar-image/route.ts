import { NextRequest, NextResponse } from "next/server";
import { STATIC_MAP_SIZE as SIZE, STATIC_MAP_ZOOM as ZOOM } from "@/lib/solar/constants";

/**
 * Proxies the Maps Static API so the API key never reaches the browser.
 * GET /api/solar-image?lat=...&lng=...
 */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Solar imagery is not configured" }, { status: 503 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("center", `${lat},${lng}`);
  url.searchParams.set("zoom", String(ZOOM));
  url.searchParams.set("size", `${SIZE}x${SIZE}`);
  url.searchParams.set("scale", "2");
  url.searchParams.set("maptype", "satellite");
  url.searchParams.set("key", apiKey);

  const upstream = await fetch(url.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to fetch imagery" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/png",
      // Imagery for a given coordinate doesn't change day to day.
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
