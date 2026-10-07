import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { bookings, eventTickets, events, auditLogs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { Resend } from "resend";
import { sendTicketConfirmationEmail, notifyStaffNewTicket } from "@/lib/eventTicketEmail";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    await ensureDatabaseSeeded();
    const { reference } = await params;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET) {
      return NextResponse.json(
        { error: "Payment verification unavailable: missing Paystack secret key." },
        { status: 500 }
      );
    }

    if (!reference) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    const db = getDb();

    // 1. Check if an event ticket already exists for this reference
    const existingTicket = await db
      .select()
      .from(eventTickets)
      .where(eq(eventTickets.ticketReference, reference))
      .limit(1);

    if (existingTicket.length > 0) {
      return NextResponse.json({
        success: true,
        isEventTicket: true,
        ticket: existingTicket[0],
      });
    }

    // 2. Check if a booking already exists for this reference
    const existingBooking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingReference, reference))
      .limit(1);

    if (existingBooking.length > 0 && existingBooking[0].paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        isEventTicket: false,
        booking: existingBooking[0],
        guestToken: existingBooking[0].guestToken,
      });
    }

    // 3. Verify with Paystack API
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json(
        {
          error: paystackData.message || "Payment has not been confirmed by Paystack.",
          paystackStatus: paystackData.data?.status,
        },
        { status: 400 }
      );
    }

    const txData = paystackData.data;
    const metadata = txData.metadata || {};

    // 4. Handle EVENT TICKETS
    if (metadata.type === "event_ticket" || reference.startsWith("TKT-")) {
      const ticketCount = Number(metadata.ticketCount) || 1;
      const unitPriceKes = Number(metadata.unitPriceKes) || Math.round(txData.amount / 100);
      const totalAmountKes = Math.round(txData.amount / 100);

      const qrToken =
        "QR-" +
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        "-" +
        Date.now().toString(36).substring(4).toUpperCase();

      const newTicket = {
        id: "tkt_" + Date.now(),
        ticketReference: reference,
        eventId: metadata.eventId || "resort_event",
        eventTitle: metadata.eventTitle || "Resort Special Event",
        brand: metadata.brand || "tamarind_village",
        venue: metadata.venue || "Tamarind Village Mombasa",
        eventDate: metadata.eventDate || new Date().toISOString().split("T")[0],
        guestName: metadata.guestName || txData.customer?.first_name || "Valued Guest",
        guestEmail: metadata.guestEmail || txData.customer?.email || "",
        guestPhone: metadata.guestPhone || txData.customer?.phone || "",
        ticketCount,
        unitPriceKes,
        unitPriceUsd: Number(metadata.unitPriceUsd) || 0,
        totalAmountKes,
        totalAmountUsd: Number(metadata.totalAmountUsd) || 0,
        currency: txData.currency || "KES",
        discountAmountKes: Number(metadata.discountAmountKes) || 0,
        voucherCode: metadata.voucherCode || null,
        paymentStatus: "paid",
        paymentMethod: txData.channel || "paystack",
        paymentReference: reference,
        subaccountCode: txData.subaccount?.subaccount_code || metadata.subaccountCode || null,
        checkInStatus: "pending",
        dietaryRequirements: metadata.dietaryRequirements || null,
        specialRequests: metadata.specialRequests || null,
        ticketQrToken: qrToken,
        createdAt: new Date().toISOString(),
      };

      await db.insert(eventTickets).values(newTicket);

      // Increment bookedCount for this event if event exists
      if (metadata.eventId) {
        try {
          await db
            .update(events)
            .set({
              bookedCount: sql`COALESCE(${events.bookedCount}, 0) + ${ticketCount}`,
            })
            .where(eq(events.id, metadata.eventId));
        } catch (e: any) {
          console.warn("[Ticket Verify] Could not update event bookedCount:", e.message);
        }
      }

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: "Paystack Gateway",
        actorRole: "system",
        category: "event_ticket",
        action: "Event Ticket Purchased & Verified",
        details: `Ticket ${newTicket.ticketReference} purchased for ${newTicket.eventTitle} by ${newTicket.guestName} (${ticketCount} tickets, KES ${totalAmountKes})`,
        targetId: newTicket.id,
        metadata: { ticketReference: newTicket.ticketReference, paymentReference: reference },
      });

      // Dispatch E-Ticket email and staff notification
      await Promise.allSettled([
        sendTicketConfirmationEmail(newTicket),
        notifyStaffNewTicket(newTicket),
      ]);

      return NextResponse.json({
        success: true,
        isEventTicket: true,
        ticket: newTicket,
      });
    }

    // 5. Handle APARTMENT BOOKINGS
    let confirmedBooking: any = null;

    if (existingBooking.length > 0) {
      const b = existingBooking[0];
      await db
        .update(bookings)
        .set({
          paymentStatus: "paid",
          paymentMethod: txData.channel || "paystack",
          paymentReference: reference,
          bookingStatus: "confirmed",
        })
        .where(eq(bookings.id, b.id));

      confirmedBooking = {
        ...b,
        paymentStatus: "paid",
        paymentMethod: txData.channel || "paystack",
        paymentReference: reference,
        bookingStatus: "confirmed",
      };
    } else {
      // Create new booking record from metadata
      const rawToken = Math.random().toString(36).substring(2, 8).toUpperCase();
      const guestToken = metadata.guestToken || `TVL-${rawToken}`;
      const nights = Number(metadata.nights) || 1;

      const newBooking = {
        id: "bkg_" + Date.now(),
        bookingReference: reference,
        inquiryId: metadata.inquiryId || null,
        apartmentId: metadata.apartmentId || "1-bedroom",
        apartmentName: metadata.apartmentName || "1 Bedroom Suite",
        allocatedUnit: null,
        guestName: metadata.guestName || txData.customer?.first_name || "Guest",
        guestEmail: metadata.guestEmail || txData.customer?.email || "",
        guestPhone: metadata.guestPhone || txData.customer?.phone || "",
        checkIn: metadata.checkIn || new Date().toISOString().split("T")[0],
        checkOut: metadata.checkOut || new Date(Date.now() + 86400000 * nights).toISOString().split("T")[0],
        adults: Number(metadata.adults) || 1,
        children: Number(metadata.children) || 0,
        mealPlanId: metadata.mealPlanId || null,
        mealPlanName: metadata.mealPlanName || null,
        mealPlanPricePerPersonUsd: Number(metadata.mealPlanPricePerPersonUsd) || 0,
        mealPlanPricePerPersonKes: Number(metadata.mealPlanPricePerPersonKes) || 0,
        roomRateUsd: Number(metadata.roomRateUsd) || 0,
        roomRateKes: Number(metadata.roomRateKes) || 0,
        nights,
        totalRoomUsd: Number(metadata.totalRoomUsd) || 0,
        totalMealPlanUsd: Number(metadata.totalMealPlanUsd) || 0,
        totalExtrasUsd: Number(metadata.totalExtrasUsd) || 0,
        totalAmount: Math.round(txData.amount / 100),
        currency: txData.currency || "KES",
        paymentStatus: "paid",
        paymentMethod: txData.channel || "paystack",
        paymentReference: reference,
        bookingStatus: "confirmed",
        inquirySource: "village_apartment",
        specialRequests: metadata.specialRequests || null,
        staffNotes: [],
        guestToken,
        createdAt: new Date().toISOString(),
      };

      await db.insert(bookings).values(newBooking);
      confirmedBooking = newBooking;
    }

    await db.insert(auditLogs).values({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Paystack Gateway",
      actorRole: "system",
      category: "booking",
      action: "Booking Payment Verified",
      details: `Payment of ${txData.currency} ${Math.round(txData.amount / 100)} verified for ${confirmedBooking.bookingReference} (${confirmedBooking.guestName})`,
      targetId: confirmedBooking.id,
      metadata: { bookingReference: confirmedBooking.bookingReference, channel: txData.channel },
    });

    // Send confirmation emails
    await Promise.allSettled([
      sendApartmentBookingEmail(confirmedBooking),
      notifyStaffApartmentBooking(confirmedBooking),
    ]);

    return NextResponse.json({
      success: true,
      isEventTicket: false,
      booking: confirmedBooking,
      guestToken: confirmedBooking.guestToken,
    });
  } catch (err: any) {
    console.error("[Paystack Verify] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function sendApartmentBookingEmail(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !booking.guestEmail) return;
  const resend = new Resend(key);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://tamarindvillage.co.ke";
  const guestPortalUrl = `${siteUrl}/track?token=${booking.guestToken}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke",
      to: booking.guestEmail,
      subject: `Your Tamarind Village Reservation — ${booking.bookingReference}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fdfaf7;border:1px solid #e2d9d0;padding:40px;color:#1F1615">
          <h1 style="color:#821124;font-size:22px;letter-spacing:2px;text-transform:uppercase;text-align:center">Tamarind Village</h1>
          <hr style="border:none;border-top:1px solid #e2d9d0;margin:24px 0"/>
          <h2 style="font-size:18px">Reservation Confirmed &amp; Paid</h2>
          <p style="font-size:14px;line-height:1.8">Dear ${booking.guestName},</p>
          <p style="font-size:14px;line-height:1.8">Your payment via Paystack was successful. Your reservation is officially confirmed!</p>
          <div style="background:#f5f0eb;border-left:4px solid #821124;padding:20px;margin:24px 0">
            <table style="width:100%;font-size:13px;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#8b7355;width:40%">Booking Reference</td><td style="font-weight:bold;color:#821124">${booking.bookingReference}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Suite</td><td>${booking.apartmentName}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Check-In</td><td>${booking.checkIn}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Check-Out</td><td>${booking.checkOut}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Nights</td><td>${booking.nights}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Guests</td><td>${booking.adults} adults${booking.children > 0 ? `, ${booking.children} children` : ""}</td></tr>
              <tr><td style="padding:6px 0;color:#8b7355">Total Paid</td><td style="font-weight:bold;color:#047857">${booking.currency} ${Number(booking.totalAmount).toLocaleString()}</td></tr>
            </table>
          </div>
          <div style="background:#fffbe8;border:1px solid #e2c589;padding:16px;border-radius:4px;margin:24px 0">
            <p style="font-size:13px;margin:0"><strong>Manage your booking online:</strong></p>
            <p style="font-size:12px;margin:8px 0 0;color:#8b7355">Reference code: <strong style="color:#1F1615">${booking.guestToken}</strong></p>
            <p style="font-size:12px;margin:4px 0 0">Visit: <a href="${guestPortalUrl}" style="color:#821124">${guestPortalUrl}</a></p>
          </div>
          <p style="font-size:13px">📞 +254 725 959 552<br/>✉ reservations.village@tamarind.co.ke</p>
        </div>`,
    });
  } catch (e: any) {
    console.error("[Booking Email] Failed:", e.message);
  }
}

async function notifyStaffApartmentBooking(booking: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const staffEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke",
      to: staffEmail,
      subject: `[Paid Reservation Confirmed] ${booking.guestName} · ${booking.bookingReference}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #e2d9d0">
          <h2 style="color:#821124">Paid Reservation Confirmed</h2>
          <p><strong>Reference:</strong> ${booking.bookingReference}</p>
          <p><strong>Guest:</strong> ${booking.guestName} (${booking.guestEmail} / ${booking.guestPhone})</p>
          <p><strong>Suite:</strong> ${booking.apartmentName}</p>
          <p><strong>Check-In:</strong> ${booking.checkIn} → <strong>Check-Out:</strong> ${booking.checkOut}</p>
          <p><strong>Total Paid:</strong> ${booking.currency} ${Number(booking.totalAmount).toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>
        </div>`,
    });
  } catch (e: any) {
    console.error("[Staff Booking Email] Failed:", e.message);
  }
}
