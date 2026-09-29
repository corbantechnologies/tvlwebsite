import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.tamarind.co.ke" },
      { protocol: "https", hostname: "tml-files.tamarind.co.ke" },
      { protocol: "https", hostname: "tamarind.co.ke" },
    ],
  },
};

export default nextConfig;
