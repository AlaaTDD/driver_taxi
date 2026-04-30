import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

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

export default withNextIntl(nextConfig);
