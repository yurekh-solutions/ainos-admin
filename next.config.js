/** @type {import('next').NextConfig} */

// The console holds the whole platform, so its responses carry the strictest
// settings of the two apps: nothing may frame it, nothing about it may be
// indexed, and the framework version is not advertised.
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // DENY rather than SAMEORIGIN: no page of this console belongs inside a
  // frame on any origin, including its own.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
];

const nextConfig = {
  reactStrictMode: true,
  // Leaks the exact Next.js version to every scanner that asks for it.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

module.exports = nextConfig;
