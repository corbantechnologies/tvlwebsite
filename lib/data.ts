import { ApartmentType, DiningExperience, FacilityType, ResortEvent, ResortPackage } from "@/types";

export const APARTMENTS: ApartmentType[] = [
  {
    id: "apt_1_bed",
    name: "1 Bedroom Luxury Ocean Suite",
    description: "Perched gracefully above the tranquil waters of Tudor Creek, this expansive 1-bedroom sanctuary features a private sea-facing terrace, hand-carved Lamu wood furnishings, fully-fitted granite kitchen, and en-suite master bath. Perfect for couples or solo executives.",
    size: "85 m²",
    maxGuests: 2,
    pricePerNight: 160,
    image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg",
    gallery: [
      "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--3.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg"
    ],
    amenities: ["High-speed WiFi", "Air Conditioning", "Oceanfront Terrace", "Granite Kitchen", "Smart TV", "Room Service"],
    bedrooms: 1,
    bathrooms: 1,
    highlights: ["Direct Creek Panorama", "Private Sun Loungers", "Daily Housekeeping"],
    bedConfig: "1 King Bed",
    viewType: "Direct Creek & Ocean View",
    isActive: true
  },
  {
    id: "apt_2_bed",
    name: "2 Bedroom Executive Family Haven",
    description: "Our signature two-bedroom coastal residence offering two master suites, sprawling open-concept living area, gourmet kitchen, and dual private balconies catching the Indian Ocean breeze. Ideal for families and group getaways.",
    size: "140 m²",
    maxGuests: 4,
    pricePerNight: 260,
    image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--3.jpg",
    gallery: [
      "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--3.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg"
    ],
    amenities: ["High-speed WiFi", "Dual AC Zones", "Two Private Balconies", "Full Gourmet Kitchen", "Washer/Dryer", "Dining Area"],
    bedrooms: 2,
    bathrooms: 2,
    highlights: ["Dual Master En-suites", "Panoramic Veranda", "Concierge Service"],
    bedConfig: "1 King Bed + 2 Twin Beds",
    viewType: "Ocean & Garden View",
    isActive: true
  },
  {
    id: "apt_3_bed",
    name: "3 Bedroom Royal Penthouse Suite",
    description: "The crown jewel of Tamarind Village. A palatial 3-bedroom top-floor residence featuring 360-degree views of Mombasa's Old Port and Tudor Creek, expansive dining hall, dedicated butler pantry, and luxury wraparound sun deck.",
    size: "210 m²",
    maxGuests: 6,
    pricePerNight: 390,
    image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg",
    gallery: [
      "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg"
    ],
    amenities: ["High-speed WiFi", "Private Butler Service", "Wraparound Sun Deck", "Chef's Kitchen", "Jacuzzi Bath", "Bar Counter"],
    bedrooms: 3,
    bathrooms: 3.5,
    highlights: ["VIP Private Lift Access", "Exclusive Sunset Deck", "Priority Dhow Reservations"],
    bedConfig: "2 King Beds + 2 Twin Beds",
    viewType: "360° Harbour & Ocean View",
    isActive: true
  }
];

