import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'platform-lookaside.fbsbx.com',
      'graph.facebook.com',
      'avatars.githubusercontent.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      }
    ],
  },
  eslint: {
    // Permite construir con advertencias y errores de ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
