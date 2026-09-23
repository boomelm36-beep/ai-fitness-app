// next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  customWorkerSrc: "worker", 
  disable: process.env.NODE_ENV === "development", 
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {}, 
};

export default withPWA(nextConfig);