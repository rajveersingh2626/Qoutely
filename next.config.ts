import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === 'production';

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
    // Forces HTTPS for 1 year, includes subdomains, eligible for HSTS preload
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    // Disables browser features, modern sensors, and tracking APIs
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=(), accelerometer=(), gyroscope=(), magnetometer=(), display-capture=()',
  },
  {
    // Cross-origin isolation: prevents cross-origin window reference leaks
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    // Restricts resource loading across origins
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
  {
    // Content Security Policy
    // - 'self' for default, scripts, styles
    // - Supabase and Gemini API connections allowed
    // - Google Fonts and DiceBear avatars allowed
    // - Unsplash images allowed (seed data avatars)
    // - 'unsafe-eval' restricted to development mode only
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      isProd
        ? "script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel.live"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
      "font-src 'self' https://fonts.gstatic.com https://vercel.live https://assets.vercel.com data:",
      "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com https://vercel.live https://*.vercel.live https://vercel.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://vercel.live https://*.vercel.live https://sockjs-mt1.pusher.com wss://ws-mt1.pusher.com",
      "frame-src 'self' https://vercel.live",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
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

  // Image optimization: allow Unsplash and DiceBear with AVIF/WebP and 30-day caching
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
};

export default nextConfig;
