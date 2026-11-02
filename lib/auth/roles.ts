// ============================================================
// Staff roles and what each may do. Enforced on the server in
// proxy.ts (not only by hiding menu items), and used by the admin
// sidebar so the two never disagree.
//
//   admin / gm        everything, including staff accounts and audit logs
//   manager           content, pricing, reports, refunds
//   reservations      bookings, inquiries, availability, rates, promos
//   reception         front desk, bookings, transfers, event check-in
//   security/scanner  event gate check-in only
// ============================================================

export const OWNERS = ["admin", "gm"];
export const MANAGEMENT = [...OWNERS, "manager"];
export const RESERVATIONS = [...MANAGEMENT, "reservations", "reservationist"];
export const FRONT_OFFICE = [...RESERVATIONS, "reception", "frontdesk"];
export const GATE = [...FRONT_OFFICE, "security", "scanner"];

const WRITE = ["POST", "PUT", "PATCH", "DELETE"];
const ANY = ["GET", "POST", "PUT", "PATCH", "DELETE"];

type Rule = { methods: string[]; pattern: RegExp; roles: string[] };

// First match wins. Routes not listed are open to FRONT_OFFICE.
const API_RULES: Rule[] = [
  { methods: ANY, pattern: /^\/api\/(team|audit-logs)(\/.*)?$/, roles: OWNERS },
  { methods: ANY, pattern: /^\/api\/reports(\/.*)?$/, roles: MANAGEMENT },
  { methods: WRITE, pattern: /^\/api\/bookings\/[^/]+\/refund$/, roles: MANAGEMENT },
  { methods: ANY, pattern: /^\/api\/events\/tickets\/[^/]+\/checkin$/, roles: GATE },
  { methods: ["GET"], pattern: /^\/api\/events\/tickets(\/.*)?$/, roles: GATE },
  {
    methods: WRITE,
    pattern: /^\/api\/(settings|apartments|dining|events|booking-conditions|pricing|inventory|media)(\/.*)?$/,
    roles: MANAGEMENT,
  },
  {
    methods: WRITE,
    pattern: /^\/api\/(availability|extras|meal-plans|packages|vouchers)(\/.*)?$/,
    roles: RESERVATIONS,
  },
];

// Admin pages, by path prefix (longest first). Pages not listed are open to FRONT_OFFICE.
const PAGE_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin/events/checkin", roles: GATE },
  { prefix: "/admin/events/ledger", roles: FRONT_OFFICE },
  { prefix: "/admin/team", roles: OWNERS },
  { prefix: "/admin/logs", roles: OWNERS },
  { prefix: "/admin/reports", roles: MANAGEMENT },
  { prefix: "/admin/pricing", roles: MANAGEMENT },
  { prefix: "/admin/apartments", roles: MANAGEMENT },
  { prefix: "/admin/dining", roles: MANAGEMENT },
  { prefix: "/admin/events", roles: MANAGEMENT },
  { prefix: "/admin/facilities", roles: MANAGEMENT },
  { prefix: "/admin/policies", roles: MANAGEMENT },
  { prefix: "/admin/hero", roles: MANAGEMENT },
  { prefix: "/admin/availability", roles: RESERVATIONS },
  { prefix: "/admin/packages", roles: RESERVATIONS },
  { prefix: "/admin/extras", roles: RESERVATIONS },
  { prefix: "/admin/vouchers", roles: RESERVATIONS },
];

function norm(role: string | null | undefined): string {
  return (role || "").toLowerCase().trim();
}

export function canCallApi(role: string | null | undefined, method: string, pathname: string): boolean {
  const r = norm(role);
  const m = method.toUpperCase();
  const path = pathname.replace(/\/$/, "");
  const rule = API_RULES.find((x) => x.methods.includes(m) && x.pattern.test(path));
  return (rule ? rule.roles : FRONT_OFFICE).includes(r);
}

export function canViewPage(role: string | null | undefined, pathname: string): boolean {
  const r = norm(role);
  if (pathname === "/admin/guide" || pathname.startsWith("/admin/guide/")) return true; // every signed-in staff member
  const rule = PAGE_RULES.find((x) => pathname === x.prefix || pathname.startsWith(x.prefix + "/"));
  return (rule ? rule.roles : FRONT_OFFICE).includes(r);
}

/** Where to send a signed-in staff member who opens a page their role cannot see. */
export function homePageFor(role: string | null | undefined): string {
  const r = norm(role);
  if (FRONT_OFFICE.includes(r)) return "/admin/frontdesk";
  if (GATE.includes(r)) return "/admin/events/checkin";
  return "/admin/guide";
}
