import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garante que o Prisma funcione no ambiente serverless da Amplify
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
