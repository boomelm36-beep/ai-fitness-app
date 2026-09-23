// next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  customWorkerSrc: "worker", 
  disable: false, // <-- Change this to false temporarily to test locally
});

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  turbopack: {}, 
};

export default withPWA(nextConfig);