export const DINING: DiningExperience[] = [
  {
    id: "din_tamarind_restaurant",
    name: "Tamarind Mombasa Restaurant",
    description: "Built on a cliff overlooking the Old Town of Mombasa, Tamarind Restaurant is internationally renowned for serving the finest seafood in East Africa, blending French, Asian, and traditional Swahili coastal culinary artistry.",
    highlights: ["Crayfish Thermidor", "Fresh Mombasa Oysters", "Chilled Dawa Cocktails", "Cliffside Seating"],
    hours: "12:00 PM - 11:00 PM Daily",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    reservationLinkText: "Inquire Table",
    maxCapacity: 150,
    isActive: true
  },
  {
    id: "din_tamarind_dhow",
    name: "Tamarind Dhow Ocean Cruise",
    description: "An enchanting ocean voyage aboard an authentically restored Arab sailing dhow. Experience lunch or dinner under the stars, drifting through Tudor Creek with live Swahili coastal music and charcoal-grilled seafood.",
    highlights: ["Sunset & Moonlight Cruises", "Live Coastal Band", "Charcoal Grilled Lobster", "Historic Tudor Creek Voyage"],
    hours: "Lunch Sail: 1:00 PM | Dinner Sail: 6:30 PM",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    reservationLinkText: "Book Dhow Voyage",
    maxCapacity: 80,
    isActive: true
  },
  {
    id: "din_village_bar",
    name: "Harbour View Terrace & Lounge",
    description: "Relax poolside with an artisanal cappuccino, tropical fruit smoothie, or handcrafted sundowner cocktail overlooking the mangrove creek. Features light lunches, wood-fired coastal flatbreads, and tapas.",
    highlights: ["Poolside Cocktail Service", "Artisanal Coffee & Gelato", "Sunset Happy Hour", "Casual Ocean Deck"],
    hours: "7:00 AM - 10:30 PM Daily",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    reservationLinkText: "View Lounge Menu",
    maxCapacity: 100,
    isActive: true
  }
];

// ⭐ DEFAULT INCOMING RESORT EVENTS (Village, Restaurant & Dhow)
export const DEFAULT_EVENTS: ResortEvent[] = [
  {
    id: "evt_dhow_jazz_sunset",
    title: "Moonlight Dhow & Jazz Voyage",
    slug: "moonlight-dhow-jazz-voyage",
    description: "Set sail as dusk falls over the Indian Ocean. An exclusive evening of live saxophone jazz, signature Tamarind Dawa cocktails, and a four-course charcoal grilled seafood dinner aboard our historic Arab sailing dhow.",
    venue: "tamarind_dhow",
    venueName: "Tamarind Dhow (Old Port Pier)",
    category: "dhow_cruise",
    startDate: "2026-10-18T18:30:00Z",
    endDate: "2026-10-18T22:30:00Z",
    timeText: "6:30 PM - 10:30 PM",
    priceUsd: 75,
    priceKes: 9500,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
    ],
    maxCapacity: 60,
    bookedCount: 28,
    highlights: ["Welcome Dawa Cocktail", "Live Coastal Jazz Trio", "4-Course Seafood Feast", "Starlight Tudor Creek Sail"],
    dressCode: "Coastal Elegance",
    isFeatured: true,
    isActive: true
  },
  {
    id: "evt_seafood_gala_night",
    title: "Grand Swahili Seafood Gala Night",
    slug: "grand-swahili-seafood-gala-night",
    description: "The Tamarind Restaurant cliffside terrace lights up for our flagship culinary gala. Indulge in an extravagant ocean buffet featuring King prawns, lobster medallions, spiced coconut crab, and live grill stations.",
    venue: "tamarind_restaurant",
    venueName: "Tamarind Restaurant Cliffside Terrace",
    category: "dining_gala",
    startDate: "2026-10-25T19:00:00Z",
    endDate: "2026-10-25T23:30:00Z",
    timeText: "7:00 PM - 11:30 PM",
    priceUsd: 65,
    priceKes: 8500,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
    ],
    maxCapacity: 120,
    bookedCount: 45,
    highlights: ["Fresh Shellfish Bar", "Swahili Coconut Curry Stations", "Sommelier Wine Pairings", "Live Bango Guitar"],
    dressCode: "Smart Casual",
    isFeatured: true,
    isActive: true
  },
  {
    id: "evt_pool_sundowner_dj",
    title: "Sunset Beats & Poolside Sundowners",
    slug: "sunset-beats-poolside-sundowners",
    description: "Spend your Saturday afternoon poolside with chilled tropical cocktails, gourmet tapas boards, and ambient sunset deep house sets by resident DJs overlooking the creek.",
    venue: "pool_terrace",
    venueName: "Village Oceanfront Pool Terrace",
    category: "live_music",
    startDate: "2026-11-07T16:00:00Z",
    endDate: "2026-11-07T21:00:00Z",
    timeText: "4:00 PM - 9:00 PM",
    priceUsd: 0,
    priceKes: 0,
    image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg",
    maxCapacity: 100,
    bookedCount: 15,
    highlights: ["Complimentary Resident Access", "2-for-1 Happy Hour Cocktails", "Artisanal Pizza & Sliders", "Deep House Sunset Set"],
    dressCode: "Resort Chic",
    isFeatured: false,
    isActive: true
  }
];

