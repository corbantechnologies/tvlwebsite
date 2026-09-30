import { NextRequest, NextResponse } from "next/server";
import { POST as handleInquiryPost } from "../inquiries/route";

// ============================================================
// /api/inquire -> compatibility alias forwarder for /api/inquiries
// ============================================================
export async function POST(req: NextRequest) {
  return handleInquiryPost(req);
}
