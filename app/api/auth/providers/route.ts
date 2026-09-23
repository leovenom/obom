import { NextResponse } from 'next/server';
import { isGoogleAuthEnabled } from '@/lib/google-auth-config';

export async function GET() {
  const google = isGoogleAuthEnabled();
  return NextResponse.json({
    google,
    message: google
      ? null
      : 'Login com Google indisponível. Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e AUTH_SECRET no .env',
  });
}
