const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  transpilePackages: ['recharts'],
  // This explicitly tells Next.js 16 to use Webpack and ignore Turbopack
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  // This satisfies the requirement to acknowledge Turbopack
  turbopack: {}
};

module.exports = nextConfig;