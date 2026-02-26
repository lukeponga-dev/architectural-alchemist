import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Enable static export for Firebase Hosting
  output: 'export',
  // Ensure images are optimized for static export
  images: {
    unoptimized: true,
  },
  // Add trailing slash for Firebase Hosting compatibility
  trailingSlash: true,
};

export default nextConfig;
