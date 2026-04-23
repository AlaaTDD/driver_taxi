import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-b30cd2ae70694993a15aa1ad9a5f84db.r2.dev",
      },
      {
        protocol: "https",
        hostname: "dhqcoydxiggjpcdpgoyx.supabase.co",
      },
    ],
  },
};

export default nextConfig;
