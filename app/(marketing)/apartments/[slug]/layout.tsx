import type { Metadata } from "next";
import { getDb, isDbConfigured } from "@/lib/db/db";
import { apartments } from "@/lib/db/schema";
import { apartmentSlug, jsonLdScript } from "@/lib/seo";
import { siteUrl } from "@/lib/mailer";
import { PROPERTY } from "@/lib/contact";

// Server-side title, description and structured data for each apartment page
// (the page itself is a client component, so it cannot export metadata).

async function findApartment(slug: string) {
  if (!isDbConfigured()) return null;
  try {
    const rows = await getDb().select().from(apartments);
    const clean = decodeURIComponent(slug).toLowerCase();
    return rows.find((a) => a.isActive !== false && (apartmentSlug(a.id) === clean || a.id.toLowerCase() === clean)) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const apt = await findApartment(slug);
  if (!apt) return { title: "Apartments | Tamarind Village Mombasa" };
  const title = `${apt.name} | Tamarind Village Mombasa`;
  const description = `${apt.name}: ${apt.bedrooms} bedroom${apt.bedrooms === 1 ? "" : "s"}, up to ${apt.maxGuests} guests, ${apt.viewType}. From USD ${apt.pricePerNight} per night. Book direct with Tamarind Village.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl()}/apartments/${apartmentSlug(apt.id)}` },
    openGraph: { title, description, images: apt.image ? [{ url: apt.image }] : undefined, type: "website" },
  };
}

export default async function ApartmentLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apt = await findApartment(slug);
  const jsonLd = apt
    ? {
        "@context": "https://schema.org",
        "@type": "Accommodation",
        name: apt.name,
        description: apt.description,
        image: [apt.image, ...(apt.gallery || [])].filter(Boolean).slice(0, 6),
        numberOfBedrooms: apt.bedrooms,
        numberOfBathroomsTotal: apt.bathrooms,
        occupancy: { "@type": "QuantitativeValue", maxValue: apt.maxGuests },
        floorSize: apt.size,
        amenityFeature: (apt.amenities || []).slice(0, 15).map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
        containedInPlace: { "@type": "Hotel", name: PROPERTY.name, url: siteUrl() },
        offers: { "@type": "Offer", price: apt.pricePerNight, priceCurrency: "USD", url: `${siteUrl()}/apartments/${apartmentSlug(apt.id)}` },
      }
    : null;
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />}
      {children}
    </>
  );
}
