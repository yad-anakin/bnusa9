import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Use Next.js Image Optimization in all environments
    unoptimized: false,
    // Tailored sizes so the 500px-wide hero image selects an optimal src
    deviceSizes: [320, 420, 500, 640, 768, 1024, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp', 'image/avif'],
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    // In development, proxy API calls to the backend to keep cookies same-origin
    // This helps CSRF/session cookies work without CORS hassles
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5003/api/:path*',
      },
    ];
  },
};

export default nextConfig;
