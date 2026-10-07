import { Resend } from "resend";

export async function sendTicketConfirmationEmail(ticket: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !ticket.guestEmail) return;
  const resend = new Resend(key);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://tamarindvillage.co.ke";
  const passUrl = `${siteUrl}/events/ticket-confirmed?reference=${encodeURIComponent(ticket.ticketReference)}`;

  // Human readable brand name
  const brandLabels: Record<string, string> = {
    tamarind_village: "Tamarind Village Mombasa",
    tamarind_restaurant: "Tamarind Mombasa Restaurant",
    dawa_terrace: "Dawa Terrace Bar & Lounge",
    tamarind_dhow: "Tamarind Dhow Dining Experience",
    golden_key: "Golden Key Casino",
  };
  const brandName = brandLabels[ticket.brand] || "Tamarind Mombasa";

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke",
      to: ticket.guestEmail,
      subject: `E-Ticket Pass: ${ticket.eventTitle} — Ref: ${ticket.ticketReference}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #821124; padding: 32px 24px; text-align: center; color: #ffffff;">
            <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 11px; margin: 0 0 8px; opacity: 0.85;">Official Event Pass</p>
            <h1 style="font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">${brandName}</h1>
            <p style="font-size: 14px; margin: 6px 0 0; color: #fecdd3;">${ticket.eventTitle}</p>
          </div>

          <div style="padding: 32px 28px;">
            <p style="font-size: 15px; color: #334155; margin: 0 0 16px;">Dear <strong>${ticket.guestName}</strong>,</p>
            <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px;">
              Your event pass is confirmed and active! Please present this E-Ticket email or QR Code at the gate entrance on the day of the event.
            </p>

            <!-- Pass Ticket Card -->
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Ticket Reference</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #821124; font-family: monospace;">${ticket.ticketReference}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Event Date</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${ticket.eventDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Venue</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${ticket.venue}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Pass Count</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${ticket.ticketCount} Attendee(s)</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Total Amount</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #047857;">${ticket.currency} ${Number(ticket.totalAmountKes).toLocaleString()} (PAID)</td>
                </tr>
                ${ticket.voucherCode ? `<tr><td style="padding: 6px 0; color: #64748b;">Voucher Applied</td><td style="padding: 6px 0; font-family: monospace;">${ticket.voucherCode}</td></tr>` : ""}
                ${ticket.dietaryRequirements ? `<tr><td style="padding: 6px 0; color: #64748b;">Dietary Request</td><td style="padding: 6px 0; color: #1e293b;">${ticket.dietaryRequirements}</td></tr>` : ""}
              </table>

              <!-- QR Token & Verification -->
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="font-size: 11px; text-transform: uppercase; color: #64748b; margin: 0 0 6px; letter-spacing: 1px;">Gate Security QR Token</p>
                <div style="display: inline-block; padding: 6px 14px; background-color: #1e293b; color: #f8fafc; font-family: monospace; font-size: 13px; font-weight: 700; border-radius: 6px;">
                  ${ticket.ticketQrToken}
                </div>
              </div>
            </div>

            <!-- View Online Pass CTA -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${passUrl}" style="display: inline-block; background-color: #821124; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;">
                View &amp; Print E-Ticket Pass
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
              For inquiries or special requests, please reply to this email or call +254 725 959 552.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error("[Ticket Email] Failed to send guest email:", err.message);
  }
}

export async function notifyStaffNewTicket(ticket: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const staffEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "reservations.village@tamarind.co.ke",
      to: staffEmail,
      subject: `[Event Ticket Sold] ${ticket.guestName} · ${ticket.eventTitle} (${ticket.ticketCount} pax)`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2 style="color: #821124; margin-top: 0;">Event Ticket Confirmed</h2>
          <p><strong>Event:</strong> ${ticket.eventTitle}</p>
          <p><strong>Brand / Unit:</strong> ${ticket.brand}</p>
          <p><strong>Ticket Ref:</strong> ${ticket.ticketReference}</p>
          <p><strong>Guest:</strong> ${ticket.guestName} (${ticket.guestEmail} / ${ticket.guestPhone})</p>
          <p><strong>Attendees:</strong> ${ticket.ticketCount}</p>
          <p><strong>Total Paid:</strong> ${ticket.currency} ${Number(ticket.totalAmountKes).toLocaleString()}</p>
          <p><strong>Subaccount:</strong> ${ticket.subaccountCode || "Main Account"}</p>
          ${ticket.dietaryRequirements ? `<p><strong>Dietary:</strong> ${ticket.dietaryRequirements}</p>` : ""}
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">View this ticket in the Event Hosting Desk Ledger at /admin/events/ledger</p>
        </div>
      `,
    });
  } catch (err: any) {
    console.error("[Ticket Staff Email] Failed:", err.message);
  }
}
