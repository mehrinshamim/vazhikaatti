import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=8&viewbox=76.18,10.10,76.45,9.88&bounded=1`,
      {
        headers: {
          "User-Agent": "VazhikaattiApp/1.0 (contact@vazhikaatti.com)",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Nominatim API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocoding proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch location data" }, { status: 500 });
  }
}
