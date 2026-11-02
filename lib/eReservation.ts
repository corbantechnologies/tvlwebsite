import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { bookings } from "@/lib/db/schema";
import { PROPERTY, freeCancellationHours } from "@/lib/contact";
import { siteUrl } from "@/lib/mailer";
import { paidLabel } from "@/lib/bookingFormat";

type Booking = typeof bookings.$inferSelect;

// ============================================================
// The guest's e-reservation: a one-page PDF (attached to the
// confirmation email) and the same details at /reservation/<token>.
// The QR code opens that page, so front desk can scan it on arrival.
// ============================================================

export function eReservationUrl(b: Pick<Booking, "guestToken">): string {
  return `${siteUrl()}/reservation/${encodeURIComponent(b.guestToken || "")}`;
}

export async function eReservationQrSvg(b: Pick<Booking, "guestToken">): Promise<string> {
  return QRCode.toString(eReservationUrl(b), { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1F1615", light: "#FFFFFF" } });
}

export function stayRows(b: Booking): [string, string][] {
  const rows: [string, string][] = [
    ["Booking reference", b.bookingReference],
    ["Guest", b.guestName],
    ["Apartment", b.apartmentName + (b.allocatedUnit ? ` (${b.allocatedUnit})` : "")],
    ["Check-in", `${b.checkIn}, from 2:00 pm`],
    ["Check-out", `${b.checkOut}, by 10:00 am`],
    ["Nights", String(b.nights ?? "")],
    ["Guests", `${b.adults} adult${b.adults === 1 ? "" : "s"}${b.children ? `, ${b.children} child${b.children === 1 ? "" : "ren"}` : ""}`],
  ];
  if (b.mealPlanName) rows.push(["Meal plan", b.mealPlanName]);
  rows.push(["Payment", b.paymentStatus === "paid" ? `Paid, ${paidLabel(b)}` : `${b.paymentStatus} (${b.currency} ${Number(b.totalAmount).toLocaleString()})`]);
  if (b.specialRequests) rows.push(["Requests", b.specialRequests]);
  return rows;
}

const MAROON = rgb(0x82 / 255, 0x11 / 255, 0x24 / 255);
const GOLD = rgb(0xc5 / 255, 0x9b / 255, 0x27 / 255);
const INK = rgb(0x1f / 255, 0x16 / 255, 0x15 / 255);
const MUTED = rgb(0x8b / 255, 0x73 / 255, 0x55 / 255);

/** Standard PDF fonts only cover Latin-1; replace anything else so drawing never throws. */
function latin1(text: string): string {
  return String(text ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/→/g, "->")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function wrap(text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, maxWidth: number): string[] {
  const words = latin1(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 6);
}

export async function buildEReservationPdf(b: Booking): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tamarind Village e-reservation ${b.bookingReference}`);
  pdf.setAuthor(PROPERTY.name);
  const page = pdf.addPage([595, 842]); // A4
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const margin = 50;

  // Header band
  page.drawRectangle({ x: 0, y: 742, width, height: 100, color: MAROON });
  page.drawText("TAMARIND VILLAGE", { x: margin, y: 795, size: 24, font: serif, color: rgb(1, 1, 1) });
  page.drawText("E-RESERVATION", { x: margin, y: 770, size: 11, font: sansBold, color: GOLD });
  page.drawText(latin1(b.bookingReference), { x: width - margin - sansBold.widthOfTextAtSize(latin1(b.bookingReference), 14), y: 790, size: 14, font: sansBold, color: rgb(1, 1, 1) });

  // QR code
  const qrPng = await QRCode.toBuffer(eReservationUrl(b), { type: "png", margin: 1, width: 300, errorCorrectionLevel: "M" });
  const qr = await pdf.embedPng(qrPng);
  page.drawImage(qr, { x: width - margin - 130, y: 580, width: 130, height: 130 });
  page.drawText("Show this code at reception", { x: width - margin - 130, y: 566, size: 8, font: sans, color: MUTED });

  // Status line
  const confirmed = b.paymentStatus === "paid" && !["cancelled", "no_show"].includes(b.bookingStatus);
  page.drawText(confirmed ? "Reservation confirmed" : `Status: ${latin1(b.bookingStatus.replace(/_/g, " "))}`, {
    x: margin,
    y: 700,
    size: 18,
    font: serif,
    color: confirmed ? INK : MAROON,
  });

  // Details table
  let y = 670;
  for (const [label, value] of stayRows(b)) {
    const lines = wrap(value, sans, 11, 270);
    page.drawText(latin1(label).toUpperCase(), { x: margin, y, size: 8, font: sansBold, color: MUTED });
    lines.forEach((l, i) => page.drawText(l, { x: margin + 120, y: y - i * 14, size: 11, font: sans, color: INK }));
    y -= Math.max(1, lines.length) * 14 + 10;
  }

  // Practical info
  y = Math.min(y, 520) - 10;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: GOLD });
  y -= 24;
  page.drawText("Before you arrive", { x: margin, y, size: 13, font: serif, color: MAROON });
  y -= 18;
  const tips = [
    `Complete online check-in to save time at reception: ${siteUrl()}/track?token=${b.guestToken}`,
    "Please bring the passport or national ID of every adult guest.",
    `Free cancellation until ${freeCancellationHours()} hours before check-in. After that, contact reservations.`,
    "Airport and SGR transfers can be arranged; reply to your confirmation email or message us on WhatsApp.",
  ];
  for (const t of tips) {
    for (const [i, l] of wrap(t, sans, 10, width - margin * 2 - 12).entries()) {
      page.drawText(i === 0 ? "-" : " ", { x: margin, y, size: 10, font: sans, color: GOLD });
      page.drawText(l, { x: margin + 12, y, size: 10, font: sans, color: INK });
      y -= 14;
    }
    y -= 4;
  }

  // Footer
  page.drawText(latin1(`${PROPERTY.name} · ${PROPERTY.address}`), { x: margin, y: 60, size: 9, font: sans, color: MUTED });
  page.drawText(latin1(`${PROPERTY.phoneDisplay} · ${PROPERTY.email}`), { x: margin, y: 46, size: 9, font: sans, color: MUTED });

  return Buffer.from(await pdf.save());
}
