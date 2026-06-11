import * as THREE from "three";

const spheres = new Map<string, THREE.SphereGeometry>();

function markShared(geometry: THREE.BufferGeometry) {
  geometry.userData.shared = true;
}

export function getSphere(radius: number, width = 48, height = 48): THREE.SphereGeometry {
  const key = `${radius}:${width}:${height}`;
  let geometry = spheres.get(key);
  if (!geometry) {
    geometry = new THREE.SphereGeometry(radius, width, height);
    markShared(geometry);
    spheres.set(key, geometry);
  }
  return geometry;
}
