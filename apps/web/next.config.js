/** @type {import('next').NextConfig} */
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
  process.env.NODE_ENV = 'production';
}

const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
