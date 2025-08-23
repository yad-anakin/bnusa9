/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Ignore TypeScript errors
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignore ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
    // Configure allowed image sources
  images: {
    domains: ['localhost', 'picsum.photos', 'placehold.co', 'via.placeholder.com', 'm.media-amazon.com', 'upload.wikimedia.org', 'lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'f005.backblazeb2.com',
        pathname: '/file/bnusa-images/**',
      },
      {
        protocol: 'https',
        hostname: 'bnusa-images.s3.us-east-005.backblazeb2.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    const headers = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
    ];

    return [
      {
        source: '/:path*',
        headers,
      },
    ];
  },
};

module.exports = nextConfig;