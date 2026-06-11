// IAU constellation boundaries where the Sun crosses the ecliptic (degrees).
// Includes Ophiuchus; values from standard IAU boundary tables.

const SUN_ECLIPTIC_BANDS: Array<{ min: number; max: number; code: string }> = [
  { min: 352.26, max: 360, code: "Psc" },
  { min: 0, max: 33.18, code: "Psc" },
  { min: 33.18, max: 51.16, code: "Ari" },
  { min: 51.16, max: 93.44, code: "Tau" },
  { min: 93.44, max: 118.12, code: "Gem" },
  { min: 118.12, max: 138.0, code: "Cnc" },
  { min: 138.0, max: 174.2, code: "Leo" },
  { min: 174.2, max: 217.9, code: "Vir" },
  { min: 217.9, max: 241.05, code: "Lib" },
  { min: 241.05, max: 248.15, code: "Sco" },
  { min: 248.15, max: 266.45, code: "Oph" },
  { min: 266.45, max: 299.45, code: "Sgr" },
  { min: 299.45, max: 326.3, code: "Cap" },
  { min: 326.3, max: 352.26, code: "Aqr" },
];

export function getConstellationFromEclipticLongitude(lambdaDeg: number): string {
  const lon = ((lambdaDeg % 360) + 360) % 360;
  for (const band of SUN_ECLIPTIC_BANDS) {
    if (lon >= band.min && lon < band.max) return band.code;
  }
  return "Psc";
}
