/** @type {import('next').NextConfig} */
const nextConfig = {
  // This allows Turbopack to exist alongside your custom Webpack config
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

  // Proxy API requests to stop CORS errors
  async rewrites() {
    return [
      {
        source: '/api/supabase/:path*',
        destination: 'https://onytzlfsegmcngchsnnl.supabase.co/rest/v1/:path*',
      },
    ];
  },
};

export default nextConfig;