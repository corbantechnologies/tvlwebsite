import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { inquiries, auditLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { Resend } from "resend";

// ============================================================
// Venue → staff email routing
// ============================================================
function getStaffEmailForVenue(venue: string): string {
  const map: Record<string, string | undefined> = {
    village_apartment: process.env.EMAIL_VILLAGE,
    restaurant: process.env.EMAIL_RESTAURANT,
    dhow: process.env.EMAIL_DHOW,
    dawa_terrace: process.env.EMAIL_DAWA,
    golden_key: process.env.EMAIL_GOLDEN_KEY,
    event: process.env.EMAIL_VILLAGE, // events route back to village inbox by default
    general: process.env.EMAIL_VILLAGE,
  };
  return map[venue] || process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
}

function getVenueDisplayName(venue: string): string {
  const names: Record<string, string> = {
    village_apartment: "Tamarind Village Apartments",
    restaurant: "Tamarind Mombasa Restaurant",
    dhow: "Tamarind Dhow",
    dawa_terrace: "Dawa Terrace",
    golden_key: "Golden Key Casino",
    event: "Tamarind Events",
    general: "Tamarind Village",
  };
  return names[venue] || "Tamarind Village";
}

// ============================================================
// GET /api/inquiries — admin: list all inquiries (newest first)
// ============================================================
export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const db = getDb();
    const data = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
    return NextResponse.json({ inquiries: data });
  } catch (err: any) {
    return NextResponse.json({ inquiries: [], error: err.message }, { status: 500 });
  }
}

// ============================================================
// POST /api/inquiries — public: guest submits a new inquiry
//
// Body:
// {
//   type: "apartment" | "restaurant" | "dawa_terrace" | "dhow" | "golden_key" | "event" | "general",
//   venue: "village_apartment" | "restaurant" | "dawa_terrace" | "dhow" | "golden_key" | "event",
//   payload: { name, email, phone, checkIn, checkOut, guests, requests, ... }
// }
// ============================================================
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();
    const db = getDb();

    // Generate a secure, human-readable guest token (e.g. TVL-A3BX9K)
    const rawToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const guestToken = `TVL-${rawToken}`;

    const venue = body.venue || "village_apartment";

    const newInquiry = {
      id: "inq_" + Date.now(),
      type: body.type || "general",
      venue,
      guestToken,
      payload: {
        ...body.payload,
        // Ensure guestToken is also in payload for any legacy reads
        guestToken,
      },
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    await db.insert(inquiries).values(newInquiry);

    // Audit log
    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "guest",
      actorRole: "guest",
      category: "inquiry",
      action: "New Guest Inquiry Submitted",
      details: `${body.payload?.name || "Guest"} submitted a ${body.type || "general"} inquiry for ${getVenueDisplayName(venue)}`,
      targetId: newInquiry.id,
      metadata: { guestToken, venue },
    });

    // Send staff alert email — routed to correct venue inbox (fire-and-forget)
    sendStaffAlertEmail(newInquiry).catch(console.warn);

    return NextResponse.json({ success: true, inquiry: newInquiry, guestToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit inquiry" }, { status: 500 });
  }
}

// ============================================================
// Staff alert email — routed by venue
// ============================================================
async function sendStaffAlertEmail(inquiry: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const resend = new Resend(key);
  const payload = inquiry.payload || {};
  const venue = inquiry.venue || "village_apartment";
  const staffEmail = getStaffEmailForVenue(venue);
  const venueDisplay = getVenueDisplayName(venue);
  const fromEmail = process.env.EMAIL_FROM || "reservations@tamarind.co.ke";

  // Build a readable summary from the payload
  const details = [
    payload.checkIn && `Check-In: ${payload.checkIn}`,
    payload.checkOut && `Check-Out: ${payload.checkOut}`,
    payload.adults && `Adults: ${payload.adults}`,
    payload.children && `Children: ${payload.children}`,
    payload.apartmentType && `Apartment: ${payload.apartmentType}`,
    payload.mealPlan && `Meal Plan: ${payload.mealPlan}`,
    payload.specialRequests && `Special Requests: ${payload.specialRequests}`,
  ]
    .filter(Boolean)
    .join("<br/>");

  await resend.emails.send({
    from: fromEmail,
    to: staffEmail,
    subject: `[New Inquiry] ${payload.name || "Guest"} — ${venueDisplay}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2d9d0">
        <div style="background:#821124;padding:16px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;font-size:18px;margin:0;letter-spacing:2px">TAMARIND</h1>
          <p style="color:#e2c589;font-size:12px;margin:4px 0 0">${venueDisplay}</p>
        </div>
        <h2 style="color:#821124;font-size:16px">New Guest Inquiry</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">
          <tr style="background:#f5f0eb">
            <td style="padding:8px 12px;color:#8b7355;width:35%">Type</td>
            <td style="padding:8px 12px;font-weight:600">${inquiry.type}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#8b7355">Guest Name</td>
            <td style="padding:8px 12px">${payload.name || "Not provided"}</td>
          </tr>
          <tr style="background:#f5f0eb">
            <td style="padding:8px 12px;color:#8b7355">Email</td>
            <td style="padding:8px 12px">${payload.email || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#8b7355">Phone</td>
            <td style="padding:8px 12px">${payload.phone || "Not provided"}</td>
          </tr>
        </table>
        ${details ? `<div style="background:#f5f0eb;border-left:4px solid #821124;padding:12px 16px;font-size:13px;line-height:1.8">${details}</div>` : ""}
        <div style="background:#fffbe8;border:1px solid #e2c589;padding:12px;margin-top:16px;border-radius:4px;font-size:12px">
          <strong>Guest Token:</strong> ${inquiry.guestToken}
        </div>
        <p style="font-size:12px;color:#8b7355;margin-top:20px">
          Please log in to the staff dashboard to review and respond to this inquiry.
        </p>
      </div>`,
  });
}
