import { escapeHtml } from "@/lib/escapeHtml";
import { sendEmail, siteUrl } from "@/lib/mailer";
import { writeAuditLog } from "@/lib/audit";

// ============================================================
// Operational alerts: something broke that a person must look at
// (a payment that could not be recorded, a failed reconciliation).
//
// Goes to OPS_ALERT_EMAIL (falls back to the Village reservations
// inbox) and to the audit log. Repeats of the same alert are
// suppressed for 30 minutes per server instance so an outage does
// not flood the inbox.
// ============================================================

const recent = new Map<string, number>();
const QUIET_MS = 30 * 60 * 1000;

export function opsInbox(): string {
  return process.env.OPS_ALERT_EMAIL || process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
}

export async function opsAlert(title: string, details: string, opts: { key?: string; context?: Record<string, unknown> } = {}): Promise<void> {
  const key = opts.key || title;
  const now = Date.now();
  const last = recent.get(key);
  console.error(`[OPS ALERT] ${title}: ${details}`);
  await writeAuditLog({
    actor: "System Monitor",
    actorRole: "system",
    category: "ops_alert",
    action: title,
    details,
    metadata: opts.context ?? null,
  });
  if (last && now - last < QUIET_MS) return;
  recent.set(key, now);

  const rows = Object.entries(opts.context || {})
    .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#666">${escapeHtml(k)}</td><td style="padding:4px 8px">${escapeHtml(typeof v === "string" ? v : JSON.stringify(v))}</td></tr>`)
    .join("");
  await sendEmail({
    to: opsInbox(),
    subject: `[Website alert] ${title}`,
    html: `<div style="font-family:sans-serif;max-width:600px;padding:20px;border:1px solid #fca5a5;background:#fef2f2">
      <h2 style="color:#991b1b;margin-top:0">${escapeHtml(title)}</h2>
      <p style="font-size:14px;line-height:1.6">${escapeHtml(details)}</p>
      ${rows ? `<table style="font-size:12px;border-collapse:collapse">${rows}</table>` : ""}
      <p style="font-size:12px;margin-top:16px"><a href="${escapeHtml(siteUrl())}/admin/logs">Open audit logs</a></p>
    </div>`,
  });
}
