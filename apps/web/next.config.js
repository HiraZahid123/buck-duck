const path = require('path');

/** @type {import('next').NextConfig} */
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
  process.env.NODE_ENV = 'production';
}

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiTarget = process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${apiTarget}/socket.io/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
