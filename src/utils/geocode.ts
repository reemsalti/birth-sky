export interface GeoPlace {
  name: string;
  latitude: number;
  longitude: number;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  locality?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  importance?: number;
  addresstype?: string;
  name?: string;
  address?: NominatimAddress;
}

function localityFromAddress(address: NominatimAddress, fallback?: string): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.locality ||
    fallback ||
    ""
  );
}

/** city, state — or city, province / city, country */
function formatPlaceLabel(address: NominatimAddress, fallbackName?: string): string {
  const locality = localityFromAddress(address, fallbackName);
  const state = address.state?.trim();
  const country = address.country?.trim();
  const code = address.country_code?.toLowerCase();

  if (!locality) return fallbackName || country || "unknown";

  // US, Canada, Australia, India: city + state/province
  if (state && code && ["us", "ca", "au", "in"].includes(code)) {
    return `${locality}, ${state}`;
  }

  // UK & similar: city + constituent country/county when useful
  if (state && code === "gb") {
    return `${locality}, ${state}`;
  }

  if (country) {
    return `${locality}, ${country}`;
  }

  if (state) return `${locality}, ${state}`;
  return locality;
}

function mapResult(item: NominatimResult): GeoPlace | null {
  const latitude = parseFloat(item.lat);
  const longitude = parseFloat(item.lon);
  if (isNaN(latitude) || isNaN(longitude)) return null;

  const name = item.address
    ? formatPlaceLabel(item.address, item.name)
    : item.display_name.split(",").slice(0, 2).join(",").trim();

  return { name, latitude, longitude };
}

function rankResult(item: NominatimResult): number {
  let score = item.importance ?? 0;
  const type = item.addresstype ?? "";
  if (type === "city") score += 0.5;
  else if (type === "town") score += 0.35;
  else if (type === "village") score += 0.2;
  else if (type === "hamlet") score += 0.05;
  else if (type === "protected_area") score -= 0.3;
  return score;
}

function dedupePlaces(places: GeoPlace[]): GeoPlace[] {
  const seen = new Set<string>();
  const out: GeoPlace[] = [];
  for (const place of places) {
    const key = place.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out;
}

async function fetchNominatim(url: URL): Promise<NominatimResult[]> {
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });

  if (!response.ok) throw new Error("place search failed");
  return (await response.json()) as NominatimResult[];
}

export async function searchPlaces(query: string): Promise<GeoPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", "8");

  const results = await fetchNominatim(url);

  return dedupePlaces(
    results
      .sort((a, b) => rankResult(b) - rankResult(a))
      .map(mapResult)
      .filter((place): place is GeoPlace => place !== null)
  ).slice(0, 5);
}

async function fetchNominatimReverse(url: URL): Promise<NominatimResult | null> {
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });

  if (!response.ok) throw new Error("place search failed");
  const json = (await response.json()) as NominatimResult;
  if (!json?.lat || !json?.lon) return null;
  return json;
}

export async function reversePlace(latitude: number, longitude: number): Promise<GeoPlace | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  const result = await fetchNominatimReverse(url);
  if (!result) return null;

  return mapResult(result);
}
