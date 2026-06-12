import { planetposition, elliptic, moonposition, coord, nutation, base, solar } from "astronomia";
import vsop87Bearth from "astronomia/data/vsop87Bearth";
import vsop87Bmercury from "astronomia/data/vsop87Bmercury";
import vsop87Bvenus from "astronomia/data/vsop87Bvenus";
import vsop87Bmars from "astronomia/data/vsop87Bmars";
import vsop87Bjupiter from "astronomia/data/vsop87Bjupiter";
import vsop87Bsaturn from "astronomia/data/vsop87Bsaturn";
import vsop87Buranus from "astronomia/data/vsop87Buranus";
import vsop87Bneptune from "astronomia/data/vsop87Bneptune";
import {
  getJulianDay,
  getSunConstellation,
  isAboveHorizon,
  parseBirthMoment,
  type BirthContext,
} from "./observer";
import { getDwarfPlanetEquatorial } from "./dwarfPlanets";

const SKY_PLANETS = [
  { name: "Mercury", data: vsop87Bmercury },
  { name: "Venus", data: vsop87Bvenus },
  { name: "Mars", data: vsop87Bmars },
  { name: "Jupiter", data: vsop87Bjupiter },
  { name: "Saturn", data: vsop87Bsaturn },
  { name: "Uranus", data: vsop87Buranus },
  { name: "Neptune", data: vsop87Bneptune },
] as const;

export type MoonPhaseName =
  | "new moon"
  | "waxing crescent"
  | "first quarter"
  | "waxing gibbous"
  | "full moon"
  | "waning gibbous"
  | "last quarter"
  | "waning crescent";

export type TropicalSign =
  | "capricorn"
  | "aquarius"
  | "pisces"
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius";

export type ChineseAnimal =
  | "rat"
  | "ox"
  | "tiger"
  | "rabbit"
  | "dragon"
  | "snake"
  | "horse"
  | "goat"
  | "monkey"
  | "rooster"
  | "dog"
  | "pig";

export interface NightFacts {
  sunConstellationCode: string;
  tropicalSign: TropicalSign;
  moonPhase: MoonPhaseName;
  moonIllumination: number;
  moonAboveHorizon: boolean;
  visibleBodies: string[];
  chineseAnimal: ChineseAnimal;
  chineseYearAmbiguous: boolean;
  season: string;
  nearestSabbat: string | null;
}

function normalizeRadians(angle: number): number {
  const tau = Math.PI * 2;
  return ((angle % tau) + tau) % tau;
}

export function getMoonPhase(jde: number): { phase: MoonPhaseName; illumination: number } {
  const sunLon = solar.apparentLongitude(base.J2000Century(jde));
  const moonLon = moonposition.position(jde).lon;
  const phaseAngle = normalizeRadians(moonLon - sunLon);
  const illumination = (1 - Math.cos(phaseAngle)) / 2;
  const deg = (phaseAngle * 180) / Math.PI;

  let phase: MoonPhaseName;
  if (deg < 22.5 || deg >= 337.5) phase = "new moon";
  else if (deg < 67.5) phase = "waxing crescent";
  else if (deg < 112.5) phase = "first quarter";
  else if (deg < 157.5) phase = "waxing gibbous";
  else if (deg < 202.5) phase = "full moon";
  else if (deg < 247.5) phase = "waning gibbous";
  else if (deg < 292.5) phase = "last quarter";
  else phase = "waning crescent";

  return { phase, illumination };
}

export function getTropicalSign(dateStr: string): TropicalSign {
  const [, month, day] = dateStr.split("-").map(Number);

  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "pisces";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
  return "sagittarius";
}

const CHINESE_ANIMALS: ChineseAnimal[] = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  "snake",
  "horse",
  "goat",
  "monkey",
  "rooster",
  "dog",
  "pig",
];

// Lunar New Year (Gregorian) for ambiguous Jan/Feb births — subset, extend as needed.
const LUNAR_NEW_YEAR: Record<number, string> = {
  1990: "01-27",
  1995: "01-31",
  2000: "02-05",
  2005: "02-09",
  2010: "02-14",
  2015: "02-19",
  2020: "01-25",
  2024: "02-10",
  2025: "01-29",
};

export function getChineseZodiac(dateStr: string): {
  animal: ChineseAnimal;
  ambiguous: boolean;
} {
  const [year, month, day] = dateStr.split("-").map(Number);
  let zodiacYear = year;
  let ambiguous = false;

  if (month === 1 || month === 2) {
    const lny = LUNAR_NEW_YEAR[year];
    if (lny) {
      const [lnyMonth, lnyDay] = lny.split("-").map(Number);
      if (month < lnyMonth || (month === lnyMonth && day < lnyDay)) {
        zodiacYear = year - 1;
        ambiguous = true;
      }
    } else if (month === 1) {
      zodiacYear = year - 1;
      ambiguous = true;
    }
  }

  const animal = CHINESE_ANIMALS[(zodiacYear - 1900) % 12];
  return { animal, ambiguous };
}

