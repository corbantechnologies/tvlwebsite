import { StaffUser } from "@/types";

export const DEFAULT_STAFF_USERS: StaffUser[] = [
  { id: "usr_admin_1", name: "Master Administrator", email: "admin@tamarind.co.ke", role: "admin", active: true },
  { id: "usr_mgr_1", name: "General Manager", email: "manager@tamarind.co.ke", role: "manager", active: true },
  { id: "usr_res_1", name: "Lead Reservations", email: "reservations@tamarind.co.ke", role: "reservations", active: true },
  { id: "usr_rec_1", name: "Front Desk Reception", email: "reception@tamarind.co.ke", role: "reception", active: true }
];
