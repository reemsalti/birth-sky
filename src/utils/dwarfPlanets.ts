import { base, coord, elliptic, kepler, nutation, planetposition } from "astronomia";
import vsop87Bearth from "astronomia/data/vsop87Bearth";

// Keplerian elements at J2000.0 (NASA/JPL mean elements). Accurate to a few
// arcminutes — major planets perturb these small bodies over time.
const J2000 = 2451545.0;
const earth = new planetposition.Planet(vsop87Bearth);

export type DwarfPlanetKey = "ceres" | "pluto" | "eris" | "haumea" | "makemake";

export const DWARF_PLANET_KEYS: DwarfPlanetKey[] = [
  "ceres",
  "pluto",
  "eris",
  "haumea",
  "makemake",
];

export interface HeliocentricEcliptic {
  lon: number;
  lat: number;
  range: number;
}

interface OrbitModel {
  elements: InstanceType<typeof elliptic.Elements>;
  axis: number;
  ecc: number;
  inc: number;
  node: number;
  argP: number;
  meanMotion: number;
  timeP: number;
  orbitDays: number;
}

function deg(d: number) {
  return (d * Math.PI) / 180;
}

function buildOrbit(
  axis: number,
  ecc: number,
  incDeg: number,
  nodeDeg: number,
  argPDeg: number,
  meanLongDeg: number
): OrbitModel {
  const inc = deg(incDeg);
  const node = deg(nodeDeg);
  const argP = deg(argPDeg);
  const meanMotion = base.K / axis / Math.sqrt(axis);
  const meanAnomaly = base.pmod(deg(meanLongDeg) - node - argP, 2 * Math.PI);
  const timeP = J2000 - meanAnomaly / meanMotion;

  return {
    elements: new elliptic.Elements({
      axis,
      ecc,
      inc,
      argP,
      node,
      timeP,
    }),
    axis,
    ecc,
    inc,
    node,
    argP,
    meanMotion,
    timeP,
    orbitDays: (2 * Math.PI) / meanMotion,
  };
}

const ORBITS: Record<DwarfPlanetKey, OrbitModel> = {
  ceres: buildOrbit(2.7691652, 0.0755348, 10.59351, 80.3012, 73.597694, 167.576057),
  pluto: buildOrbit(39.48168677, 0.24880766, 17.14175, 110.30347, 113.76329, 238.92881),
  eris: buildOrbit(67.864, 0.44068, 44.039, 35.951, 151.639, 204.16),
  haumea: buildOrbit(43.218, 0.1919, 28.19, 122.1, 241.97, 171.62),
  makemake: buildOrbit(45.345, 0.1594, 28.96, 79.38, 296.53, 252.52),
};

function heliocentricRectEquatorial(orbit: OrbitModel, jde: number) {
  const { axis, ecc, inc, node, argP, meanMotion } = orbit;
  const [sΩ, cΩ] = base.sincos(node);
  const [si, ci] = base.sincos(inc);
  const [sε, cε] = [base.SOblJ2000, base.COblJ2000];

  const F = cΩ;
  const G = sΩ * cε;
  const H = sΩ * sε;
  const P = -sΩ * ci;
  const Q = cΩ * ci * cε - si * sε;
  const R = cΩ * ci * sε + si * cε;
  const A = Math.atan2(F, P);
  const B = Math.atan2(G, Q);
  const C = Math.atan2(H, R);
  const a = Math.hypot(F, P);
  const b = Math.hypot(G, Q);
  const c = Math.hypot(H, R);

  const M = meanMotion * (jde - orbit.timeP);
  let E: number;
  try {
    E = kepler.kepler2b(ecc, M, 15);
  } catch {
    E = kepler.kepler3(ecc, M);
  }
  const ν = kepler.trueAnomaly(E, ecc);
  const r = kepler.radius(E, ecc, axis);

  return {
    x: r * a * Math.sin(A + argP + ν),
    y: r * b * Math.sin(B + argP + ν),
    z: r * c * Math.sin(C + argP + ν),
  };
}

function heliocentricEcliptic(orbit: OrbitModel, jde: number): HeliocentricEcliptic {
  const { x, y, z } = heliocentricRectEquatorial(orbit, jde);
  const range = Math.hypot(x, y, z);
  let ra = Math.atan2(y, x);
  if (ra < 0) ra += 2 * Math.PI;
  const dec = Math.asin(z / range);
  const obliquity = nutation.meanObliquity(jde);
  const ecliptic = new coord.Equatorial(ra, dec).toEcliptic(obliquity);
  return { lon: ecliptic.lon, lat: ecliptic.lat, range };
}

export function getDwarfPlanetEquatorial(key: DwarfPlanetKey, jde: number) {
  return ORBITS[key].elements.position(jde, earth);
}

export function getDwarfPlanetHeliocentric(
  key: DwarfPlanetKey,
  jde: number
): HeliocentricEcliptic {
  return heliocentricEcliptic(ORBITS[key], jde);
}

export function getDwarfPlanetOrbitDays(key: DwarfPlanetKey): number {
  return ORBITS[key].orbitDays;
}

export const PLUTO_ORBIT_DAYS = ORBITS.pluto.orbitDays;

export function getPlutoEquatorial(jde: number) {
  return getDwarfPlanetEquatorial("pluto", jde);
}

export function getPlutoHeliocentric(jde: number): HeliocentricEcliptic {
  return getDwarfPlanetHeliocentric("pluto", jde);
}