// ⭐ DEFAULT ROBUST MULTI-TIER RESORT PACKAGES
export const DEFAULT_RESORT_PACKAGES: ResortPackage[] = [
  {
    id: "pkg_honeymoon_romance",
    name: "Romantic Honeymoon & Dhow Escape",
    slug: "romantic-honeymoon-dhow-escape",
    subtitle: "An unforgettable coastal celebration for couples",
    category: "honeymoon",
    rateUsd: 680,
    rateKes: 89000,
    pricingType: "per_stay",
    minimumNights: 2,
    applicableSuites: ["apt_1_bed", "apt_2_bed"],
    mealPlanIncluded: "half_board",
    includedActivities: [
      "Private VIP Airport / SGR Chauffeured Transfer",
      "Chilled Champagne & Tropical Fruit Platter on Arrival",
      "Private Sunset Tamarind Dhow Dinner Voyage for Two",
      "Daily Gourmet Breakfast on Ocean Veranda"
    ],
    features: [
      "2 Nights in Luxury Ocean View Suite",
      "Romantic Turn-Down with Fresh Exotic Flowers",
      "Sunset Dhow Cruise with 4-Course Seafood Dinner",
      "Late Check-out Privilege (subject to availability)"
    ],
    terms: "Valid for two guests. 50% deposit required at reservation.",
    badge: "Honeymoon Special",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    isFeatured: true,
    isActive: true
  },
  {
    id: "pkg_weekend_staycation",
    name: "Mombasa Coastal Staycation",
    slug: "mombasa-coastal-staycation",
    subtitle: "The ultimate weekend recharge on the shores of Tudor Creek",
    category: "weekend_staycation",
    rateUsd: 490,
    rateKes: 64000,
    pricingType: "per_stay",
    minimumNights: 2,
    applicableSuites: ["apt_1_bed", "apt_2_bed", "apt_3_bed"],
    mealPlanIncluded: "bed_breakfast",
    includedActivities: [
      "Full Tamarind Breakfast Daily",
      "15% Discount on Tamarind Restaurant Dining",
      "Complimentary Creek-View Sun Loungers"
    ],
    features: [
      "2 Nights Accommodation in Chosen Luxury Suite",
      "Early Check-in from 11:00 AM",
      "Complimentary High-Speed WiFi & Pool Access",
      "Dedicated Concierge for Coastal Excursions"
    ],
    terms: "Applicable Friday to Sunday stays.",
    badge: "Weekend Getaway",
    image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--3.jpg",
    isFeatured: true,
    isActive: true
  },
  {
    id: "pkg_gourmet_halfboard",
    name: "Gourmet Half Board Culinary Package",
    slug: "gourmet-half-board-culinary-package",
    subtitle: "Dine like royalty every day of your stay",
    category: "boarding",
    rateUsd: 55,
    rateKes: 7200,
    pricingType: "per_person",
    minimumNights: 1,
    applicableSuites: ["all"],
    mealPlanIncluded: "half_board",
    includedActivities: [
      "Full English & Coastal Tamarind Breakfast",
      "3-Course A La Carte Seafood Dinner at Tamarind Restaurant or Dhow Credit"
    ],
    features: [
      "Daily Chef's Special Seafood Highlights",
      "Priority Waterfront Seating Guaranteed",
      "Complimentary Welcome Dawa Cocktail"
    ],
    terms: "Rate charged per person per night.",
    badge: "Most Popular",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    isFeatured: true,
    isActive: true
  }
];

