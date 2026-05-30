/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5000 https://api.foreignemporium.lk; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: http://localhost:5000 http://127.0.0.1:5000 https://api.foreignemporium.lk https://i.pravatar.cc https://ui-avatars.com; font-src 'self' data:; connect-src 'self' http://localhost:5000 http://127.0.0.1:5000 https://api.foreignemporium.lk;",
  },
];

const nextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
