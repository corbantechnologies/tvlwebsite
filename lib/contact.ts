// Property contact details used on guest-facing pages and emails.
export const PROPERTY = {
  name: "Tamarind Village",
  phoneDisplay: "+254 725 959 552",
  email: "reservations.village@tamarind.co.ke",
  address: "Silversands Road, Nyali, Mombasa, Kenya",
};

/** WhatsApp number in international format without "+" (NEXT_PUBLIC_WHATSAPP_NUMBER). */
export function whatsappNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "254725959552").replace(/[^0-9]/g, "");
}

/** Click-to-chat link that opens WhatsApp with a message ready to send. */
export function whatsappLink(message: string, to = whatsappNumber()): string {
  return `https://wa.me/${to.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
}

/** Turns a Kenyan or international phone number into WhatsApp's format, e.g. 0712 345678 → 254712345678. */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  let digits = String(phone || "").replace(/[^0-9]/g, "");
  if (!digits) return null;
  if (digits.startsWith("0") && digits.length === 10) digits = "254" + digits.slice(1);
  if (digits.length === 9 && /^[71]/.test(digits)) digits = "254" + digits;
  return digits.length >= 10 ? digits : null;
}

/** Hours before check-in (2 pm) up to which a paid booking can be cancelled for a full refund (NEXT_PUBLIC_FREE_CANCELLATION_HOURS, default 48). */
export function freeCancellationHours(): number {
  const n = Number(process.env.NEXT_PUBLIC_FREE_CANCELLATION_HOURS);
  return Number.isFinite(n) && n >= 0 ? n : 48;
}
