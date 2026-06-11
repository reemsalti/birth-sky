import * as THREE from "three";
import { raDecToPosition } from "./utils/astro";

interface StarRecord {
  index: number;
  name: string;
  con: string;
  mag: number;
  spect: string;
  distLy: number;
}

const vertexShader = /* glsl */ `
  uniform float uPixelRatio;
  attribute float starSize;
  attribute vec3 starColor;
  varying vec3 vColor;

  void main() {
    vColor = starColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pointSize = starSize * uPixelRatio * (500.0 / -mvPosition.z);
    gl_PointSize = min(pointSize, 48.0 * uPixelRatio);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    float glow = smoothstep(0.5, 0.0, dist);
    glow = pow(glow, 1.4);

    vec3 col = vColor;
    col.b *= 0.86;
    col.r = min(col.r + col.g * 0.04, 1.0);

    gl_FragColor = vec4(col * glow * uOpacity, 1.0);
  }
`;

type StarTuple = [number, number, number, number, number, number];

export class StarMap {
  points: THREE.Points | null = null;
  pickableStars: StarRecord[] = [];
  private material: THREE.ShaderMaterial;
  private positions: THREE.BufferAttribute | null = null;
  private readonly projected = new THREE.Vector3();
  private readonly worldPos = new THREE.Vector3();

  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uOpacity: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
      },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });
  }

  async load(): Promise<THREE.Points> {
    const response = await fetch("/data/stars.json");
    const { stars, pickable } = (await response.json()) as {
      stars: StarTuple[];
      pickable: Array<{
        i: number;
        name: string;
        con: string;
        mag: number;
        spect: string;
        distLy: number;
      }>;
    };

    const count = stars.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const [ra, dec, size, r, g, b] = stars[i];
      const pos = raDecToPosition(ra, dec);
      const base = i * 3;
      positions[base] = pos.x;
      positions[base + 1] = pos.y;
      positions[base + 2] = pos.z;
      colors[base] = r;
      colors[base + 1] = g;
      colors[base + 2] = b;
      sizes[i] = size;
    }

    this.pickableStars = pickable.map((star) => ({
      index: star.i,
      name: star.name,
      con: star.con,
      mag: star.mag,
      spect: star.spect,
      distLy: star.distLy,
    }));

    const geometry = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute("position", this.positions);
    geometry.setAttribute("starColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("starSize", new THREE.BufferAttribute(sizes, 1));
    geometry.userData.shared = true;

    this.points = new THREE.Points(geometry, this.material);
    return this.points;
  }

  findStarAtScreen(
    x: number,
    y: number,
    camera: THREE.PerspectiveCamera,
    maxPixels = 14
  ): StarRecord | null {
    if (!this.positions) return null;

    let closest: StarRecord | null = null;
    let closestDist = maxPixels;
    const pos = this.positions.array as Float32Array;

    for (const star of this.pickableStars) {
      const base = star.index * 3;
      this.worldPos.set(pos[base], pos[base + 1], pos[base + 2]);
      this.projected.copy(this.worldPos).project(camera);
      if (this.projected.z > 1) continue;

      const screenX = ((this.projected.x + 1) / 2) * window.innerWidth;
      const screenY = ((1 - this.projected.y) / 2) * window.innerHeight;
      const dist = Math.hypot(screenX - x, screenY - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = star;
      }
    }
    return closest;
  }

  get opacity(): number {
    return this.material.uniforms.uOpacity.value as number;
  }

  set opacity(value: number) {
    this.material.uniforms.uOpacity.value = value;
  }
}
