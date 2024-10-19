/** @type {import('next').NextConfig} */
const ContentSecurityPolicy = `
  default-src 'self' *.rumahundangan.id unpkg.com *.jsdelivr.net;
   connect-src 'self' *.rumahundangan.id;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' unpkg.com *.rumahundangan.id *.jsdelivr.net;
  child-src 'self' *.rumahundangan.id;
  style-src 'self' 'unsafe-inline' *.rumahundangan.id unpkg.com fonts.googleapis.com *.googleapis.com data: 'unsafe-hashes';
  frame-src 'self' *.rumahundangan.id bid.g.doubleclick.net *.hsforms.net *.google.com *.hsforms.com www.youtube.com www.facebook.com;
  img-src 'self' blob: data: https: *.rumahundangan.id http: jala-web.test;
  font-src 'self' *.rumahundangan.id unpkg.com fonts.gstatic.com fonts.googleapis.com data:;
  media-src 'self' *.rumahundangan.id www.youtube.com js.intercomcdn.com m.youtube.com;
  object-src 'self' *.rumahundangan.id data:;
  worker-src 'self' blob: *.rumahundangan.id;
`;

const securityHeaders = [
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig = {
  reactStrictMode: false,
  rewrites: async () => {
    return [
      {
        source: '/wild',
        destination: '/wild/index.html',
      },
    ]
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
}

module.exports = nextConfig
