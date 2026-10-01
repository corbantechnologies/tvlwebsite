import { pgTable, text, integer, doublePrecision, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

// ============================================================
// AUTH & USERS
// ============================================================

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // "admin" | "manager" | "reservations" | "reception"
  active: boolean("active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  lastLogin: text("last_login"),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const passwordResets = pgTable("password_resets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

// ============================================================
// APARTMENTS
// ============================================================

export const apartments = pgTable("apartments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  size: text("size").notNull(),
  maxGuests: integer("max_guests").notNull(),
  pricePerNight: integer("price_per_night").notNull(),
  image: text("image").notNull(),
  gallery: jsonb("gallery").$type<string[]>().notNull(),
  amenities: jsonb("amenities").$type<string[]>().notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: doublePrecision("bathrooms").notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull(),
  bedConfig: text("bed_config").notNull(),
  viewType: text("view_type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// ============================================================
// DINING VENUES
// ============================================================

export const diningOptions = pgTable("dining_options", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull(),
  hours: text("hours").notNull(),
  image: text("image").notNull(),
  reservationLinkText: text("reservation_link_text").notNull(),
  maxCapacity: integer("max_capacity").default(100),
  isActive: boolean("is_active").notNull().default(true),
});

// ============================================================
// MEAL PLANS (Room Only, B&B, Half Board)
// Applied per-person-per-night on top of the apartment rate
// ============================================================

export const mealPlans = pgTable("meal_plans", {
  id: text("id").primaryKey(),            // "room-only" | "bed-breakfast" | "half-board"
  name: text("name").notNull(),
  shortName: text("short_name").notNull(), // "RO" | "BB" | "HB"
  description: text("description").notNull(),
  pricePerPersonPerDayUsd: doublePrecision("price_per_person_per_day_usd").notNull().default(0),
  pricePerPersonPerDayKes: doublePrecision("price_per_person_per_day_kes").notNull().default(0),
  image: text("image"),
  highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// ============================================================
// EXTRAS (Optional add-ons guests can select during booking)
// Managed by staff; displayed to guests in the booking flow
// ============================================================

export const extras = pgTable("extras", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "transfer" | "amenity" | "excursion" | "fnb" | "experience"
  priceUsd: doublePrecision("price_usd").notNull().default(0),
  priceKes: doublePrecision("price_kes").notNull().default(0),
  pricingUnit: text("pricing_unit").notNull().default("per_booking"), // "per_booking" | "per_person" | "per_night" | "per_item"
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// ============================================================
// BOOKING EXTRAS (Junction: which extras are on a booking)
// ============================================================

export const bookingExtras = pgTable("booking_extras", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  extraId: text("extra_id").notNull(),
  extraName: text("extra_name").notNull(),        // denormalised for display
  quantity: integer("quantity").notNull().default(1),
  unitPriceUsd: doublePrecision("unit_price_usd").notNull().default(0),
  unitPriceKes: doublePrecision("unit_price_kes").notNull().default(0),
  totalPriceUsd: doublePrecision("total_price_usd").notNull().default(0),
  totalPriceKes: doublePrecision("total_price_kes").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

// ============================================================
// EVENTS (Village, Restaurant, Dawa, Dhow, Golden Key, etc.)
// ============================================================

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  brand: text("brand").notNull(), // 'tamarind_village' | 'tamarind_restaurant' | 'dawa_terrace' | 'tamarind_dhow' | 'golden_key'
  venue: text("venue").notNull(),
  city: text("city").notNull().default("Mombasa"), // 'Mombasa' | 'Nairobi' | 'Nationwide'
  category: text("category").notNull(), // 'dining_gala' | 'dhow_cruise' | 'live_music' | 'cultural' | 'holiday' | 'private_charter'
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  timeText: text("time_text").notNull(),
  priceUsd: integer("price_usd").default(0),
  priceKes: integer("price_kes").default(0),
  image: text("image").notNull(),
  gallery: jsonb("gallery").$type<string[]>().default([]),
  maxCapacity: integer("max_capacity").default(100),
  bookedCount: integer("booked_count").default(0),
  highlights: jsonb("highlights").$type<string[]>().default([]),
  dressCode: text("dress_code").default("Smart Casual"),
  bookingLink: text("booking_link"),
  externalTicketUrl: text("external_ticket_url"), // for Ticketsasa, Mookh, etc.
  paymentEnabled: boolean("payment_enabled").notNull().default(false), // disabled until explicitly approved
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull(),
});

// ============================================================
// INQUIRIES
// guestToken is now a first-class indexed column, not buried in payload
// ============================================================

export const inquiries = pgTable("inquiries", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'apartment' | 'restaurant' | 'dawa_terrace' | 'dhow' | 'golden_key' | 'event' | 'general'
  venue: text("venue").notNull().default("village_apartment"), // used for email routing
  guestToken: text("guest_token").unique(), // secure no-login link token
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("Pending"), // 'Pending' | 'Contacted' | 'Quoted' | 'Booked' | 'Cancelled' | 'Closed'
  createdAt: text("created_at").notNull(),
});

// ============================================================
// BOOKINGS (confirmed reservations)
// ============================================================

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  bookingReference: text("booking_reference").notNull().unique(),
  inquiryId: text("inquiry_id"),
  apartmentId: text("apartment_id").notNull(),      // the apartment TYPE (1-bedroom, 2-bedroom, 3-bedroom)
  apartmentName: text("apartment_name").notNull(),
  allocatedUnit: text("allocated_unit"),             // physical unit e.g. "Apt 4, Block B, 3rd Floor" — set by staff post-confirmation
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  // Meal Plan (was called 'package')
  mealPlanId: text("meal_plan_id"),                 // references meal_plans.id
  mealPlanName: text("meal_plan_name"),             // denormalised for display
  mealPlanPricePerPersonUsd: doublePrecision("meal_plan_price_per_person_usd").default(0),
  mealPlanPricePerPersonKes: doublePrecision("meal_plan_price_per_person_kes").default(0),
  // Pricing snapshot
  roomRateUsd: doublePrecision("room_rate_usd").default(0),
  roomRateKes: doublePrecision("room_rate_kes").default(0),
  nights: integer("nights").default(1),
  totalRoomUsd: doublePrecision("total_room_usd").default(0),
  totalMealPlanUsd: doublePrecision("total_meal_plan_usd").default(0),
  totalExtrasUsd: doublePrecision("total_extras_usd").default(0),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  // Payment
  paymentStatus: text("payment_status").notNull().default("unpaid"), // 'unpaid' | 'deposit_paid' | 'paid' | 'refunded'
  paymentMethod: text("payment_method"),            // 'paystack' | 'mpesa' | 'bank_transfer' | 'cash' | 'direct'
  paymentReference: text("payment_reference"),
  // Status
  bookingStatus: text("booking_status").notNull().default("inquiry"), // 'inquiry' | 'confirmed' | 'arriving_today' | 'in_house' | 'departing_today' | 'checked_out' | 'cancelled' | 'no_show'
  inquirySource: text("inquiry_source").default("village_apartment"), // for routing & reporting
  // Misc
  specialRequests: text("special_requests"),
  staffNotes: jsonb("staff_notes").$type<any[]>(),
  guestToken: text("guest_token").unique(),         // secure no-login link for guest portal
  createdAt: text("created_at").notNull(),
});

// ============================================================
// AVAILABILITY: Inventory (unit counts per apartment type)
// ============================================================

export const apartmentInventory = pgTable("apartment_inventory", {
  id: text("id").primaryKey(),           // matches apartments.id
  totalUnits: integer("total_units").notNull().default(1),
  notes: text("notes"),
  updatedAt: text("updated_at").notNull(),
});

// ============================================================
// AVAILABILITY: Blocks (manual date blocks by staff)
// ============================================================

export const availabilityBlocks = pgTable("availability_blocks", {
  id: text("id").primaryKey(),
  apartmentId: text("apartment_id").notNull(), // "all" = property-wide | apartment id = specific
  startDate: text("start_date").notNull(),     // YYYY-MM-DD
  endDate: text("end_date").notNull(),         // YYYY-MM-DD
  reason: text("reason"),
  blockType: text("block_type").notNull().default("hard_block"), // "hard_block" | "rate_hold"
  source: text("source").default("direct"),   // "direct" | "opera" | "upperbooking"
  blockedBy: text("blocked_by"),
  createdAt: text("created_at").notNull(),
});

// ============================================================
// AVAILABILITY: Rate Overrides (per-period pricing)
// Allows peak/off-peak rates and minimum night requirements
// ============================================================

export const rateOverrides = pgTable("rate_overrides", {
  id: text("id").primaryKey(),
  apartmentId: text("apartment_id").notNull(), // "all" | specific apartment id
  startDate: text("start_date").notNull(),     // YYYY-MM-DD
  endDate: text("end_date").notNull(),         // YYYY-MM-DD
  rateUsd: doublePrecision("rate_usd"),        // null = no override (keep base rate)
  rateKes: doublePrecision("rate_kes"),
  minNights: integer("min_nights").default(1),
  label: text("label"),                        // e.g. "Christmas 2026", "Peak Season"
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
});

// ============================================================
// PRICING RULES (global markup, tax, seasonal factor)
// ============================================================

export const pricingRules = pgTable("pricing_rules", {
  id: text("id").primaryKey(), // "default"
  markupMultiplier: doublePrecision("markup_multiplier").notNull(),
  taxRate: integer("tax_rate").notNull(),
  seasonalFactor: text("seasonal_factor").notNull(),
});

// ============================================================
// AUDIT LOGS
// ============================================================

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  actor: text("actor").notNull(),
  actorRole: text("actor_role").notNull(),
  category: text("category").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
});

