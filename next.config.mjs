/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable SSR for the game components that use PixiJS
  experimental: {
    // Enable if needed
  },
};

export default nextConfig;
