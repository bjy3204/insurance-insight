import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/policy-inserts/*": ["./assets/policy-inserts/**/*.png"],
  },
  async redirects() { return [{source:"/notion-crm",destination:"/my-page",permanent:false}]; },
  async rewrites() { return [{source:"/api/my-page/:path*",destination:"/api/notion-crm/:path*"}]; },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
