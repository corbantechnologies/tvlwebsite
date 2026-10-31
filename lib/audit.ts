import { getDb } from "@/lib/db/db";
import { auditLogs } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

export type AuditEntry = {
  actor: string;
  actorRole: string;
  category: string;
  action: string;
  details: string;
  targetId?: string | null;
  metadata?: unknown;
};

/**
 * Writes an audit log entry. Never throws: a failed audit write must not undo
 * or fail the business operation (e.g. a confirmed payment) that preceded it.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await getDb().insert(auditLogs).values({
      id: newId("log"),
      timestamp: new Date().toISOString(),
      actor: entry.actor,
      actorRole: entry.actorRole,
      category: entry.category,
      action: entry.action,
      details: entry.details,
      targetId: entry.targetId ?? null,
      metadata: (entry.metadata ?? null) as any,
    });
  } catch (err: any) {
    console.error("[Audit] Failed to write audit log:", err.message);
  }
}