// ============================================================
// GLOBAL SETTINGS (hero content, site configuration)
// ============================================================

export const globalSettings = pgTable("global_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

// ============================================================
// VIP TRANSFERS & FLEET DISPATCH
// ============================================================

export const transfers = pgTable("transfers", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id"),
  bookingReference: text("booking_reference"),
  guestName: text("guest_name").notNull(),
  guestPhone: text("guest_phone"),
  guestEmail: text("guest_email"),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  pickupDateTime: text("pickup_date_time").notNull(),
  flightOrTrainNumber: text("flight_or_train_number"),
  vehicleType: text("vehicle_type").notNull().default("Executive Private Sedan"),
  passengers: integer("passengers").default(1),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  status: text("status").notNull().default("scheduled"),
  costKes: doublePrecision("cost_kes").default(0),
  costUsd: doublePrecision("cost_usd").default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

// ============================================================
// BOOKING CONDITIONS & CANCELLATION POLICIES (CRUD)
// ============================================================

export const bookingConditions = pgTable("booking_conditions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull().default("cancellation"), // "cancellation" | "check_in_out" | "house_rules" | "payment" | "occupancy" | "general"
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  badge: text("badge"), // e.g. "48h Guarantee", "Strictly Non-Smoking", "100% Refund"
  isMandatory: boolean("is_mandatory").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

// ============================================================
// VOUCHERS & PROMO CODES (CRUD)
// ============================================================

export const vouchers = pgTable("vouchers", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. "TAMARIND2026", "VIPGUEST"
  description: text("description"),
  discountType: text("discount_type").notNull().default("percentage"), // "percentage" | "fixed_usd" | "fixed_kes"
  discountValue: doublePrecision("discount_value").notNull(), // e.g. 10 (%) or 50 ($)
  minSpendUsd: doublePrecision("min_spend_usd").default(0),
  maxDiscountUsd: doublePrecision("max_discount_usd"), // optional cap for percentage discounts
  validFrom: text("valid_from"), // YYYY-MM-DD
  validUntil: text("valid_until"), // YYYY-MM-DD
  usageLimit: integer("usage_limit"), // null = unlimited
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

