import * as THREE from "three";
import { SKY_RADIUS } from "./utils/astro";
import { disposeObject3D } from "./utils/dispose";

// Distant stars behind close-up / overview views. Sharper than the main
// sky glow but bright enough to actually see at different scales.

const backdropVertexShader = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uSizeScale;
  uniform float uDistanceFactor;
  attribute float starSize;
  attribute vec3 starColor;
  varying vec3 vColor;

  void main() {
    vColor = starColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float size = starSize * uPixelRatio * uSizeScale * (uDistanceFactor / max(-mvPosition.z, 1.0));
    gl_PointSize = max(1.5, size);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const backdropFragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    float core = 1.0 - smoothstep(0.0, 0.38, dist);

    // pull down the blue, let warm/pink spectral tones come through
    vec3 col = vColor;
    col.b *= 0.82;
    col.r = min(col.r + col.g * 0.05, 1.0);
    // faint cosmic purple in the mix — subtle, not neon
    col = mix(col, vec3(col.r * 0.95, col.g * 0.82, col.b * 0.95 + 0.06), 0.2);

    gl_FragColor = vec4(col * core * uOpacity, 1.0);
  }
`;

const PRESETS = {
  // planet close-up — camera is near the body
  closeup: { opacity: 0.48, sizeScale: 0.55, distanceFactor: 200 },
  // solar system overview — camera is far out, stars need more punch
  overview: { opacity: 0.7, sizeScale: 1.0, distanceFactor: 420 },
};

export function createSkyBackdrop(
  stars: THREE.Points,
  radius: number,
  mode: keyof typeof PRESETS = "closeup"
) {
  const group = new THREE.Group();
  const scale = radius / SKY_RADIUS;
  const preset = PRESETS[mode];
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5);

  const material = new THREE.ShaderMaterial({
    vertexShader: backdropVertexShader,
    fragmentShader: backdropFragmentShader,
    uniforms: {
      uOpacity: { value: preset.opacity },
      uPixelRatio: { value: pixelRatio },
      uSizeScale: { value: preset.sizeScale },
      uDistanceFactor: { value: preset.distanceFactor },
    },
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });

  const bgStars = new THREE.Points(stars.geometry, material);
  bgStars.scale.setScalar(scale);
  bgStars.renderOrder = -10;
  group.add(bgStars);

  return group;
}

export function disposeSkyBackdrop(group: THREE.Object3D) {
  disposeObject3D(group);
}
