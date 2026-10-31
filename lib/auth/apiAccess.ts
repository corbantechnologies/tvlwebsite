// ============================================================
// Which /api routes the public website may call without a staff session.
// Everything else under /api requires a signed-in staff member (enforced
// in proxy.ts). Add new public endpoints here deliberately.
// ============================================================

type Rule = { methods: string[]; pattern: RegExp };

const PUBLIC_API_RULES: Rule[] = [
  // Auth
  { methods: ["POST"], pattern: /^\/api\/auth\/(login|logout)$/ },
  { methods: ["GET"], pattern: /^\/api\/auth\/session$/ },

  // Public website content (read-only)
  { methods: ["GET"], pattern: /^\/api\/apartments(\/[^/]+)?$/ },
  { methods: ["GET"], pattern: /^\/api\/availability$/ },
  { methods: ["GET"], pattern: /^\/api\/booking-conditions$/ },
  { methods: ["GET"], pattern: /^\/api\/dining$/ },
  { methods: ["GET"], pattern: /^\/api\/events$/ },
  { methods: ["GET"], pattern: /^\/api\/extras$/ },
  { methods: ["GET"], pattern: /^\/api\/meal-plans$/ },
  { methods: ["GET"], pattern: /^\/api\/packages$/ },
  { methods: ["GET"], pattern: /^\/api\/pricing$/ },
  { methods: ["GET"], pattern: /^\/api\/settings$/ },
  { methods: ["GET", "OPTIONS"], pattern: /^\/api\/profitroom(\/(rooms|offers))?$/ },

  // Guest actions
  { methods: ["POST"], pattern: /^\/api\/(inquire|inquiries)$/ },
  { methods: ["POST"], pattern: /^\/api\/bookings\/checkout$/ },
  { methods: ["POST"], pattern: /^\/api\/events\/checkout$/ },
  { methods: ["POST"], pattern: /^\/api\/guest\/pay$/ },
  { methods: ["GET", "PATCH", "DELETE"], pattern: /^\/api\/guest\/inquiry\/[^/]+$/ }, // authorised by guest token
  { methods: ["GET"], pattern: /^\/api\/track$/ },

  // Payments
  { methods: ["POST"], pattern: /^\/api\/paystack\/webhook$/ }, // authorised by HMAC signature
  { methods: ["GET"], pattern: /^\/api\/paystack\/verify\/[^/]+$/ },
];

export function isPublicApiRequest(method: string, pathname: string, searchParams: URLSearchParams): boolean {
  const path = pathname.replace(/\/$/, "");
  const m = method.toUpperCase();

  // Promo-code validation is public; listing all vouchers is staff-only.
  if (path === "/api/vouchers" && m === "GET" && searchParams.has("code")) return true;

  return PUBLIC_API_RULES.some((r) => r.methods.includes(m) && r.pattern.test(path));
}
