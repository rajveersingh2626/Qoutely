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
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval required for Next.js dev HMR; 'unsafe-inline' for inline scripts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),

  // TypeScript: Hard fail on type errors in production builds
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint: Enable for production builds (catches real issues)
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
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
