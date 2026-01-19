/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/shared", "@repo/survey-engine"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/settings/shop',
        destination: '/settings/organization',
        permanent: true,
      },
      {
        source: '/admin/shops',
        destination: '/admin/organizations',
        permanent: true,
      },
    ]
  },
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
