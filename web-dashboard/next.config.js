const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  transpilePackages: ['recharts'],
  webpack: (config) => {
    // This forces the @ alias to point to the current directory (web-dashboard)
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;