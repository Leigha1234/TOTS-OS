/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack fallbacks to prevent "Module not found" errors
  // for server-side modules being used in client-side code
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