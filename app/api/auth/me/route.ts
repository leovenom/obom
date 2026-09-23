import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isProfileComplete, findUserById } from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const full = await findUserById(user.id);

  return NextResponse.json({
    user,
    profileComplete: full ? isProfileComplete(full) : false,
  });
}
