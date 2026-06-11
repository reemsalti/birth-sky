import { base, coord, globe, sidereal, solar } from "astronomia";
import { dateToJulianDay } from "./astro";
import { getConstellationFromEclipticLongitude } from "./constellationBounds";

export const DEFAULT_UNKNOWN_TIME = "22:00";

export interface BirthContext {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM local
  latitude: number; // degrees north
  longitude: number; // degrees east
  placeName?: string;
  timeApproximate?: boolean;
  liveSky?: boolean;
}

const BIRTH_CONTEXT_KEY = "birth-sky-context";
const LEGACY_BIRTHDAY_KEY = "birth-sky-birthday";

export function parseBirthMoment(ctx: BirthContext): Date {
  const [year, month, day] = ctx.date.split("-").map(Number);
  const [hour, minute] = ctx.time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute || 0, 0);
}

export function getJulianDay(moment: Date): number {
  return dateToJulianDay(moment);
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** astronomia uses west-positive longitude */
function westLongitudeRad(longitudeEastDeg: number): number {
  return -degToRad(longitudeEastDeg);
}

function altitudeRadians(
  raHours: number,
  decDeg: number,
  ctx: BirthContext,
  jde: number
): number {
  const ra = (raHours / 24) * Math.PI * 2;
  const dec = degToRad(decDeg);
  const eq = new coord.Equatorial(ra, dec);
  const observer = new globe.Coord(degToRad(ctx.latitude), westLongitudeRad(ctx.longitude));
  const stSeconds = sidereal.apparent(jde);
  const horizontal = eq.toHorizontal(observer, stSeconds);
  return horizontal.alt;
}

export function isAboveHorizon(
  raHours: number,
  decDeg: number,
  ctx: BirthContext,
  jde: number,
  minAltDeg = -0.5
): boolean {
  const altDeg = (altitudeRadians(raHours, decDeg, ctx, jde) * 180) / Math.PI;
  return altDeg > minAltDeg;
}

export function getSunConstellation(jde: number): string {
  const lambdaDeg = (solar.apparentLongitude(base.J2000Century(jde)) * 180) / Math.PI;
  return getConstellationFromEclipticLongitude(lambdaDeg);
}

export function saveBirthContext(ctx: BirthContext) {
  localStorage.setItem(BIRTH_CONTEXT_KEY, JSON.stringify(ctx));
  localStorage.removeItem(LEGACY_BIRTHDAY_KEY);
}

export function loadBirthContext(): BirthContext | null {
  const raw = localStorage.getItem(BIRTH_CONTEXT_KEY);
  if (raw) {
    try {
      const ctx = JSON.parse(raw) as BirthContext;
      if (isValidContext(ctx)) return ctx;
    } catch {
      /* ignore */
    }
  }

  const legacy = localStorage.getItem(LEGACY_BIRTHDAY_KEY);
  if (legacy && /^\d{4}-\d{2}-\d{2}$/.test(legacy)) {
    return {
      date: legacy,
      time: DEFAULT_UNKNOWN_TIME,
      latitude: 40.7128,
      longitude: -74.006,
      placeName: "new york, usa",
      timeApproximate: true,
    };
  }

  return null;
}

export function isValidContext(ctx: BirthContext): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ctx.date)) return false;
  if (!/^\d{2}:\d{2}$/.test(ctx.time)) return false;
  if (isNaN(ctx.latitude) || ctx.latitude < -90 || ctx.latitude > 90) return false;
  if (isNaN(ctx.longitude) || ctx.longitude < -180 || ctx.longitude > 180) return false;
  return !isNaN(parseBirthMoment(ctx).getTime());
}

export function formatObserverLabel(ctx: BirthContext): string {
  const where = ctx.placeName ?? formatCoords(ctx.latitude, ctx.longitude);
  if (ctx.liveSky) return `now · ${where}`;
  const timeLabel = ctx.timeApproximate ? `approx. ${ctx.time}` : ctx.time;
  return `${timeLabel} · ${where}`;
}

export function formatAccuracyNote(ctx: BirthContext): string {
  if (ctx.liveSky) {
    return "planets and moon match this moment from your current location. drag to explore the sky.";
  }
  if (ctx.timeApproximate) {
    return "sun constellation is accurate for your date; moon and visible planets use an estimated evening time. drag to explore the sky.";
  }
  return "planets and moon match your date, time, and birth location. drag to explore the full sky.";
}

export function buildLiveSkyContext(
  latitude: number,
  longitude: number,
  placeName?: string,
  moment = new Date()
): BirthContext {
  const year = moment.getFullYear();
  const month = String(moment.getMonth() + 1).padStart(2, "0");
  const day = String(moment.getDate()).padStart(2, "0");
  const hour = String(moment.getHours()).padStart(2, "0");
  const minute = String(moment.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    latitude,
    longitude,
    placeName,
    liveSky: true,
  };
}

function formatCoords(lat: number, lon: number): string {
  const latLabel = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}`;
  const lonLabel = `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? "E" : "W"}`;
  return `${latLabel}, ${lonLabel}`;
}
