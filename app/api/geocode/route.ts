import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_HEADERS = {
  'User-Agent': 'OBOM-Captura/1.0 (contact@obom.com.br)',
  Accept: 'application/json',
};

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  const query = req.nextUrl.searchParams.get('q');

  if (query) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=pt`,
        { headers: NOMINATIM_HEADERS, next: { revalidate: 3600 } }
      );

      if (!res.ok) {
        return NextResponse.json({ address: query, fallback: true });
      }

      const data = await res.json();
      const hit = data[0];
      if (!hit) {
        return NextResponse.json({ address: query, fallback: true });
      }

      return NextResponse.json({
        address: hit.display_name || query,
        latitude: Number.parseFloat(hit.lat),
        longitude: Number.parseFloat(hit.lon),
        fallback: !hit.display_name,
      });
    } catch {
      return NextResponse.json({ address: query, fallback: true });
    }
  }

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Informe lat/lng ou q (endereço)' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt`,
      { headers: NOMINATIM_HEADERS, next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({
        address: `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`,
        fallback: true,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      address: data.display_name || `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`,
      fallback: !data.display_name,
    });
  } catch {
    return NextResponse.json({
      address: `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`,
      fallback: true,
    });
  }
}
