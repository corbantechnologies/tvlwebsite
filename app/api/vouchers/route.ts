import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import { vouchers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// ============================================================
// GET /api/vouchers
// 1. If ?code=XYZ & ?amount=120: Validates promo code and returns discount calculation
// 2. Otherwise: Returns list of vouchers for Admin management
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();
    const amountStr = searchParams.get("amount");
    const subtotalUsd = amountStr ? parseFloat(amountStr) : 0;

    // Validate a specific code for checkout
    if (code) {
      const [voucher] = await db
        .select()
        .from(vouchers)
        .where(eq(vouchers.code, code))
        .limit(1);

      if (!voucher || !voucher.isActive) {
        return NextResponse.json({
          valid: false,
          error: "Invalid or inactive promo code.",
        });
      }

      const today = new Date().toISOString().split("T")[0];

      if (voucher.validFrom && today < voucher.validFrom) {
        return NextResponse.json({
          valid: false,
          error: `This promo code is not active until ${voucher.validFrom}.`,
        });
      }

      if (voucher.validUntil && today > voucher.validUntil) {
        return NextResponse.json({
          valid: false,
          error: `This promo code expired on ${voucher.validUntil}.`,
        });
      }

      if (voucher.usageLimit !== null && voucher.usageLimit !== undefined) {
        if ((voucher.usedCount || 0) >= voucher.usageLimit) {
          return NextResponse.json({
            valid: false,
            error: "This promo code has reached its maximum redemption limit.",
          });
        }
      }

      if (voucher.minSpendUsd && subtotalUsd < voucher.minSpendUsd) {
        return NextResponse.json({
          valid: false,
          error: `Minimum stay total of $${voucher.minSpendUsd} USD required for this promo code.`,
        });
      }

      // Calculate discount amount in USD
      let discountAmountUsd = 0;
      if (voucher.discountType === "percentage") {
        discountAmountUsd = (subtotalUsd * voucher.discountValue) / 100;
        if (voucher.maxDiscountUsd && discountAmountUsd > voucher.maxDiscountUsd) {
          discountAmountUsd = voucher.maxDiscountUsd;
        }
      } else if (voucher.discountType === "fixed_usd") {
        discountAmountUsd = Math.min(voucher.discountValue, subtotalUsd);
      } else if (voucher.discountType === "fixed_kes") {
        const usdEquivalent = voucher.discountValue / 130;
        discountAmountUsd = Math.min(usdEquivalent, subtotalUsd);
      }

      discountAmountUsd = Math.round(discountAmountUsd * 100) / 100;

      return NextResponse.json({
        valid: true,
        voucher: {
          id: voucher.id,
          code: voucher.code,
          description: voucher.description,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          discountAmountUsd,
          discountAmountKes: Math.round(discountAmountUsd * 130),
        },
      });
    }

    // Admin List all vouchers
    const allVouchers = await db
      .select()
      .from(vouchers)
      .orderBy(desc(vouchers.createdAt));

    return NextResponse.json({ vouchers: allVouchers || [] });
  } catch (err: any) {
    console.error("GET /api/vouchers error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// POST /api/vouchers
// Creates a new promo code / voucher
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    if (!body.code || !body.discountValue) {
      return NextResponse.json(
        { error: "Voucher code and discount value are required" },
        { status: 400 }
      );
    }

    const cleanCode = body.code.trim().toUpperCase();

    // Check if code already exists
    const [existing] = await db
      .select()
      .from(vouchers)
      .where(eq(vouchers.code, cleanCode))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `Voucher code '${cleanCode}' already exists.` },
        { status: 409 }
      );
    }

    const newVoucher = {
      id: "vouch_" + Date.now(),
      code: cleanCode,
      description: body.description || "",
      discountType: body.discountType || "percentage",
      discountValue: Number(body.discountValue),
      minSpendUsd: body.minSpendUsd ? Number(body.minSpendUsd) : 0,
      maxDiscountUsd: body.maxDiscountUsd ? Number(body.maxDiscountUsd) : null,
      validFrom: body.validFrom || null,
      validUntil: body.validUntil || null,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
      usedCount: 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(vouchers).values(newVoucher as any);

    return NextResponse.json({ success: true, voucher: newVoucher });
  } catch (err: any) {
    console.error("POST /api/vouchers error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// PUT /api/vouchers
// Updates an existing voucher
// ============================================================
export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Voucher ID is required" }, { status: 400 });
    }

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }
    if (updates.discountValue !== undefined) {
      updates.discountValue = Number(updates.discountValue);
    }
    if (updates.minSpendUsd !== undefined) {
      updates.minSpendUsd = Number(updates.minSpendUsd);
    }
    if (updates.maxDiscountUsd !== undefined) {
      updates.maxDiscountUsd = updates.maxDiscountUsd ? Number(updates.maxDiscountUsd) : null;
    }
    if (updates.usageLimit !== undefined) {
      updates.usageLimit = updates.usageLimit ? Number(updates.usageLimit) : null;
    }

    updates.updatedAt = new Date().toISOString();

    await db
      .update(vouchers)
      .set(updates)
      .where(eq(vouchers.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT /api/vouchers error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/vouchers
// Deletes a voucher
// ============================================================
export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Voucher ID is required" }, { status: 400 });
    }

    await db.delete(vouchers).where(eq(vouchers.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/vouchers error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
