import https from "https";

interface CacheEntry {
  data: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds fresh

export async function fetchUpperBookingXml(endpoint: "Rooms" | "Offers"): Promise<string> {
  const cacheKey = endpoint;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  // Return fresh cache immediately
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://wis.upperbooking.com/tamarindvillage/${endpoint}.xml?locale=en`;

  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/xml, application/xml, */*",
          "Accept-Encoding": "identity",
        },
        timeout: 12000,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          if (cached) {
            console.warn(`[Profitroom Proxy] UpperBooking returned ${res.statusCode}, serving cached data`);
            return resolve(cached.data);
          }
          return reject(new Error(`UpperBooking responded with ${res.statusCode}`));
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (body && body.trim().startsWith("<")) {
            cache.set(cacheKey, { data: body, timestamp: Date.now() });
            resolve(body);
          } else if (cached) {
            resolve(cached.data);
          } else {
            reject(new Error("UpperBooking returned invalid XML"));
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      if (cached) {
        console.warn("[Profitroom Proxy] UpperBooking timed out, serving cached data");
        resolve(cached.data);
      } else {
        reject(new Error("Connection to UpperBooking timed out"));
      }
    });

    req.on("error", (err) => {
      if (cached) {
        console.warn(`[Profitroom Proxy] UpperBooking fetch error (${err.message}), serving cached data`);
        resolve(cached.data);
      } else {
        reject(err);
      }
    });
  });
}
