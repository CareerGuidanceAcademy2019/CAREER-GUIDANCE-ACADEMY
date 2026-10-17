import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://craicxwqaygdydtdaxtw.supabase.co https://images.unsplash.com;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://craicxwqaygdydtdaxtw.supabase.co https://api.supabase.com https://challenges.cloudflare.com;
  frame-src 'self' https://challenges.cloudflare.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: [
    '*.trycloudflare.com',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
