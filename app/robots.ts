import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/mailer";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/track", "/reservation/", "/booking-confirmed", "/events/ticket-confirmed"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
