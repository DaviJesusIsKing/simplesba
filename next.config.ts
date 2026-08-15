import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // evita build quebrar por type estrito demais no Amplify
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
