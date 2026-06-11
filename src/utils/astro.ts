import * as THREE from "three";

// Everything in the scene lives on (or near) a big imaginary sphere
// around the camera, like a planetarium dome.
export const SKY_RADIUS = 900;

// Unix epoch (Jan 1 1970) in Julian days. Makes the conversion a one-liner.
const JULIAN_UNIX_EPOCH = 2440587.5;

export function dateToJulianDay(date: Date): number {
  return date.getTime() / 86400000 + JULIAN_UNIX_EPOCH;
}

// Convert right ascension (in hours, 0-24) and declination (in degrees)
// to a 3D point on the sky sphere. Y is up, so declination maps to height.
export function raDecToPosition(
  raHours: number,
  decDeg: number,
  radius = SKY_RADIUS
): THREE.Vector3 {
  const ra = (raHours / 24) * Math.PI * 2;
  const dec = THREE.MathUtils.degToRad(decDeg);

  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    -radius * Math.cos(dec) * Math.sin(ra)
  );
}

