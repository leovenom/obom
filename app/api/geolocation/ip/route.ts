import { NextRequest, NextResponse } from 'next/server';

/** Precisão típica de geolocalização por IP (nível cidade). */
const IP_ACCURACY_METERS = 5000;

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('192.168.') || ip.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  return false;
}

function buildAddress(city?: string, region?: string, country?: string): string {
  return [city, region, country].filter(Boolean).join(', ');
}

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const lookupUrl =
    clientIp && !isPrivateOrLocalIp(clientIp)
      ? `https://ipwho.is/${encodeURIComponent(clientIp)}`
      : 'https://ipwho.is/';

  try {
    const res = await fetch(lookupUrl, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Serviço de IP indisponível' }, { status: 502 });
    }

    const data = await res.json();
    if (!data.success) {
      return NextResponse.json({ error: data.message || 'IP não localizado' }, { status: 404 });
    }

    const latitude = Number.parseFloat(data.latitude);
    const longitude = Number.parseFloat(data.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 502 });
    }

    const address =
      buildAddress(data.city, data.region, data.country) ||
      `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    return NextResponse.json({
      latitude,
      longitude,
      accuracy: IP_ACCURACY_METERS,
      address,
      source: 'ip',
      approximate: true,
    });
  } catch {
    return NextResponse.json({ error: 'Falha na geolocalização por IP' }, { status: 502 });
  }
}
