import { getDb } from "./db";
import { sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import {
  users,
  pricingRules,
  apartments,
  apartmentInventory,
  diningOptions,
  globalSettings,
  mealPlans,
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
  `);
}

// ============================================================
// REQUIRED DEFAULTS
// Seeded datasets requested:
//   1. Single master admin user
//   2. Base pricing rules
//   3. Hero images and slides (into global_settings)
//   4. Apartments (1BR, 2BR, 3BR) + inventory
//   5. Dining & Dhow (Restaurant, Dawa Terrace, Dhow - NO casino)
//   6. Facilities (Pools & Conferences into global_settings)
//
// NOTE: Packages/meal plans & extras are NOT seeded here.
// They will be set up later by staff/testing as requested.
// ============================================================

async function seedRequiredDefaults(db: ReturnType<typeof getDb>): Promise<void> {
  await seedAdminUser(db);
  await seedPricingRules(db);
  await seedHeroSettings(db);
  await seedApartments(db);
  await seedDining(db);
  await seedFacilities(db);
  await seedMealPlans(db);
}

// ---------------------------------------------------------------
// 1. Master admin user
// ---------------------------------------------------------------
async function seedAdminUser(db: ReturnType<typeof getDb>): Promise<void> {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) return;

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

  console.log("[Seed] Admin user created:", process.env.ADMIN_SEED_EMAIL || "admin@tamarindvillage.co.ke");
}

// ---------------------------------------------------------------
// 2. Pricing rules baseline
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
// 3. Hero images & slides
// ---------------------------------------------------------------
async function seedHeroSettings(db: ReturnType<typeof getDb>): Promise<void> {
  const heroImages = [
    "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg",
    "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg",
    "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg",
  ];

  const heroData = {
    headline: "Clifftop Luxury Suites Overlooking Tudor Creek",
    subtext: "Mombasa's iconic private haven blending Swahili Moorish architecture, world-renowned seafood gastronomy, and personalized Indian Ocean hospitality.",
    heroImageUrl: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg",
    slides: heroImages,
  };

  await db.insert(globalSettings).values({
    key: "hero",
    value: heroData,
  }).onConflictDoNothing();

  await db.insert(globalSettings).values({
    key: "hero_images",
    value: heroImages,
  }).onConflictDoNothing();

  console.log("[Seed] Hero settings & slides configured.");
}

// ---------------------------------------------------------------
// 4. Apartments & Inventory (1BR, 2BR, 3BR)
// ---------------------------------------------------------------
async function seedApartments(db: ReturnType<typeof getDb>): Promise<void> {
  const existing = await db.select().from(apartments).limit(1);
  if (existing.length > 0) return;

  const aptList = [
    {
      id: "1-bedroom Apartment",
      name: "1-Bedroom Apartment",
      description: "An intimate, beautifully curated coastal sanctuary perched on the coral cliffs. Features a spacious private sea-facing balcony, an authentic Swahili lounge, an open-concept kitchen, and direct breeze from Tudor Creek.",
      size: "85 m²",
      maxGuests: 2,
      pricePerNight: 213,
      image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg",
      gallery: [
        "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg",
        "https://media.tamarind.co.ke/tvl-website-assets/r12.jpg",
        "https://media.tamarind.co.ke/tvl-website-assets/r15.jpg",
      ],
      amenities: [
        "High-speed Wi-Fi",
        "Whisper-quiet air conditioning",
        "Fully equipped kitchenette & granite countertop",
        "Private veranda overlooking the creek",
        "Satellite TV with DSTV & smart channels",
        "In-room safe box & tea/coffee station",
        "Direct phone line & intercom",
        "Daily housekeeping & evening turndown service",
      ],
      bedrooms: 1,
      bathrooms: 1,
      highlights: [
        "Direct breathtaking sunrise views over Mombasa Old Port & Creek",
        "Private furnished balcony ideal for romantic sundowners",
        "Open plan layout with authentic Lamu-carved furniture",
      ],
      bedConfig: "1 King-size Bed",
      viewType: "Ocean & Tudor Creek View",
      isActive: true,
    },
    {
      id: "2-bedroom Apartment",
      name: "2-Bedroom Apartment",
      description: "Expansive multi-room residence designed for families or friends traveling together. Offering a master en-suite, separate guest twin room, spacious living/dining hall, and a private creek-view balcony.",
      size: "140 m²",
      maxGuests: 4,
      pricePerNight: 328,
      image: "https://media.tamarind.co.ke/tvl-website-assets/r21.jpg",
      gallery: [
        "https://media.tamarind.co.ke/tvl-website-assets/r21.jpg",
        "https://media.tamarind.co.ke/tvl-website-assets/r22.jpg",
        "https://media.tamarind.co.ke/tvl-website-assets/r24.jpg",
      ],
      amenities: [
        "High-speed Wi-Fi",
        "Individual climate control in both bedrooms & lounge",
        "Full granite chef kitchen with oven, microwave & fridge",
        "Two spacious private verandas with ocean garden views",
        "Flat screen TVs in master bedroom and lounge",
        "Electronic room safe & iron facilities",
        "En-suite master bath + full guest bathroom",
        "Laundry & dry cleaning service upon request",
      ],
      bedrooms: 2,
      bathrooms: 2,
      highlights: [
        "Perfect for families; child-friendly, secure layout",
        "Direct views overlooking the sparkling resort pools and the creek",
        "Gourmet kitchen complete with full-sized refrigerator, oven, and washer",
        "Master en-suite bathroom with custom glass shower and Swahili vanity",
      ],
      bedConfig: "1 King Bed & 2 Twin Beds (can be merged)",
      viewType: "Resort Pool & Harbor View",
      isActive: true,
    },
    {
      id: "3-bedroom Apartment",
      name: "3-Bedroom Apartment",
      description: "The ultimate expression of coastal luxury. This palatial apartment boasts double-height vaulted ceilings, three gorgeous bedrooms, multiple sun-drenched private balconies, and an elite dining lounge.",
      size: "220 m²",
      maxGuests: 6,
      pricePerNight: 425,
      image: "https://media.tamarind.co.ke/tvl-website-assets/r36.jpg",
      gallery: [
        "https://media.tamarind.co.ke/tvl-website-assets/r36.jpg",
        "https://media.tamarind.co.ke/tvl-website-assets/r32.jpg",
        "https://media.tamarind.co.ke/tvl-website-assets/r35.jpg",
      ],
      amenities: [
        "High-speed Wi-Fi",
        "Full house air-conditioning with individual zones",
        "Ultra-modern kitchen with premium culinary wear",
        "Rooftop sun terrace & private dining area",
        "Smart TVs with premium DSTV & streaming capabilities",
        "In-suite laundry (washing machine & dryer)",
        "Dedicated concierge service",
        "Luxury bathtubs & rainfall showers",
        "Dedicated chauffeur & concierge assistance",
      ],
      bedrooms: 3,
      bathrooms: 3.5,
      highlights: [
        "Spectacular 270-degree panoramic views of Mombasa Old Town and Tudor Creek",
        "Bespoke multilevel architecture featuring rich mahogany spiral stairs",
        "Exclusive private rooftop terrace with loungers and outdoor dining table",
        "Dedicated chef available upon request for private dining events",
      ],
      bedConfig: "2 King Beds & 2 Twin Beds",
      viewType: "360° Creek, Ocean & Old Town Panoramic View",
      isActive: true,
    },
  ];

  for (const apt of aptList) {
    await db.insert(apartments).values(apt as any).onConflictDoNothing();
  }

  // Apartment baseline inventory
  const inventoryData = [
    { id: "1-bedroom", totalUnits: 10, notes: "Standard 1BR inventory", updatedAt: new Date().toISOString() },
    { id: "2-bedroom", totalUnits: 8, notes: "Standard 2BR inventory", updatedAt: new Date().toISOString() },
    { id: "3-bedroom", totalUnits: 4, notes: "Standard 3BR penthouse inventory", updatedAt: new Date().toISOString() },
  ];

  for (const inv of inventoryData) {
    await db.insert(apartmentInventory).values(inv).onConflictDoNothing();
  }

  console.log("[Seed] Apartments & Inventory seeded (1BR: 10, 2BR: 8, 3BR: 4).");
}

// ---------------------------------------------------------------
// 5. Dining & Dhow (Tamarind Restaurant, Dawa Terrace, Dhow Cruise)
// Casino is excluded per instruction.
// ---------------------------------------------------------------
async function seedDining(db: ReturnType<typeof getDb>): Promise<void> {
  const existing = await db.select().from(diningOptions).limit(1);
  if (existing.length > 0) return;

  const diningList = [
    {
      id: "tamarind-restaurant",
      name: "Tamarind Mombasa Restaurant",
      description: "World-renowned seafood temple perched on a cliff overlooking the picturesque Old Harbour of Mombasa. Offering an enchanting blend of French, Asian, and coastal African culinary traditions featuring the freshest local catch.",
      highlights: [
        "East Africa's premier fine-dining seafood destination since 1977",
        "Live mangrove crab, grilled giant prawns & Tamarind Lobster Thermidor",
        "Extensive international wine cellar with sommelier pairings",
        "Cliffside dining deck under ancient baobabs overlooking Tudor Creek",
      ],
      hours: "Lunch: 12:00 PM – 3:00 PM | Dinner: 6:30 PM – 10:30 PM",
      image: "https://media.tamarind.co.ke/tvl-website-assets/mr6.jpg",
      reservationLinkText: "Reserve Restaurant Table",
      maxCapacity: 120,
      isActive: true,
    },
    {
      id: "dawa-terrace",
      name: "Dawa Terrace Bar",
      description: "The beating social heart of Mombasa sunsets. Savor the legendary original 'Dawa' cocktail—invented right here at Tamarind—while relaxing on our dramatic creekside terrace as traditional wooden dhows glide across the water.",
      highlights: [
        "The birthplace of Kenya's iconic 'Dawa' cocktail (Vodka, lime, honey stick)",
        "Unrivaled panoramic golden-hour sunsets over Mombasa Old Port",
        "Tapas & coastal Swahili bitings menu served until late",
        "Chilled lounge beats and live coastal acoustic sessions on weekends",
      ],
      hours: "1:00 PM – Midnight Daily",
      image: "https://media.tamarind.co.ke/tvl-website-assets/t1.jpg",
      reservationLinkText: "Inquire for Dawa Terrace Table",
      maxCapacity: 80,
      isActive: true,
    },
    {
      id: "tamarind-dhow",
      name: "The Tamarind Dhow Cruise",
      description: "An unforgettable, magical dining voyage. Climb aboard the 'Nawalikoni' or 'Babulkher'—two majestic, traditionally hand-crafted wooden Swahili sailing dhows, beautifully converted into luxurious floating restaurants. Under the sails, you will cruise past Mombasa's historical Fort Jesus and Mombasa Old Harbor while enjoying a freshly grilled multi-course seafood meal prepared on traditional charcoal grills.",
      highlights: [
        "4-Course candlelit seafood feast cooked fresh on board over charcoal braziers",
        "Romantic cruise on Tudor Creek, Mombasa Harbor, and around Fort Jesus",
        "Live Swahili, Afro-fusion, and jazz band playing dance-worthy tunes on board",
        "The perfect setting for anniversaries, proposals, or unforgettable group celebrations",
      ],
      hours: "Lunch Cruise: 1:00 PM – 3:00 PM | Dinner Cruise: 6:30 PM – 10:30 PM",
      image: "https://media.tamarind.co.ke/tvl-website-assets/d2.jpg",
      reservationLinkText: "Inquire for Dhow Charter & Cruise",
      maxCapacity: 70,
      isActive: true,
    },
  ];

  for (const d of diningList) {
    await db.insert(diningOptions).values(d as any).onConflictDoNothing();
  }

  console.log("[Seed] Dining & Dhow seeded (Restaurant, Dawa Terrace, Dhow).");
}

// ---------------------------------------------------------------
// 6. Facilities (Pools & Conferences into global_settings)
// ---------------------------------------------------------------
async function seedFacilities(db: ReturnType<typeof getDb>): Promise<void> {
  const facilitiesData = [
    {
      id: "pools",
      name: "Resident Swimming Pools (Staying Guests Only)",
      description: "Exclusive to staying residents of Tamarind Village. Our harbor-front swimming pools offer a tranquil coastal sanctuary overlooking Tudor Creek, surrounded by coconut palms, tropical greenery, and comfortable loungers.",
      iconName: "Waves",
      image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg",
      details: [
        "Strictly reserved for staying Tamarind Village residents & registered apartment guests",
        "Stunning oceanfront infinity-edge pool looking out towards Tudor Creek",
        "Separate shallow swimming area safely designed for children and families",
        "Complimentary sun loungers, beach towels, and poolside service for in-house residents",
      ],
    },
    {
      id: "conferences",
      name: "Executive Conferences & Banquets",
      description: "Tamarind Village offers an air-conditioned conference venue tailored for executive retreats, boardroom meetings, team building, and social celebrations. Supported by state-of-the-art tech and world-class food.",
      iconName: "Users",
      image: "https://media.tamarind.co.ke/tvl-website-assets/c1.jpg",
      details: [
        "Versatile meeting space accommodating up to 80 guests in multiple layout formats",
        "Professional audio-visual systems, including high-lumens projector and sound layout",
        "Gourmet coffee break menus and full luncheon options from Tamarind Restaurant",
        "High-speed fiber-optic wireless internet connectivity",
        "Dedicated events manager to oversee every technical and service detail",
      ],
    },
  ];

  await db.insert(globalSettings).values({
    key: "facilities",
    value: facilitiesData,
  }).onConflictDoNothing();

  console.log("[Seed] Facilities seeded into global_settings (Pools & Conferences).");
}

// ---------------------------------------------------------------
// 7. Official Boarding Packages (Meal Plans)
// ---------------------------------------------------------------
async function seedMealPlans(db: ReturnType<typeof getDb>): Promise<void> {
  const existing = await db.select().from(mealPlans).limit(1);
  if (existing.length > 0) return;

  const standardPlans = [
    {
      id: "room-only",
      name: "Flexible Rate — Room Only",
      shortName: "RO",
      description: "Accommodation only. Complete flexibility to cook in your granite-top Swahili kitchen or explore Mombasa's finest dining à la carte.",
      pricePerPersonPerDayUsd: 0,
      pricePerPersonPerDayKes: 0,
      image: "https://media.tamarind.co.ke/tvl-website-assets/r12.jpg",
      highlights: [
        "Self-catering granite Swahili kitchen access with premium appliances",
        "Complimentary welcome arrival cocktail",
        "Full resident access to Harbour Restaurant & 2 Clifftop Pools",
        "Daily housekeeping, evening turndown service & Wi-Fi",
      ],
      isActive: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: "bed-breakfast",
      name: "Bed & Breakfast Experience",
      shortName: "BB",
      description: "Start each day of your coastal stay with a fresh ocean breeze and our celebrated clifftop breakfast served poolside at Harbour Restaurant.",
      pricePerPersonPerDayUsd: 21,
      pricePerPersonPerDayKes: 2750,
      image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg",
      highlights: [
        "Daily clifftop harbour breakfast served poolside overlooking Tudor Creek",
        "Freshly squeezed Mombasa tropical juices & seasonal fruits",
        "Eggs cooked to order, Swahili mahamri pastries, and local pancakes",
        "Freshly brewed premium Kenyan coffee or spiced coastal tea",
      ],
      isActive: true,
      sortOrder: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: "half-board",
      name: "Half Board Deal - (Breakfast & Dinner/Lunch)",
      shortName: "HB",
      description: "The ultimate Tamarind experience. Breakfast each morning, plus your choice of a lunch or dinner at the cliffside Tamarind Restaurant.",
      pricePerPersonPerDayUsd: 41,
      pricePerPersonPerDayKes: 5350,
      image: "https://media.tamarind.co.ke/tvl-website-assets/mr6.jpg",
      highlights: [
        "Daily clifftop harbour breakfast at Harbour Restaurant",
        "Choice of lunch or dinner from the à la carte menu at Tamarind Mombasa",
        "Priority creekside table placement for staying residents",
        "East Africa's premier fresh seafood specialties & Swahili coconut curries",
      ],
      isActive: true,
      sortOrder: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: "half-board-seafood",
      name: "Stay & Dine — Half Board Deal with Seafood",
      shortName: "HB",
      description: "The ultimate Tamarind experience. Gourmet breakfast each morning, plus your choice of a magnificent lunch or dinner at the cliffside Tamarind Restaurant.",
      pricePerPersonPerDayUsd: 41,
      pricePerPersonPerDayKes: 5350,
      image: "https://media.tamarind.co.ke/tvl-website-assets/mr6.jpg",
      highlights: [
        "Daily clifftop harbour breakfast at Harbour Restaurant",
        "Choice of 3-course lunch or dinner from the à la carte menu at Tamarind Mombasa",
        "Priority creekside table placement for staying residents",
        "East Africa's premier fresh seafood specialties & Swahili coconut curries",
      ],
      isActive: true,
      sortOrder: 4,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const plan of standardPlans) {
    await db.insert(mealPlans).values(plan as any).onConflictDoNothing();
  }

  console.log("[Seed] Official Boarding Packages seeded (RO: $0, BB: $21, HB: $41).");
}

