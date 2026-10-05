import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  {
    // Prevents clickjacking — iframe embedding is blocked
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Prevents MIME-type sniffing attacks
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Controls referrer information sent with requests
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Forces HTTPS for 1 year, includes subdomains
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    // Disables browser features not needed by the app
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    // Content Security Policy
    // - 'self' for default, scripts, styles
    // - Supabase and Gemini API connections allowed
    // - Google Fonts and DiceBear avatars allowed
    // - Unsplash images allowed (seed data avatars)
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
      "font-src 'self' https://fonts.gstatic.com https://vercel.live https://assets.vercel.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com https://vercel.live https://*.vercel.live https://vercel.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://vercel.live https://*.vercel.live https://sockjs-mt1.pusher.com wss://ws-mt1.pusher.com",
      "frame-src 'self' https://vercel.live",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },

  // TypeScript: Hard fail on type errors in production builds
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint: Enable for production builds (catches real issues)
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },

  // Automatic redirect for common spelling typo (qoutes -> quotes)
  async redirects() {
    return [
      {
        source: '/qoutes',
        destination: '/quotes',
        permanent: true,
      },
      {
        source: '/qoutes/:path*',
        destination: '/quotes/:path*',
        permanent: true,
      },
    ];
  },

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Image optimization: allow Unsplash and DiceBear for avatar seeds
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
};

export default nextConfig;
