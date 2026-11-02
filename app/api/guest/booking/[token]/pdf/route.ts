import { NextRequest, NextResponse } from "next/server";
import { bookingByGuestToken } from "@/lib/guestLookup";
import { buildEReservationPdf } from "@/lib/eReservation";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";

// GET /api/guest/booking/[token]/pdf  (public, authorised by the guest token)
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limited = await rateLimit(req, RATE_LIMITS.guestLookup);
  if (limited) return limited;
  const { token } = await params;
  const booking = await bookingByGuestToken(token);
  if (!booking || booking.bookingStatus === "pending_payment") {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }
  const pdf = await buildEReservationPdf(booking);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Tamarind-Village-${booking.bookingReference}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
