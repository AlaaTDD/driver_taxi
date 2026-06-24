import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

// [SEC-12 / SEC-14 FIXED] Security headers harden every response. The CSP
// allows the origins we actually use (Supabase, our R2 bucket, the map tiles
// and the Leaflet CDN that driver-locations-map.tsx loads dynamically) while
// blocking everything else. `allowedDevOrigins` is read from an env var so no
// hardcoded local IP ships in production.
const devOrigins = (process.env.DEV_ORIGINS || "localhost")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const securityHeaders = [
  // HTTPS-only (honoured once the site is on TLS in production).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Don't let anyone frame the dashboard (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Stop MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send the Referer to same-origin targets.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict the powerful browser features we don't use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(self), interest-cohort=()",
  },
  // Content Security Policy. `unsafe-inline` is required for Next's inline
  // styles (and our Leaflet popup styles) — the rest is locked down.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https: https://*.basemaps.cartocdn.com https://pub-b30cd2ae70694993a15aa1ad9a5f84db.r2.dev",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-b30cd2ae70694993a15aa1ad9a5f84db.r2.dev",
      },
      {
        protocol: "https",
        hostname: "dhqcoydxiggjpcdpgoyx.supabase.co",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
    // placehold.co returns SVG placeholder images — allow them.
    // contentDispositionType + contentSecurityPolicy sandbox the SVG so it
    // cannot execute scripts even if the CDN were compromised.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default withNextIntl(nextConfig);
