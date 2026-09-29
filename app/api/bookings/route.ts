import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, auditLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

const INITIAL_FRONTDESK_BOOKINGS = [
  {
    id: "res_001",
    bookingReference: "BK-2026-091",
    apartmentId: "3-bedroom",
    apartmentName: "Villa 104 - 3 Bedroom Harbour Villa",
    guestName: "Ambassador David K. Mutua",
    guestEmail: "david.mutua@diplomacy.go.ke",
    guestPhone: "+254 722 100 200",
    checkIn: "2026-09-29",
    checkOut: "2026-10-04",
    adults: 4,
    children: 0,
    packageId: "hb",
    packageName: "Half Board Dine Around",
    totalAmount: 2125,
    currency: "USD",
    paymentStatus: "paid",
    bookingStatus: "arriving_today",
    specialRequests: "VIP Guest. Chilled champagne on arrival. Dhow sunset cruise reserved for tomorrow.",
    staffNotes: [
      { text: "VIP protocol informed.", timestamp: "2026-09-29T08:00:00Z", author: "Front Desk" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "res_002",
    bookingReference: "BK-2026-092",
    apartmentId: "1-bedroom",
    apartmentName: "Suite 201 - 1 Bedroom Ocean Penthouse",
    guestName: "Claire & Marcus Sterling",
    guestEmail: "claire.sterling@domain.co.uk",
    guestPhone: "+44 7911 123456",
    checkIn: "2026-09-29",
    checkOut: "2026-10-02",
    adults: 2,
    children: 0,
    packageId: "bb",
    packageName: "Bed & Breakfast",
    totalAmount: 702,
    currency: "USD",
    paymentStatus: "paid",
    bookingStatus: "arriving_today",
    specialRequests: "Honeymoon couple. Flower petals and ocean-facing balcony breakfast.",
    staffNotes: [
      { text: "Honeymoon welcome package prepared.", timestamp: "2026-09-29T09:30:00Z", author: "Front Desk" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "res_003",
    bookingReference: "BK-2026-093",
    apartmentId: "2-bedroom",
    apartmentName: "Suite 102 - 2 Bedroom Garden Suite",
    guestName: "Eng. Farooq Al-Mansoor",
    guestEmail: "farooq.almansoor@adnoc.ae",
    guestPhone: "+971 50 123 4567",
    checkIn: "2026-09-25",
    checkOut: "2026-09-29",
    adults: 2,
    children: 2,
    packageId: "ro",
    packageName: "Room Only - Flexible",
    totalAmount: 1312,
    currency: "USD",
    paymentStatus: "paid",
    bookingStatus: "departing_today",
    specialRequests: "Late checkout granted until 14:00. Airport Alphard transfer arranged for 14:30.",
    staffNotes: [
      { text: "Late check-out authorized by Duty Manager.", timestamp: "2026-09-29T10:15:00Z", author: "Duty Manager" }
    ],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: "res_004",
    bookingReference: "BK-2026-094",
    apartmentId: "1-bedroom",
    apartmentName: "Suite 305 - 1 Bedroom Clifftop Suite",
    guestName: "Dr. Sarah Wanjiku",
    guestEmail: "sarah.wanjiku@kenyaresearch.org",
    guestPhone: "+254 733 456 789",
    checkIn: "2026-09-27",
    checkOut: "2026-10-01",
    adults: 1,
    children: 0,
    packageId: "hb",
    packageName: "Stay & Dine Half Board",
    totalAmount: 1088,
    currency: "USD",
    paymentStatus: "paid",
    bookingStatus: "in_house",
    specialRequests: "Dietary: Gluten-free. Tamarind Restaurant table requested for tonight 20:00.",
    staffNotes: [
      { text: "Gluten-free requirement relayed to Executive Chef.", timestamp: "2026-09-27T16:00:00Z", author: "Concierge" }
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    let records = await db.select().from(bookings).orderBy(desc(bookings.createdAt));

    // Auto-seed initial operational records if empty
    if (!records || records.length === 0) {
      for (const b of INITIAL_FRONTDESK_BOOKINGS) {
        await db.insert(bookings).values(b).onConflictDoNothing();
      }
      records = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    }

    return NextResponse.json({ success: true, bookings: records });
  } catch (err: any) {
    console.error("[API /api/bookings GET] Error:", err.message);
    return NextResponse.json({ success: false, bookings: INITIAL_FRONTDESK_BOOKINGS, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const db = getDb();

    const newBooking = {
      id: "res_" + Date.now(),
      bookingReference: "BK-" + new Date().getFullYear() + "-" + Math.floor(100 + Math.random() * 900),
      inquiryId: body.inquiryId || null,
      apartmentId: body.apartmentId || "1-bedroom",
      apartmentName: body.apartmentName || "1 Bedroom Suite",
      guestName: body.guestName || "Guest",
      guestEmail: body.guestEmail || "",
      guestPhone: body.guestPhone || "",
      checkIn: body.checkIn || new Date().toISOString().split("T")[0],
      checkOut: body.checkOut || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      adults: Number(body.adults) || 1,
      children: Number(body.children) || 0,
      packageId: body.packageId || "ro",
      packageName: body.packageName || "Room Only",
      totalAmount: Number(body.totalAmount) || 0,
      currency: body.currency || "USD",
      paymentStatus: body.paymentStatus || "unpaid",
      paymentMethod: body.paymentMethod || "card",
      bookingStatus: body.bookingStatus || "confirmed",
      specialRequests: body.specialRequests || "",
      staffNotes: body.staffNotes || [],
      createdAt: new Date().toISOString(),
    };

    await db.insert(bookings).values(newBooking);

    // Audit Log entry
    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "staff",
      actorRole: "Front Desk",
      category: "booking",
      action: "New Reservation Created",
      details: `Created reservation ${newBooking.bookingReference} for ${newBooking.guestName}`,
      targetId: newBooking.id,
      metadata: { bookingReference: newBooking.bookingReference }
    });

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (err: any) {
    console.error("[API /api/bookings POST] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const { id, action, bookingStatus, note } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const db = getDb();
    const existing = await db.select().from(bookings).where(eq(bookings.id, id));

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Booking record not found" }, { status: 404 });
    }

    const currentBooking = existing[0];
    const updatePayload: Record<string, any> = {};

    if (action === "check-in") {
      updatePayload.bookingStatus = "in_house";
    } else if (action === "check-out") {
      updatePayload.bookingStatus = "checked_out";
    } else if (bookingStatus) {
      updatePayload.bookingStatus = bookingStatus;
    }

    if (note) {
      const currentNotes = (currentBooking.staffNotes as any[]) || [];
      updatePayload.staffNotes = [
        ...currentNotes,
        { text: note, timestamp: new Date().toISOString(), author: "Front Desk Staff" }
      ];
    }

    if (Object.keys(updatePayload).length > 0) {
      await db.update(bookings).set(updatePayload).where(eq(bookings.id, id));

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: "staff",
        actorRole: "Front Desk",
        category: "operations",
        action: `Front Desk Operation: ${action || "Status Update"}`,
        details: `Updated booking ${currentBooking.bookingReference} (${currentBooking.guestName}): status changed to ${updatePayload.bookingStatus || currentBooking.bookingStatus}`,
        targetId: id,
        metadata: updatePayload
      });
    }

    const updated = await db.select().from(bookings).where(eq(bookings.id, id));
    return NextResponse.json({ success: true, booking: updated[0] });
  } catch (err: any) {
    console.error("[API /api/bookings PATCH] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
