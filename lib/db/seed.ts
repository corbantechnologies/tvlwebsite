import bcrypt from "bcryptjs";
import { getClient, getDb } from "./db";
import { users, apartments, diningOptions, events, packages, pricingRules, apartmentInventory, availabilityBlocks } from "./schema";
import { APARTMENTS, DINING, DEFAULT_EVENTS, DEFAULT_RESORT_PACKAGES } from "@/lib/data";

let seedRunning = false;

export async function ensureDatabaseSeeded() {
  if (seedRunning) return;
  seedRunning = true;
  
  try {
    const client = getClient();
    const db = getDb();

    // 1. Run self-healing schema creation if tables don't exist
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
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
        used BOOLEAN NOT NULL DEFAULT false,
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
        gallery JSONB NOT NULL,
        amenities JSONB NOT NULL,
        bedrooms INTEGER NOT NULL,
        bathrooms DOUBLE PRECISION NOT NULL,
        highlights JSONB NOT NULL,
        bed_config TEXT NOT NULL,
        view_type TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS dining_options (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        highlights JSONB NOT NULL,
        hours TEXT NOT NULL,
        image TEXT NOT NULL,
        reservation_link_text TEXT NOT NULL,
        max_capacity INTEGER DEFAULT 100,
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        venue TEXT NOT NULL,
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
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        subtitle TEXT,
        category TEXT NOT NULL,
        rate_usd INTEGER NOT NULL,
        rate_kes INTEGER DEFAULT 0,
        pricing_type TEXT DEFAULT 'per_stay',
        minimum_nights INTEGER DEFAULT 1,
        applicable_suites JSONB DEFAULT '["all"]',
        meal_plan_included TEXT,
        included_activities JSONB DEFAULT '[]',
        features JSONB NOT NULL,
        terms TEXT,
        badge TEXT,
        image TEXT,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pricing_rules (
        id TEXT PRIMARY KEY,
        markup_multiplier DOUBLE PRECISION NOT NULL,
        tax_rate INTEGER NOT NULL,
        seasonal_factor TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
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
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        adults INTEGER NOT NULL DEFAULT 1,
        children INTEGER NOT NULL DEFAULT 0,
        package_id TEXT,
        package_name TEXT,
        total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        payment_method TEXT,
        booking_status TEXT NOT NULL DEFAULT 'confirmed',
        special_requests TEXT,
        staff_notes JSONB,
        created_at TEXT NOT NULL
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
        blocked_by TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS global_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);

    // Self-healing columns
    try {
      await client.unsafe(`ALTER TABLE apartments ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;`);
      await client.unsafe(`ALTER TABLE dining_options ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 100;`);
      await client.unsafe(`ALTER TABLE dining_options ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;`);
    } catch (e) {
      // Column exists
    }

    // 2. Check and seed Staff Users if empty
    const usersCountRes = await client.unsafe("SELECT COUNT(*) FROM users");
    const usersCount = parseInt(usersCountRes[0]?.count || "0", 10);
    if (usersCount === 0) {
      const defaultPasswordHash = bcrypt.hashSync("Tamarind2026!", 10);
      const initialUsers = [
        {
          id: "usr_admin_1",
          name: "Master Administrator",
          email: "admin@tamarind.co.ke",
          passwordHash: defaultPasswordHash,
          role: "admin",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "usr_mgr_1",
          name: "General Manager",
          email: "manager@tamarind.co.ke",
          passwordHash: defaultPasswordHash,
          role: "manager",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "usr_res_1",
          name: "Lead Reservations",
          email: "reservations@tamarind.co.ke",
          passwordHash: defaultPasswordHash,
          role: "reservations",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "usr_rec_1",
          name: "Front Desk Reception",
          email: "reception@tamarind.co.ke",
          passwordHash: defaultPasswordHash,
          role: "reception",
          active: true,
          createdAt: new Date().toISOString()
        }
      ];
      await db.insert(users).values(initialUsers);
      console.log("🌱 [Seed] Seeded default 4 staff accounts.");
    }

    // 3. Check and seed Apartments if empty
    const aptCountRes = await client.unsafe("SELECT COUNT(*) FROM apartments");
    const aptCount = parseInt(aptCountRes[0]?.count || "0", 10);
    if (aptCount === 0) {
      await db.insert(apartments).values(APARTMENTS as any);
      console.log("🌱 [Seed] Seeded baseline apartments catalog.");
    }

    // 4. Check and seed Dining if empty
    const dinCountRes = await client.unsafe("SELECT COUNT(*) FROM dining_options");
    const dinCount = parseInt(dinCountRes[0]?.count || "0", 10);
    if (dinCount === 0) {
      await db.insert(diningOptions).values(DINING as any);
      console.log("🌱 [Seed] Seeded baseline dining venues.");
    }

    // 5. Check and seed Events if empty
    const evtCountRes = await client.unsafe("SELECT COUNT(*) FROM events");
    const evtCount = parseInt(evtCountRes[0]?.count || "0", 10);
    if (evtCount === 0) {
      const formattedEvents = DEFAULT_EVENTS.map(e => ({
        ...e,
        createdAt: (e as any).createdAt || new Date().toISOString()
      }));
      await db.insert(events).values(formattedEvents as any);
      console.log("🌱 [Seed] Seeded baseline incoming events.");
    }

    // 6. Check and seed Packages if empty
    const pkgCountRes = await client.unsafe("SELECT COUNT(*) FROM packages");
    const pkgCount = parseInt(pkgCountRes[0]?.count || "0", 10);
    if (pkgCount === 0) {
      const formattedPackages = DEFAULT_RESORT_PACKAGES.map(p => ({
        ...p,
        createdAt: (p as any).createdAt || new Date().toISOString()
      }));
      await db.insert(packages).values(formattedPackages as any);
      console.log("🌱 [Seed] Seeded baseline multi-tier packages.");
    }

    // 7. Check and seed Pricing Rules
    const priceCountRes = await client.unsafe("SELECT COUNT(*) FROM pricing_rules");
    const priceCount = parseInt(priceCountRes[0]?.count || "0", 10);
    if (priceCount === 0) {
      await db.insert(pricingRules).values({
        id: "default",
        markupMultiplier: 1.0,
        taxRate: 8,
        seasonalFactor: "regular"
      });
      console.log("🌱 [Seed] Seeded baseline pricing rules.");
    }

    
    // 8. Check and seed Apartment Inventory
    const invCountRes = await client.unsafe("SELECT COUNT(*) FROM apartment_inventory");
    const invCount = parseInt(invCountRes[0]?.count || "0", 10);
    if (invCount === 0) {
      const now = new Date().toISOString();
      const defaultInventory = [
        { id: "1-bedroom", totalUnits: 1, notes: "Default — update to reflect actual unit count", updatedAt: now },
        { id: "2-bedroom", totalUnits: 1, notes: "Default — update to reflect actual unit count", updatedAt: now },
        { id: "3-bedroom", totalUnits: 1, notes: "Default — update to reflect actual unit count", updatedAt: now },
      ];
      await db.insert(apartmentInventory).values(defaultInventory).onConflictDoNothing();
      console.log("🌱 [Seed] Seeded baseline apartment inventory.");
    }

    console.log("✅ [Seed] Database tables and hydration verified.");
  } catch (err) {
    console.error("⚠️ [Seed] Database hydration error (fallback active):", err);
  } finally {
    seedRunning = false;
  }
}