export const FACILITIES: FacilityType[] = [
  {
    id: "fac_pools",
    name: "Dual Oceanfront Swimming Pools",
    description: "Two freshwater swimming pools surrounded by lush bougainvillea gardens and expansive sun decks overlooking the waters of Tudor Creek.",
    iconName: "Waves",
    image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg",
    details: ["Heated whirlpool section", "Kids shallow wading pool", "Poolside towel service", "Tiki cocktail bar"],
    operatingHours: "6:00 AM - 7:00 PM Daily",
    isResidentOnly: false,
    isActive: true
  },
  {
    id: "fac_fitness",
    name: "Panoramic Fitness Centre",
    description: "Equipped with state-of-the-art cardiovascular machines, free weights, resistance equipment, and floor-to-ceiling sea views.",
    iconName: "Dumbbell",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    details: ["Cardio treadmills & ellipticals", "Free weights & smith machines", "Certified personal trainers", "Air-conditioned workout floor"],
    operatingHours: "5:30 AM - 10:00 PM Daily",
    isResidentOnly: true,
    isActive: true
  },
  {
    id: "fac_conference",
    name: "Executive Waterfront Meeting Suite",
    description: "Air-conditioned conference and boardroom facility tailored for corporate retreats, board meetings, and high-level strategy sessions with full catering.",
    iconName: "Briefcase",
    image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
    details: ["High-lumen 4K projection display", "Polycom teleconference audio", "Private terrace for coffee breaks", "Custom catering menus"],
    operatingHours: "By Prior Booking",
    capacity: 45,
    isResidentOnly: false,
    isActive: true
  }
];

export const REVIEWS = [
  {
    quote: "The combination of spacious apartment living with Tamarind Restaurant's world-class dining is unmatched anywhere on the East African coast.",
    author: "Zainab K.",
    location: "Nairobi, Kenya",
    rating: 5
  },
  {
    quote: "Our sunset dhow cruise was the absolute highlight of our trip. Returning to a pristine 2-bedroom suite right on the creek was heaven.",
    author: "David & Marcus L.",
    location: "London, UK",
    rating: 5
  },
  {
    quote: "Flawless hospitality, fast WiFi for remote work, and the crayfish at the restaurant is simply to die for. We will be back every December!",
    author: "Farida M.",
    location: "Dubai, UAE",
    rating: 5
  }
];

export const FAQS = [
  {
    q: "Are the apartments self-catering?",
    a: "Yes! Every 1, 2, and 3-bedroom apartment comes with a fully equipped granite-countertop kitchen featuring modern refrigerators, ovens, cooktops, microwaves, and fine cutlery. Alternatively, you can book our Bed & Breakfast or Half Board gourmet meal plans."
  },
  {
    q: "How does dining work with Tamarind Restaurant & Dhow?",
    a: "Tamarind Village is directly connected to the world-famous Tamarind Mombasa Restaurant. Residents can enjoy priority reservations at the restaurant, room service delivery to their private veranda, or book exclusive sunset and dinner cruises on the Tamarind Dhow."
  },
  {
    q: "Can I host a private event or conference here?",
    a: "Absolutely. We host private corporate retreats, intimate weddings, sunset cocktail mixers, and dhow charters. Our team can customize accommodation, full catering, and audio-visual setups."
  },
  {
    q: "Is there secure parking and active security?",
    a: "Yes. Tamarind Village is a gated, 24-hour manned private compound with electronic surveillance and complimentary secure parking for residents and visiting guests."
  }
];

export const HERO_IMAGES = [
  "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--14.jpg",
  "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg",
  "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg"
];
