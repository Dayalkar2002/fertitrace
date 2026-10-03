import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mssql', 'tedious'],
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  async rewrites() {
    return [
      { source: '/ivf', destination: '/insemination?module=ivf' },
      { source: '/icsi', destination: '/insemination?module=icsi' },
      { source: '/api/ivf', destination: '/api/insemination?module=ivf' },
      { source: '/api/icsi', destination: '/api/insemination?module=icsi' },
    ];
  },
};

export default nextConfig;
