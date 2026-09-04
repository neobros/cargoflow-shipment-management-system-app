import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Lets `npm run build` write somewhere other than the dev server's `.next`,
  // so a production build cannot pull the stylesheet out from under `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  },
};

export default config;
