import { sql } from "drizzle-orm";
import type { getDb } from "./db";

type Db = ReturnType<typeof getDb>;

// ============================================================
// Versioned schema migrations.
//
// Each migration runs once, in order, and is recorded in the
// `schema_migrations` table. To change the schema:
//   1. update lib/db/schema.ts,
//   2. append a new entry to MIGRATIONS below (never edit one that has shipped),
//   3. deploy, or run `npm run db:migrate` against the database.
//
// Migrations run automatically on the first request after a deploy
// (via ensureDatabaseSeeded) under a Postgres advisory lock, so two
// serverless instances never apply the same migration twice.
// ============================================================

export type Migration = { id: string; description: string; up: (db: Db) => Promise<void> };

// 001: the schema as it stood before versioned migrations. Every statement is
// idempotent (IF NOT EXISTS), so it is safe on both new and existing databases.
async function baseline(db: Db): Promise<void> {
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
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      rank INTEGER NOT NULL DEFAULT 0,
      discount_percentage INTEGER NOT NULL DEFAULT 0
    );

    ALTER TABLE apartments ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;
    ALTER TABLE apartments ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

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
      image TEXT,
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

    ALTER TABLE events ADD COLUMN IF NOT EXISTS gate_pin TEXT DEFAULT '2026';
    ALTER TABLE events ADD COLUMN IF NOT EXISTS subaccount_code TEXT;

    CREATE TABLE IF NOT EXISTS event_tickets (
      id TEXT PRIMARY KEY,
      ticket_reference TEXT NOT NULL UNIQUE,
      event_id TEXT NOT NULL,
      event_title TEXT NOT NULL,
      brand TEXT NOT NULL,
      venue TEXT NOT NULL,
      event_date TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      ticket_count INTEGER NOT NULL DEFAULT 1,
      unit_price_kes INTEGER NOT NULL DEFAULT 0,
      unit_price_usd INTEGER DEFAULT 0,
      total_amount_kes INTEGER NOT NULL,
      total_amount_usd INTEGER DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'KES',
      discount_amount_kes INTEGER DEFAULT 0,
      voucher_code TEXT,
      payment_status TEXT NOT NULL DEFAULT 'paid',
      payment_method TEXT DEFAULT 'paystack',
      payment_reference TEXT NOT NULL,
      subaccount_code TEXT,
      check_in_status TEXT NOT NULL DEFAULT 'pending',
      checked_in_at TEXT,
      checked_in_by TEXT,
      dietary_requirements TEXT,
      special_requests TEXT,
      ticket_qr_token TEXT NOT NULL UNIQUE,
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

    -- Bring older live bookings tables up to the current schema
    -- (CREATE TABLE IF NOT EXISTS never adds columns to an existing table).
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS allocated_unit TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meal_plan_id TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meal_plan_name TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meal_plan_price_per_person_usd DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meal_plan_price_per_person_kes DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_rate_usd DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_rate_kes DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nights INTEGER DEFAULT 1;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_room_usd DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_meal_plan_usd DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_extras_usd DOUBLE PRECISION DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS inquiry_source TEXT DEFAULT 'village_apartment';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_notes JSONB;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_token TEXT;
    CREATE INDEX IF NOT EXISTS bookings_payment_reference_idx ON bookings (payment_reference);

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

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      booking_reference TEXT,
      guest_name TEXT NOT NULL,
      guest_phone TEXT,
      guest_email TEXT,
      pickup_location TEXT NOT NULL,
      dropoff_location TEXT NOT NULL,
      pickup_date_time TEXT NOT NULL,
      flight_or_train_number TEXT,
      vehicle_type TEXT NOT NULL DEFAULT 'Executive Private Sedan',
      passengers INTEGER DEFAULT 1,
      driver_name TEXT,
      driver_phone TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      cost_kes DOUBLE PRECISION DEFAULT 0,
      cost_usd DOUBLE PRECISION DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS booking_conditions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'cancellation',
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      badge TEXT,
      is_mandatory BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      discount_value DOUBLE PRECISION NOT NULL,
      min_spend_usd DOUBLE PRECISION DEFAULT 0,
      max_discount_usd DOUBLE PRECISION,
      valid_from TEXT,
      valid_until TEXT,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'all';
    ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS applicable_event_ids JSONB DEFAULT '[]'::jsonb;
  `);
}

export const MIGRATIONS: Migration[] = [
  { id: "001_baseline", description: "Tables as of October 2026", up: baseline },
  {
    id: "002_payments_and_guest_services",
    description: "Charge currency, refunds, cancellation requests, online check-in, follow-up flags",
    up: async (db) => {
      await db.execute(sql`
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS charge_currency TEXT;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS charge_amount DOUBLE PRECISION;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fx_rate DOUBLE PRECISION;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount_paid DOUBLE PRECISION;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at TEXT;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_status TEXT;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DOUBLE PRECISION;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_reference TEXT;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS change_request JSONB;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_details JSONB;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_requested_at TEXT;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS abandoned_notified_at TEXT;
        CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (booking_status);
        CREATE INDEX IF NOT EXISTS bookings_dates_idx ON bookings (apartment_id, check_in, check_out);
        CREATE INDEX IF NOT EXISTS bookings_payment_ref_idx ON bookings (payment_reference);
      `);
    },
  },
  {
    id: "003_rate_limits",
    description: "Shared request counters for rate limiting across serverless instances",
    up: async (db) => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          window_start TIMESTAMPTZ NOT NULL
        );
        CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits (window_start);
      `);
    },
  },
];

/** Applies every migration not yet recorded. Returns the ids it applied. */
export async function runMigrations(db: Db): Promise<string[]> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      description TEXT,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied: string[] = [];
  await db.transaction(async (tx) => {
    // One instance migrates at a time; the others wait, then see nothing left to do.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('tvl_schema_migrations'))`);
    const rows = (await tx.execute(sql`SELECT id FROM schema_migrations`)) as unknown as { id: string }[];
    const done = new Set(rows.map((r) => r.id));
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      await m.up(tx as unknown as Db);
      await tx.execute(sql`INSERT INTO schema_migrations (id, description) VALUES (${m.id}, ${m.description})`);
      applied.push(m.id);
    }
  });
  return applied;
}
