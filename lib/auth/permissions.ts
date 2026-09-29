import { StaffRole } from "@/types";

export function canAccessPricing(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "manager" || r === "reservations";
}

export function canAccessTeam(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "manager";
}

export function canAccessLogs(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "manager";
}

export function canManageEvents(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "manager" || r === "reservations";
}

export function canManagePackages(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "manager" || r === "reservations";
}
