import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This empty object tells Next.js 16: 
     "I know Turbopack exists, but I am choosing not to use it right now."
     This silences the ERROR you are seeing.
  */
  turbopack: {}, 

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