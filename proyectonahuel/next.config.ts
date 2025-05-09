import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  eslint: {
    // Permite construir con advertencias y errores de ESLint
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;
