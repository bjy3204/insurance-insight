import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/policy-inserts/*": ["./assets/policy-inserts/**/*.png"],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
