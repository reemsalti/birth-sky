import * as THREE from "three";

export interface LabelEntry {
  element: HTMLElement;
  object: THREE.Object3D;
}

const worldPos = new THREE.Vector3();
const projected = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const rayDir = new THREE.Vector3();

interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Places labels in screen space but hides them when something is in the
// way, or when they'd stack on top of another label.
// Only pass actual body meshes as occluders — not orbit rings or planes.
export function updateLabels(
  camera: THREE.PerspectiveCamera,
  labels: LabelEntry[],
  occluders: THREE.Object3D[]
) {
  const meshes: THREE.Mesh[] = [];
  for (const obj of occluders) {
    if (obj instanceof THREE.Mesh) meshes.push(obj);
  }

  type Candidate = {
    entry: LabelEntry;
    x: number;
    y: number;
    depth: number;
    rect: ScreenRect;
  };

  const candidates: Candidate[] = [];

  for (const entry of labels) {
    entry.object.getWorldPosition(worldPos);
    projected.copy(worldPos).project(camera);

    if (projected.z > 1 || Math.abs(projected.x) > 1.15 || Math.abs(projected.y) > 1.15) {
      entry.element.style.opacity = "0";
      entry.element.style.left = "-9999px";
      continue;
    }

    const targetDist = camera.position.distanceTo(worldPos);
    rayDir.copy(worldPos).sub(camera.position).normalize();
    raycaster.set(camera.position, rayDir);
    const hits = raycaster.intersectObjects(meshes, false);

    // something closer than the labeled object is blocking the view
    if (hits.length > 0 && hits[0].distance < targetDist - 0.05) {
      entry.element.style.opacity = "0";
      entry.element.style.left = "-9999px";
      continue;
    }

    const x = ((projected.x + 1) / 2) * window.innerWidth;
    const y = ((1 - projected.y) / 2) * window.innerHeight + 10;
    const halfW = Math.max(entry.element.offsetWidth, 40) / 2;

    candidates.push({
      entry,
      x,
      y,
      depth: projected.z,
      rect: { left: x - halfW, top: y, right: x + halfW, bottom: y + 16 },
    });
  }

  // nearer objects get label priority
  candidates.sort((a, b) => a.depth - b.depth);

  const placed: ScreenRect[] = [];
  const pad = 6;

  for (const c of candidates) {
    const overlaps = placed.some(
      (p) =>
        c.rect.left - pad < p.right &&
        c.rect.right + pad > p.left &&
        c.rect.top - pad < p.bottom &&
        c.rect.bottom + pad > p.top
    );

    if (overlaps) {
      c.entry.element.style.opacity = "0";
      c.entry.element.style.left = "-9999px";
      continue;
    }

    placed.push(c.rect);
    c.entry.element.style.left = `${c.x}px`;
    c.entry.element.style.top = `${c.y}px`;
    c.entry.element.style.opacity = "1";
  }
}
