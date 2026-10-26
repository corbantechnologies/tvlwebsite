import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.tamarind.co.ke" },
      { protocol: "https", hostname: "tml-files.tamarind.co.ke" },
      { protocol: "https", hostname: "tamarind.co.ke" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/booking/confirmation",
        destination: "/booking-confirmed",
        permanent: true,
      },
      {
        source: "/booking/confirmed",
        destination: "/booking-confirmed",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
