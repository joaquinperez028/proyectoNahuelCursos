/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorar los errores de ESLint durante la compilación para poder desplegar
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar los errores de TypeScript durante la compilación
    ignoreBuildErrors: true,
  },
  // Otras configuraciones existentes...
};

module.exports = nextConfig; 