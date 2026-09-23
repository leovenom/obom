import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: String(
      !!(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)
      )
    ),
  },
};

export default nextConfig;