function getSeason(dateStr: string, latitude: number): string {
  const [, month, day] = dateStr.split("-").map(Number);
  const northern = latitude >= 0;

  const inRange = (startM: number, startD: number, endM: number, endD: number) => {
    const md = month * 100 + day;
    const start = startM * 100 + startD;
    const end = endM * 100 + endD;
    if (start <= end) return md >= start && md <= end;
    return md >= start || md <= end;
  };

  let season: string;
  if (inRange(3, 20, 6, 20)) season = "spring";
  else if (inRange(6, 21, 9, 22)) season = "summer";
  else if (inRange(9, 23, 12, 20)) season = "autumn";
  else season = "winter";

  if (!northern) {
    const flip: Record<string, string> = {
      spring: "autumn",
      summer: "winter",
      autumn: "spring",
      winter: "summer",
    };
    season = flip[season];
  }

  return season;
}

function getNearestSabbat(dateStr: string): string | null {
  const [year, month, day] = dateStr.split("-").map(Number);
  const md = month * 100 + day;

  const sabbats: Array<{ label: string; month: number; day: number }> = [
    { label: "winter solstice (Yule)", month: 12, day: 21 },
    { label: "spring equinox (Ostara)", month: 3, day: 20 },
    { label: "summer solstice (Litha)", month: 6, day: 21 },
    { label: "autumn equinox (Mabon)", month: 9, day: 22 },
  ];

  let nearest: { label: string; days: number } | null = null;
  for (const sabbat of sabbats) {
    const sabbatDate = new Date(year, sabbat.month - 1, sabbat.day);
    const birthDate = new Date(year, month - 1, day);
    const days = Math.abs(
      Math.round((birthDate.getTime() - sabbatDate.getTime()) / 86_400_000)
    );
    if (days <= 14 && (!nearest || days < nearest.days)) {
      nearest = { label: sabbat.label, days };
    }
  }

  return nearest?.label ?? null;
}

export function getVisibleSkyBodies(ctx: BirthContext, jde: number): string[] {
  const earth = new planetposition.Planet(vsop87Bearth);
  const visible: string[] = [];

  for (const info of SKY_PLANETS) {
    const planet = new planetposition.Planet(info.data);
    const planetCoord = elliptic.position(planet, earth, jde);
    const raHours = (planetCoord.ra / (Math.PI * 2)) * 24;
    const decDeg = (planetCoord.dec * 180) / Math.PI;
    if (isAboveHorizon(raHours, decDeg, ctx, jde)) visible.push(info.name);
  }

  for (const name of ["Ceres", "Pluto", "Eris", "Haumea", "Makemake"] as const) {
    const key = name.toLowerCase() as "ceres" | "pluto" | "eris" | "haumea" | "makemake";
    const dwarf = getDwarfPlanetEquatorial(key, jde);
    const raHours = (dwarf.ra / (Math.PI * 2)) * 24;
    const decDeg = (dwarf.dec * 180) / Math.PI;
    if (isAboveHorizon(raHours, decDeg, ctx, jde)) visible.push(name);
  }

  const moonEcliptic = moonposition.position(jde);
  const obliquity = nutation.meanObliquity(jde);
  const moonEq = new coord.Ecliptic(moonEcliptic.lon, moonEcliptic.lat).toEquatorial(obliquity);
  const moonRa = (moonEq.ra / (Math.PI * 2)) * 24;
  const moonDec = (moonEq.dec * 180) / Math.PI;
  const moonAboveHorizon = isAboveHorizon(moonRa, moonDec, ctx, jde);
  if (moonAboveHorizon) visible.push("Moon");

  return visible;
}

export function computeNightFacts(ctx: BirthContext): NightFacts {
  const jde = getJulianDay(parseBirthMoment(ctx));
  const { phase, illumination } = getMoonPhase(jde);
  const visibleBodies = getVisibleSkyBodies(ctx, jde);
  const { animal, ambiguous } = getChineseZodiac(ctx.date);

  const moonEcliptic = moonposition.position(jde);
  const obliquity = nutation.meanObliquity(jde);
  const moonEq = new coord.Ecliptic(moonEcliptic.lon, moonEcliptic.lat).toEquatorial(obliquity);
  const moonRa = (moonEq.ra / (Math.PI * 2)) * 24;
  const moonDec = (moonEq.dec * 180) / Math.PI;

  return {
    sunConstellationCode: getSunConstellation(jde),
    tropicalSign: getTropicalSign(ctx.date),
    moonPhase: phase,
    moonIllumination: illumination,
    moonAboveHorizon: isAboveHorizon(moonRa, moonDec, ctx, jde),
    visibleBodies,
    chineseAnimal: animal,
    chineseYearAmbiguous: ambiguous,
    season: getSeason(ctx.date, ctx.latitude),
    nearestSabbat: getNearestSabbat(ctx.date),
  };
}
