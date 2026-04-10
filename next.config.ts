import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We remove the turbopack {} key because it's invalid here.
  // Custom webpack config to handle browser-side fallbacks (PDF/Canvas)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;