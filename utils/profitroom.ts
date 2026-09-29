import { useState, useEffect } from "react";

export interface LiveRoomData {
  id: string;
  name: string;
  minPrice: number;
  currency: string;
  description?: string;
}

export interface LiveOfferData {
  id: string;
  name: string;
  minPrice?: number;
  description?: string;
}

async function fetchXmlContent(endpoint: "rooms" | "offers"): Promise<string> {
  const localProxyPath = `/api/profitroom/${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(localProxyPath, {
      signal: controller.signal,
      headers: { "Accept": "text/xml, application/xml" }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().startsWith("<")) {
        return text;
      }
    }
    throw new Error(`Local proxy responded with status ${response.status}`);
  } catch (proxyError: any) {
    console.warn(`[Profitroom] Local proxy ${localProxyPath} error: ${proxyError.message}`);
    throw proxyError;
  }
}

export async function fetchLiveRooms(): Promise<LiveRoomData[]> {
  if (typeof window === "undefined") return [];

  try {
    const xmlText = await fetchXmlContent("rooms");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    if (xmlDoc.querySelector("parsererror")) {
      throw new Error("XML parsing error");
    }

    const roomElements = xmlDoc.getElementsByTagName("Room");
    const rooms: LiveRoomData[] = [];

    for (let i = 0; i < roomElements.length; i++) {
      const roomEl = roomElements[i];
      const id = roomEl.querySelector("RoomID")?.textContent || roomEl.getAttribute("id") || "";
      const name = roomEl.querySelector("RoomName")?.textContent || "Tamarind Apartment";

      let priceText = "0";
      const minPriceEl = roomEl.querySelector("MinPrice");
      if (minPriceEl) {
        const priceEl = minPriceEl.querySelector("Price");
        priceText = priceEl?.textContent || minPriceEl.textContent || "0";
      }

      const currency = roomEl.querySelector("Currency")?.textContent || "USD";
      const description = roomEl.querySelector("RoomDescription")?.textContent || "";
      const minPrice = parseFloat(priceText) || 0;

      if (id) {
        rooms.push({
          id,
          name,
          minPrice,
          currency,
          description: description || undefined,
        });
      }
    }

    return rooms;
  } catch (error) {
    console.error("Failed to parse live rooms from Profitroom:", error);
    return [];
  }
}

export async function fetchLiveOffers(): Promise<LiveOfferData[]> {
  if (typeof window === "undefined") return [];

  try {
    const xmlText = await fetchXmlContent("offers");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    if (xmlDoc.querySelector("parsererror")) {
      throw new Error("XML parsing error");
    }

    const offerElements = xmlDoc.getElementsByTagName("Offer");
    const offers: LiveOfferData[] = [];

    for (let i = 0; i < offerElements.length; i++) {
      const offerEl = offerElements[i];
      const id = offerEl.querySelector("OfferID")?.textContent || "";
      const name = offerEl.querySelector("OfferName")?.textContent || "Special Offer";

      let priceText = "";
      const minPriceEl = offerEl.querySelector("MinPrice");
      if (minPriceEl) {
        const priceEl = minPriceEl.querySelector("Price");
        priceText = priceEl?.textContent || minPriceEl.textContent || "";
      }

      const description = offerEl.querySelector("OfferDescription")?.textContent || "";
      const minPrice = priceText ? parseFloat(priceText) : undefined;

      if (id) {
        offers.push({
          id,
          name,
          minPrice,
          description: description || undefined,
        });
      }
    }

    return offers;
  } catch (error) {
    console.error("Failed to parse live offers from Profitroom:", error);
    return [];
  }
}

let cachedRooms: LiveRoomData[] | null = null;
let cachedOffers: LiveOfferData[] | null = null;

export async function getLiveRoomsCached(): Promise<LiveRoomData[]> {
  if (typeof window === "undefined") return [];
  if (cachedRooms && cachedRooms.length > 0) return cachedRooms;

  try {
    const saved = sessionStorage.getItem("profitroom_rooms_cache");
    if (saved) {
      cachedRooms = JSON.parse(saved);
      if (cachedRooms && cachedRooms.length > 0) return cachedRooms;
    }
  } catch (e) {
    // Ignore storage error
  }

  const rooms = await fetchLiveRooms();
  if (rooms && rooms.length > 0) {
    cachedRooms = rooms;
    try {
      sessionStorage.setItem("profitroom_rooms_cache", JSON.stringify(rooms));
    } catch (e) {
      // Ignore storage error
    }
  }
  return rooms || [];
}

export async function getLiveOffersCached(): Promise<LiveOfferData[]> {
  if (typeof window === "undefined") return [];
  if (cachedOffers && cachedOffers.length > 0) return cachedOffers;

  try {
    const saved = sessionStorage.getItem("profitroom_offers_cache");
    if (saved) {
      cachedOffers = JSON.parse(saved);
      if (cachedOffers && cachedOffers.length > 0) return cachedOffers;
    }
  } catch (e) {
    // Ignore storage error
  }

  const offers = await fetchLiveOffers();
  if (offers && offers.length > 0) {
    cachedOffers = offers;
    try {
      sessionStorage.setItem("profitroom_offers_cache", JSON.stringify(offers));
    } catch (e) {
      // Ignore storage error
    }
  }
  return offers || [];
}

export function useLiveRates() {
  const [liveRooms, setLiveRooms] = useState<LiveRoomData[]>([]);
  const [liveOffers, setLiveOffers] = useState<LiveOfferData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLiveRoomsCached(), getLiveOffersCached()])
      .then(([rooms, offers]) => {
        if (rooms && rooms.length > 0) setLiveRooms(rooms);
        if (offers && offers.length > 0) setLiveOffers(offers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getLivePrice = (apartmentId: string, defaultPrice: number): { price: number; isLive: boolean } => {
    if (!liveRooms || liveRooms.length === 0) {
      return { price: defaultPrice, isLive: false };
    }

    const cleanId = apartmentId.toLowerCase().trim();
    const isOne = cleanId.includes("1") || cleanId.includes("one");
    const isTwo = cleanId.includes("2") || cleanId.includes("two");
    const isThree = cleanId.includes("3") || cleanId.includes("three");

    const matchingRoom = liveRooms.find((r) => {
      const roomNameClean = r.name.toLowerCase();
      const roomIdClean = r.id.toLowerCase();

      if (roomIdClean === cleanId || roomNameClean.includes(cleanId)) return true;
      if (isOne && (roomNameClean.includes("one") || roomNameClean.includes("1") || roomIdClean === "427573")) return true;
      if (isTwo && (roomNameClean.includes("two") || roomNameClean.includes("2") || roomIdClean === "427575")) return true;
      if (isThree && (roomNameClean.includes("three") || roomNameClean.includes("3") || roomIdClean === "427577")) return true;
      return false;
    });

    if (matchingRoom && matchingRoom.minPrice > 0) {
      return { price: matchingRoom.minPrice, isLive: true };
    }

    return { price: defaultPrice, isLive: false };
  };

  const getLivePackagePrice = (packageId: string, defaultRate: number): { rate: number; isLive: boolean; name?: string } => {
    if (!liveOffers || liveOffers.length === 0) {
      return { rate: defaultRate, isLive: false };
    }

    const cleanPkgId = packageId.toLowerCase().trim();

    const matchingOffer = liveOffers.find((o) => {
      const offerIdClean = o.id.toLowerCase();
      const offerNameClean = o.name.toLowerCase();

      if (offerIdClean === cleanPkgId) return true;

      if (
        (cleanPkgId === "ro" || cleanPkgId.includes("room") || cleanPkgId.includes("self")) &&
        (offerNameClean.includes("room only") || offerNameClean.includes("self") || offerNameClean.includes("flexible"))
      ) {
        return true;
      }

      if (
        (cleanPkgId === "bb" || cleanPkgId.includes("breakfast")) &&
        (offerNameClean.includes("breakfast") || offerNameClean.includes("b&b") || offerNameClean.includes("bed &"))
      ) {
        return true;
      }

      if (
        (cleanPkgId === "hb" || cleanPkgId.includes("half")) &&
        (offerNameClean.includes("half board") || offerNameClean.includes("half-board") || offerNameClean.includes("stay & dine"))
      ) {
        return true;
      }

      if (
        (cleanPkgId === "fb" || cleanPkgId.includes("full")) &&
        (offerNameClean.includes("full board") || offerNameClean.includes("full-board"))
      ) {
        return true;
      }

      return offerNameClean.includes(cleanPkgId);
    });

    if (matchingOffer && matchingOffer.minPrice !== undefined && matchingOffer.minPrice > 0) {
      return { rate: matchingOffer.minPrice, isLive: true, name: matchingOffer.name };
    }

    return { rate: defaultRate, isLive: false };
  };

  return { liveRooms, liveOffers, loading, getLivePrice, getLivePackagePrice };
}
