export const PROFITROOM_API_CONFIG = {
  hotelCode: "ke-tamarind-village",
  defaultCurrency: "USD",
  channelId: "website",
};

export async function fetchProfitroomRates(checkIn: string, checkOut: string, adults: number) {
  try {
    const response = await fetch("/api/profitroom?checkIn=" + checkIn + "&checkOut=" + checkOut + "&adults=" + adults);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.warn("Profitroom rate lookup failed:", e);
    return null;
  }
}
