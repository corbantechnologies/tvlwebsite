import { getDb } from "./db";
import { sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import {
  users,
  mealPlans,
  pricingRules,
} from "./schema";

// Seeding guard — only run once per process lifecycle
let seeded = false;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;

  try {
    const db = getDb();
    await createTables(db);
    await seedRequiredDefaults(db);
  } catch (err: any) {
    // Reset so it can be retried on next request
    seeded = false;
    console.error("[Seed] Failed:", err.message);
    throw err;
  }
}

// ============================================================
// TABLE CREATION
// All tables are created here. New tables must be added here.
// ============================================================

async function createTables(db: ReturnType<typeof getDb>): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS apartments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      size TEXT NOT NULL,
      max_guests INTEGER NOT NULL,
      price_per_night INTEGER NOT NULL,
      image TEXT NOT NULL,
      gallery JSONB NOT NULL DEFAULT '[]',
      amenities JSONB NOT NULL DEFAULT '[]',
      bedrooms INTEGER NOT NULL,
      bathrooms DOUBLE PRECISION NOT NULL,
      highlights JSONB NOT NULL DEFAULT '[]',
      bed_config TEXT NOT NULL,
      view_type TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS dining_options (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      highlights JSONB NOT NULL DEFAULT '[]',
      hours TEXT NOT NULL,
      image TEXT NOT NULL,
      reservation_link_text TEXT NOT NULL,
      max_capacity INTEGER DEFAULT 100,
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      description TEXT NOT NULL,
      price_per_person_per_day_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
      price_per_person_per_day_kes DOUBLE PRECISION NOT NULL DEFAULT 0,
      highlights JSONB NOT NULL DEFAULT '[]',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS extras (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
      price_kes DOUBLE PRECISION NOT NULL DEFAULT 0,
      pricing_unit TEXT NOT NULL DEFAULT 'per_booking',
      image TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS booking_extras (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      extra_id TEXT NOT NULL,
      extra_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
      unit_price_kes DOUBLE PRECISION NOT NULL DEFAULT 0,
      total_price_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
      total_price_kes DOUBLE PRECISION NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      brand TEXT NOT NULL,
      venue TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT 'Mombasa',
      category TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      time_text TEXT NOT NULL,
      price_usd INTEGER DEFAULT 0,
      price_kes INTEGER DEFAULT 0,
      image TEXT NOT NULL,
      gallery JSONB DEFAULT '[]',
      max_capacity INTEGER DEFAULT 100,
      booked_count INTEGER DEFAULT 0,
      highlights JSONB DEFAULT '[]',
      dress_code TEXT DEFAULT 'Smart Casual',
      booking_link TEXT,
      external_ticket_url TEXT,
      payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      is_featured BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      venue TEXT NOT NULL DEFAULT 'village_apartment',
      guest_token TEXT UNIQUE,
      payload JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_reference TEXT NOT NULL UNIQUE,
      inquiry_id TEXT,
      apartment_id TEXT NOT NULL,
      apartment_name TEXT NOT NULL,
      allocated_unit TEXT,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      adults INTEGER NOT NULL DEFAULT 1,
      children INTEGER NOT NULL DEFAULT 0,
      meal_plan_id TEXT,
      meal_plan_name TEXT,
      meal_plan_price_per_person_usd DOUBLE PRECISION DEFAULT 0,
      meal_plan_price_per_person_kes DOUBLE PRECISION DEFAULT 0,
      room_rate_usd DOUBLE PRECISION DEFAULT 0,
      room_rate_kes DOUBLE PRECISION DEFAULT 0,
      nights INTEGER DEFAULT 1,
      total_room_usd DOUBLE PRECISION DEFAULT 0,
      total_meal_plan_usd DOUBLE PRECISION DEFAULT 0,
      total_extras_usd DOUBLE PRECISION DEFAULT 0,
      total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      payment_method TEXT,
      payment_reference TEXT,
      booking_status TEXT NOT NULL DEFAULT 'inquiry',
      inquiry_source TEXT DEFAULT 'village_apartment',
      special_requests TEXT,
      staff_notes JSONB,
      guest_token TEXT UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS apartment_inventory (
      id TEXT PRIMARY KEY,
      total_units INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS availability_blocks (
      id TEXT PRIMARY KEY,
      apartment_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT,
      block_type TEXT NOT NULL DEFAULT 'hard_block',
      source TEXT DEFAULT 'direct',
      blocked_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_overrides (
      id TEXT PRIMARY KEY,
      apartment_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      rate_usd DOUBLE PRECISION,
      rate_kes DOUBLE PRECISION,
      min_nights INTEGER DEFAULT 1,
      label TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pricing_rules (
      id TEXT PRIMARY KEY,
      markup_multiplier DOUBLE PRECISION NOT NULL,
      tax_rate INTEGER NOT NULL,
      seasonal_factor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actor TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      category TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      target_id TEXT,
      metadata JSONB
    );

    CREATE TABLE IF NOT EXISTS global_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    );
  `);
}

// ============================================================
// REQUIRED DEFAULTS
// Seed only what the system cannot function without:
//   1. One master admin user
//   2. Pricing rules baseline
//   3. The three meal plans
// All other data (apartments, dining, events, extras) is entered
// by the admin through the management portal.
// ============================================================

async function seedRequiredDefaults(db: ReturnType<typeof getDb>): Promise<void> {
  await seedAdminUser(db);
  await seedPricingRules(db);
  await seedMealPlans(db);
}

// ---------------------------------------------------------------
// 1. Master admin user
// Password: reads from ADMIN_SEED_PASSWORD env var.
// If the env var is not set, a generated hash is used and the
// admin MUST reset the password before use.
// ---------------------------------------------------------------
async function seedAdminUser(db: ReturnType<typeof getDb>): Promise<void> {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) return; // users already seeded

  const rawPassword = process.env.ADMIN_SEED_PASSWORD || "TamarindVillage@2026!";
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  await db.insert(users).values({
    id: "user_admin_001",
    name: "Tamarind Village Admin",
    email: process.env.ADMIN_SEED_EMAIL || "admin@tamarindvillage.co.ke",
    passwordHash,
    role: "admin",
    active: true,
    createdAt: new Date().toISOString(),
  }).onConflictDoNothing();

  console.log("[Seed] Admin user created. Change the password immediately after first login.");
}

// ---------------------------------------------------------------
// 2. Pricing rules baseline
// The system needs exactly one pricing_rules row to avoid crashes.
// ---------------------------------------------------------------
async function seedPricingRules(db: ReturnType<typeof getDb>): Promise<void> {
  const existing = await db.select().from(pricingRules).limit(1);
  if (existing.length > 0) return;

  await db.insert(pricingRules).values({
    id: "default",
    markupMultiplier: 1.0,
    taxRate: 16,
    seasonalFactor: "regular",
  }).onConflictDoNothing();
}

// ---------------------------------------------------------------
// 3. Three meal plan tiers
// Room Only, Bed & Breakfast, Stay & Dine Half Board
// Rates are set to the values agreed with management.
// Admin can update these through /admin/packages.
// ---------------------------------------------------------------
async function seedMealPlans(db: ReturnType<typeof getDb>): Promise<void> {
  const existing = await db.select().from(mealPlans).limit(1);
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  await db.insert(mealPlans).values([
    {
      id: "room-only",
      name: "Flexible Rate — Room Only",
      shortName: "RO",
      description: "Accommodation only. Enjoy Tamarind Village at your own pace — dine at our Harbour Restaurant, Tamarind Mombasa Restaurant, Dawa Terrace, or order in.",
      pricePerPersonPerDayUsd: 0,
      pricePerPersonPerDayKes: 0,
      highlights: ["No meal commitment", "Flexible dining options", "Complimentary welcome drink"],
      isActive: true,
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: "bed-breakfast",
      name: "Bed & Breakfast",
      shortName: "BB",
      description: "Start every morning with our celebrated clifftop harbour breakfast overlooking the Indian Ocean. Freshly prepared continental and hot selections daily.",
      pricePerPersonPerDayUsd: 21,
      pricePerPersonPerDayKes: 2730,
      highlights: ["Daily clifftop harbour breakfast", "Ocean views at breakfast", "À la carte hot options"],
      isActive: true,
      sortOrder: 2,
      createdAt: now,
    },
    {
      id: "half-board",
      name: "Stay & Dine — Half Board Deal with Seafood",
      shortName: "HB",
      description: "The ultimate Tamarind experience. Breakfast each morning, plus a nightly dinner at Tamarind Mombasa's legendary seafood restaurant — one of East Africa's finest.",
      pricePerPersonPerDayUsd: 41,
      pricePerPersonPerDayKes: 5330,
      highlights: [
        "Daily clifftop harbour breakfast",
        "Nightly dinner at Tamarind Mombasa Restaurant",
        "Tamarind's legendary East African seafood",
        "Most popular choice",
      ],
      isActive: true,
      sortOrder: 3,
      createdAt: now,
    },
  ]).onConflictDoNothing();
}
