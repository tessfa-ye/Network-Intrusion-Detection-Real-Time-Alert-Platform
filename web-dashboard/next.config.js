const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  transpilePackages: ['recharts'],
  // ignore typescript errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // ignore eslint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  turbopack: {}
};

module.exports = nextConfig;