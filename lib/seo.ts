import { PROPERTY } from "@/lib/contact";
import { siteUrl } from "@/lib/mailer";

/** Public URL slug for an apartment type id (matches the apartments pages). */
export function apartmentSlug(id: string): string {
  const lower = (id || "").toLowerCase();
  if (lower.includes("2") || lower.includes("two")) return "two-bedroom";
  if (lower.includes("3") || lower.includes("three")) return "three-bedroom";
  if (lower.includes("1") || lower.includes("one")) return "one-bedroom";
  return lower.replace(/\s+/g, "-");
}

/** schema.org description of the property, for search engines and Google Hotels. */
export function hotelJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: PROPERTY.name,
    url,
    logo: `${url}/assets/logo.png`,
    image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg",
    description: "Serviced apartments overlooking Tudor Creek and Mombasa Old Harbour, with Tamarind Restaurant and the Tamarind Dhow on site.",
    telephone: PROPERTY.phoneDisplay.replace(/\s/g, ""),
    email: PROPERTY.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Silversands Road, Nyali",
      addressLocality: "Mombasa",
      addressCountry: "KE",
    },
    geo: { "@type": "GeoCoordinates", latitude: -4.0469, longitude: 39.6857 },
    checkinTime: "14:00",
    checkoutTime: "10:00",
    priceRange: "$$$",
    amenityFeature: ["Swimming pool", "Free WiFi", "Restaurant", "Airport transfer", "Sea view"].map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
  };
}

/** Renders JSON-LD safely inside a <script> tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
