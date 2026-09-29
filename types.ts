
export interface ApartmentType {
  id: string;
  name: string;
  title?: string;
  description: string;
  size: string;
  sizeSqMeters?: number;
  maxGuests: number;
  capacity?: number;
  pricePerNight: number;
  pricePerNightKes?: number;
  pricePerNightUsd?: number;
  image: string;
  images?: string[];
  gallery: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  highlights: string[];
  bedConfig: string;
  viewType: string;
  isActive?: boolean;
}

export interface PackageType {
  id: string;
  name: string;
  description: string;
  priceMarkupPercentage: number;
  pricePerPersonPerDay: number;
  highlights: string[];
  isActive?: boolean;
}

export interface DiningExperience {
  id: string;
  name: string;
  title?: string;
  cuisine?: string;
  description: string;
  highlights: string[];
  hours: string;
  dressCode?: string;
  signatureDishes?: string[];
  image: string;
  reservationLinkText?: string;
  maxCapacity?: number;
  isActive?: boolean;
}

export interface FacilityType {
  id: string;
  name: string;
  title?: string;
  description: string;
  iconName?: string;
  image?: string;
  details?: string[];
  isResidentOnly?: boolean;
  operatingHours?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface ExtraItem {
  id: string;
  category: "transfer" | "charter" | "amenity" | "event";
  name: string;
  description: string;
  priceUsd: number;
  priceKes: number;
  capacity?: number;
  features: string[];
  image: string;
  isActive?: boolean;
}

export interface TransferVehicle {
  id: string;
  name: string;
  tagline?: string;
  category?: "standard" | "van" | "executive" | "bus";
  capacity?: number;
  maxPassengers?: number;
  luggage?: number;
  maxLuggage?: number;
  priceUsd?: number;
  rateUsd?: number;
  priceKes?: number;
  rateKes?: number;
  image: string;
  features: string[];
  isActive?: boolean;
}

export interface EventPackage {
  id: string;
  title: string;
  subtitle?: string;
  venue?: string;
  tag?: string;
  tagIcon?: "heart" | "ship" | "briefcase" | "sparkles";
  capacity?: string;
  capacityText?: string;
  cateringText?: string;
  extraHighlight?: string;
  ctaText?: string;
  priceUsd?: number;
  priceKes?: number;
  features: string[];
  image: string;
  description?: string;
  isActive?: boolean;
}

export interface ResortEvent {
  id: string;
  title: string;
  slug?: string;
  description: string;
  venue: string;
  venueName?: string;
  category?: string;
  startDate?: string;
  eventDate?: string;
  endDate?: string;
  timeText?: string;
  eventTime?: string;
  priceUsd?: number;
  ticketPriceUsd?: number;
  priceKes?: number;
  ticketPriceKes?: number;
  image?: string;
  posterUrl?: string;
  gallery?: string[];
  maxCapacity?: number;
  capacity?: number;
  bookedCount?: number;
  highlights?: string[];
  dressCode?: string;
  bookingLink?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface ResortPackage {
  id: string;
  name: string;
  slug?: string;
  subtitle?: string;
  tier?: string;
  category?: string;
  rateUsd?: number;
  priceUsd?: number;
  rateKes?: number;
  priceKes?: number;
  pricingType?: "per_night" | "per_stay" | "per_person";
  nights?: number;
  minimumNights?: number;
  applicableSuites?: string[];
  mealPlanIncluded?: string;
  includedActivities?: string[];
  features?: string[];
  inclusions?: string[];
  terms?: string;
  badge?: string;
  description?: string;
  image?: string;
  heroImage?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export type StaffRole = "admin" | "manager" | "reservations" | "reception" | "frontdesk" | "gm";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active?: boolean;
  createdAt?: string;
  lastLogin?: string;
  pin?: string;
}

export interface BookingRecord {
  id: string;
  bookingReference: string;
  inquiryId?: string;
  apartmentId: string;
  apartmentName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  packageId?: string;
  packageName?: string;
  totalAmount: number;
  currency: string;
  paymentStatus: "unpaid" | "deposit_paid" | "paid" | "refunded";
  paymentMethod?: string;
  bookingStatus: "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
  specialRequests?: string;
  staffNotes?: any[];
  createdAt: string;
}

export type InquiryStatus = "Pending" | "Confirmed" | "Cancelled" | "Closed" | "In-Progress";

export interface StaffNote {
  id: string;
  text: string;
  author: string;
  authorRole: string;
  createdAt: string;
}

export interface InquiryData {
  id: string;
  type: "general" | "apartment" | "dining" | "event" | "package";
  payload: {
    name: string;
    email: string;
    phone: string;
    apartmentName?: string;
    apartmentId?: string;
    diningName?: string;
    diningId?: string;
    eventName?: string;
    eventId?: string;
    packageId?: string;
    packageName?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    requests?: string;
    totalCost?: number;
    paymentLink?: string;
    paymentStatus?: "unpaid" | "paid" | "deposit";
    message?: string;
    subject?: string;
    guestToken?: string;
    staffNotes?: StaffNote[];
    auditTrail?: any[];
  };
  status: InquiryStatus;
  createdAt: string;
}

export interface PricingRules {
  markupMultiplier: number;
  taxRate: number;
  seasonalFactor: "regular" | "peak" | "low" | string;
  exchangeRate?: number;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  category: string;
  action: string;
  details: string;
  targetId?: string;
  metadata?: any;
}
