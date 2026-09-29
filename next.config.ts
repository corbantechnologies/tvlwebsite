import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "media.tamarind.co.ke" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "tamarind.co.ke" },
    ],
  },
};

export default nextConfig;
