import * as THREE from "three";
import type { RingInfo } from "../bodies";
import { loadTexture } from "./textureCache";

const textureCache = new Map<string, THREE.Texture>();
const TEXTURE_VERSION = 2;

function setRingUvs(geometry: THREE.BufferGeometry, inner: number, outer: number) {
  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const point = new THREE.Vector3();

  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i);
    const radius = point.length();
    const u = (radius - inner) / (outer - inner);
    const v = (Math.atan2(point.y, point.x) + Math.PI) / (Math.PI * 2);
    uvs.setXY(i, u, v);
  }
  uvs.needsUpdate = true;
}

function paintBand(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  inner: number,
  outer: number,
  color: string,
  alpha: number
) {
  const x0 = inner * width;
  const w = (outer - inner) * width;
  const gradient = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.15, color.replace("ALPHA", String(alpha * 0.35)));
  gradient.addColorStop(0.5, color.replace("ALPHA", String(alpha)));
  gradient.addColorStop(0.85, color.replace("ALPHA", String(alpha * 0.35)));
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x0, 0, w, height);
}

function createUranusRingTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 96;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, width, height);

  // Narrow dusty bands — epsilon is the brightest
  paintBand(ctx, width, height, 0.02, 0.18, "rgba(150, 155, 165, ALPHA)", 0.2);
  paintBand(ctx, width, height, 0.18, 0.32, "rgba(165, 170, 180, ALPHA)", 0.28);
  paintBand(ctx, width, height, 0.32, 0.48, "rgba(155, 160, 170, ALPHA)", 0.22);
  paintBand(ctx, width, height, 0.48, 0.62, "rgba(170, 175, 185, ALPHA)", 0.26);
  paintBand(ctx, width, height, 0.62, 0.78, "rgba(190, 175, 165, ALPHA)", 0.55);
  paintBand(ctx, width, height, 0.78, 0.92, "rgba(150, 155, 165, ALPHA)", 0.18);

  // Fine ice grain
  const image = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    image.data[i] = Math.min(255, image.data[i] + n);
    image.data[i + 1] = Math.min(255, image.data[i + 1] + n);
    image.data[i + 2] = Math.min(255, image.data[i + 2] + n);
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createNeptuneRingTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 96;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, width, height);

  // Adams, Le Verrier, Galle, Lassell, Arago — all very faint
  paintBand(ctx, width, height, 0.08, 0.22, "rgba(130, 145, 175, ALPHA)", 0.14);
  paintBand(ctx, width, height, 0.24, 0.38, "rgba(120, 135, 170, ALPHA)", 0.18);
  paintBand(ctx, width, height, 0.4, 0.52, "rgba(125, 140, 175, ALPHA)", 0.12);
  paintBand(ctx, width, height, 0.54, 0.66, "rgba(115, 130, 165, ALPHA)", 0.1);
  paintBand(ctx, width, height, 0.68, 0.82, "rgba(110, 125, 160, ALPHA)", 0.09);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function getRingTexture(ring: RingInfo): THREE.Texture {
  if (ring.texture) return loadTexture(ring.texture);

  const key = `${ring.kind ?? "generic"}-v${TEXTURE_VERSION}`;
  let texture = textureCache.get(key);
  if (!texture) {
    if (key === "uranus") texture = createUranusRingTexture();
    else if (key === "neptune") texture = createNeptuneRingTexture();
    else texture = createUranusRingTexture();
    textureCache.set(key, texture);
  }
  return texture;
}

function makeRingMaterial(
  ringMap: THREE.Texture,
  opacity: number,
  sunDirection: THREE.Vector3,
  arcStrength = 0
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      ringMap: { value: ringMap },
      opacity: { value: opacity },
      sunDirection: { value: sunDirection.clone().normalize() },
      arcStrength: { value: arcStrength },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldNormal;

      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D ringMap;
      uniform float opacity;
      uniform vec3 sunDirection;
      uniform float arcStrength;
      varying vec2 vUv;
      varying vec3 vWorldNormal;

      void main() {
        vec4 tex = texture2D(ringMap, vec2(vUv.x, 0.5));

        // Neptune's Adams ring has bright arcs covering part of the circle
        float angle = vUv.y * 6.2831853;
        float arcs = max(0.0, sin(angle * 3.0 + 0.8) * 0.55 + 0.45);
        arcs = mix(1.0, arcs * 1.8 + 0.15, arcStrength);

        float lit = max(dot(normalize(vWorldNormal), sunDirection), 0.0);
        vec3 color = tex.rgb * (lit * 0.9 + 0.12);
        float alpha = tex.a * opacity * arcs;

        if (alpha < 0.01) discard;
        gl_FragColor = vec4(color, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
}

function makeRingMesh(
  inner: number,
  outer: number,
  material: THREE.Material,
  thetaSegments = 256
): THREE.Mesh {
  const geometry = new THREE.RingGeometry(inner, outer, 128, thetaSegments);
  setRingUvs(geometry, inner, outer);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export function buildPlanetaryRings(
  ring: RingInfo,
  bodyRadius: number,
  sunDirection: THREE.Vector3
): THREE.Group {
  const group = new THREE.Group();
  const ringMap = getRingTexture(ring);
  const arcStrength = ring.kind === "neptune" ? 1 : 0;

  group.add(
    makeRingMesh(
      bodyRadius * ring.inner,
      bodyRadius * ring.outer,
      makeRingMaterial(ringMap, ring.opacity, sunDirection, arcStrength)
    )
  );

  // Saturn's faint inner C-ring and outer diffuse haze
  if (ring.kind === "saturn" || ring.texture) {
    const cRing = makeRingMesh(
      bodyRadius * 1.18,
      bodyRadius * 1.34,
      makeRingMaterial(ringMap, 0.22, sunDirection)
    );
    group.add(cRing);

    const outerHaze = makeRingMesh(
      bodyRadius * 2.35,
      bodyRadius * 2.55,
      makeRingMaterial(ringMap, 0.08, sunDirection)
    );
    group.add(outerHaze);
  }

  return group;
}

export function updateRingSunDirection(group: THREE.Object3D, sunDirection: THREE.Vector3) {
  const dir = sunDirection.clone().normalize();
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = child.material;
    if (!(material instanceof THREE.ShaderMaterial)) return;
    material.uniforms.sunDirection?.value.copy(dir);
  });
}
