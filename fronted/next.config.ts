import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images:{
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_CDN_URL!,
        port: '',
        pathname: '/**',
      },
    ],
  }
};

export default nextConfig;
