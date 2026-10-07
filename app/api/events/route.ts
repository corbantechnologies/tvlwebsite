import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { events } from "@/lib/db/schema";
import { DEFAULT_EVENTS } from "@/lib/data";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const data = await db.select().from(events);
    return NextResponse.json({ events: data || [] });
  } catch (err: any) {
    console.warn("Events DB lookup failed, returning baseline:", err);
    return NextResponse.json({ events: [], database_error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const newEvent = {
      id: body.id || "evt_" + Date.now(),
      title: body.title,
      slug,
      description: body.description || "",
      brand: body.brand || "tamarind_restaurant",
      venue: body.venue || "Tamarind Mombasa",
      city: body.city || "Mombasa",
      category: body.category || "dining_gala",
      startDate: body.startDate || body.eventDate,
      endDate: body.endDate || null,
      timeText: body.timeText || body.eventTime || "6:30 PM - 10:30 PM",
      priceUsd: Number(body.priceUsd ?? body.ticketPriceUsd ?? 0),
      priceKes: Number(body.priceKes ?? body.ticketPriceKes ?? 0),
      image: body.image || body.posterUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
      gallery: body.gallery || [],
      maxCapacity: Number(body.maxCapacity || body.capacity || 100),
      bookedCount: Number(body.bookedCount || 0),
      highlights: body.highlights || [],
      dressCode: body.dressCode || "Smart Casual",
      bookingLink: body.bookingLink || "",
      externalTicketUrl: body.externalTicketUrl || null,
      paymentEnabled: !!body.paymentEnabled,
      isFeatured: !!body.isFeatured,
      isActive: body.isActive !== false,
      gatePin: body.gatePin || "2026",
      subaccountCode: body.subaccountCode || null,
      createdAt: new Date().toISOString()
    };
    await db.insert(events).values(newEvent as any);
    return NextResponse.json({ success: true, event: newEvent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create event" }, { status: 500 });
  }
}
