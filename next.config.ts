import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Obligatorio para GitHub Pages
  basePath: '/Report_MHOS',
  assetPrefix: '/Report_MHOS/',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
