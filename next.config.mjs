/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // Add this to proxy API requests and stop CORS errors
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