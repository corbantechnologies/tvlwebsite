import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/db";
import { bookings } from "@/lib/db/schema";
import { sendApartmentBookingEmail } from "@/lib/bookingPaymentService";
import { staffFromRequest } from "@/lib/auth/staffHeaders";
import { writeAuditLog } from "@/lib/audit";

// POST /api/bookings/[id]/resend-confirmation  (staff)
// Sends the guest their confirmation email and e-reservation PDF again.
// Only ever triggered by a staff member clicking the button.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = staffFromRequest(req);
  const [booking] = await getDb().select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Only paid bookings have a confirmation to send." }, { status: 409 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email is not configured (RESEND_API_KEY)." }, { status: 503 });
  }
  await sendApartmentBookingEmail(booking);
  await writeAuditLog({
    actor: staff.name,
    actorRole: staff.role,
    category: "booking",
    action: "Confirmation Re-sent",
    details: `${staff.name} re-sent the confirmation for ${booking.bookingReference} to ${booking.guestEmail}.`,
    targetId: booking.id,
  });
  return NextResponse.json({ success: true, message: `Confirmation sent to ${booking.guestEmail}.` });
}
