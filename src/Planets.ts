import * as THREE from "three";
import gsap from "gsap";
import { planetposition, elliptic, moonposition, coord, nutation } from "astronomia";
import vsop87Bearth from "astronomia/data/vsop87Bearth";
import vsop87Bmercury from "astronomia/data/vsop87Bmercury";
import vsop87Bvenus from "astronomia/data/vsop87Bvenus";
import vsop87Bmars from "astronomia/data/vsop87Bmars";
import vsop87Bjupiter from "astronomia/data/vsop87Bjupiter";
import vsop87Bsaturn from "astronomia/data/vsop87Bsaturn";
import vsop87Buranus from "astronomia/data/vsop87Buranus";
import vsop87Bneptune from "astronomia/data/vsop87Bneptune";
import { raDecToPosition, SKY_RADIUS } from "./utils/astro";
import { getGlowTexture } from "./utils/glowTexture";
import {
  getJulianDay,
  isAboveHorizon,
  parseBirthMoment,
  type BirthContext,
} from "./utils/observer";
import {
  getDwarfPlanetEquatorial,
  type DwarfPlanetKey,
} from "./utils/dwarfPlanets";

const PLANET_INFO = [
  { name: "Mercury", data: vsop87Bmercury, color: 0xb5a89a, size: 4 },
  { name: "Venus", data: vsop87Bvenus, color: 0xf5e9c8, size: 7 },
  { name: "Mars", data: vsop87Bmars, color: 0xe27b58, size: 5 },
  { name: "Jupiter", data: vsop87Bjupiter, color: 0xd9b38c, size: 8 },
  { name: "Saturn", data: vsop87Bsaturn, color: 0xe8d9a0, size: 7 },
  { name: "Uranus", data: vsop87Buranus, color: 0x9fd6d9, size: 5 },
  { name: "Neptune", data: vsop87Bneptune, color: 0x6e8fe0, size: 5 },
];

const DWARF_PLANET_INFO: { key: DwarfPlanetKey; name: string; color: number; size: number }[] = [
  { key: "ceres", name: "Ceres", color: 0xa89880, size: 3 },
  { key: "pluto", name: "Pluto", color: 0xc4b4a4, size: 3 },
  { key: "eris", name: "Eris", color: 0xc8c0b8, size: 3 },
  { key: "haumea", name: "Haumea", color: 0xb0a090, size: 3 },
  { key: "makemake", name: "Makemake", color: 0x8a6848, size: 3 },
];

// planets sit a bit inside the star sphere so they never z-fight with stars
const PLANET_RADIUS = SKY_RADIUS * 0.92;

export class Planets {
  group = new THREE.Group();

  private labelContainer: HTMLElement;
  private labels: { element: HTMLDivElement; position: THREE.Vector3; name: string }[] = [];
  private fadeMaterials: (THREE.MeshBasicMaterial | THREE.SpriteMaterial)[] = [];
  private labelsVisible = false;

  constructor(labelContainer: HTMLElement) {
    this.labelContainer = labelContainer;
  }

  // Work out where each planet was in the sky on the given date and
  // drop a glowing sphere there.
  build(ctx: BirthContext) {
    const jde = getJulianDay(parseBirthMoment(ctx));

    const earth = new planetposition.Planet(vsop87Bearth);
    const glowTexture = getGlowTexture();

    for (const info of PLANET_INFO) {
      const planet = new planetposition.Planet(info.data);
      const planetCoord = elliptic.position(planet, earth, jde);
      const raHours = (planetCoord.ra / (Math.PI * 2)) * 24;
      const decDeg = THREE.MathUtils.radToDeg(planetCoord.dec);
      if (!isAboveHorizon(raHours, decDeg, ctx, jde)) continue;
      this.addBody(info.name, info.color, info.size, raHours, decDeg, glowTexture);
    }

    for (const info of DWARF_PLANET_INFO) {
      const dwarf = getDwarfPlanetEquatorial(info.key, jde);
      const raHours = (dwarf.ra / (Math.PI * 2)) * 24;
      const decDeg = THREE.MathUtils.radToDeg(dwarf.dec);
      if (!isAboveHorizon(raHours, decDeg, ctx, jde)) continue;
      this.addBody(info.name, info.color, info.size, raHours, decDeg, glowTexture);
    }

    const moonEcliptic = moonposition.position(jde);
    const obliquity = nutation.meanObliquity(jde);
    const moonEq = new coord.Ecliptic(moonEcliptic.lon, moonEcliptic.lat).toEquatorial(obliquity);
    const moonRa = (moonEq.ra / (Math.PI * 2)) * 24;
    const moonDec = THREE.MathUtils.radToDeg(moonEq.dec);
    if (isAboveHorizon(moonRa, moonDec, ctx, jde)) {
      this.addBody("Moon", 0xd8d8d8, 9, moonRa, moonDec, glowTexture);
    }
  }

  private addBody(
    name: string,
    color: number,
    size: number,
    raHours: number,
    decDeg: number,
    glowTexture: THREE.Texture
  ) {
    const position = raDecToPosition(raHours, decDeg, PLANET_RADIUS);

    const sphereMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), sphereMaterial);
    sphere.position.copy(position);
    this.group.add(sphere);
    this.fadeMaterials.push(sphereMaterial);

    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.setScalar(size * 8);
    glow.position.copy(position);
    this.group.add(glow);
    this.fadeMaterials.push(glowMaterial);

    // labels are plain DOM elements, repositioned every frame in update()
    const label = document.createElement("div");
    label.className = "planet-label";
    label.textContent = name;
    label.style.opacity = "0";
    this.labelContainer.appendChild(label);
    this.labels.push({ element: label, position, name });
  }

  // Which planet (if any) is near this screen position? Used for clicking
  // a planet in the sky to open its close-up view.
  pick(x: number, y: number, camera: THREE.PerspectiveCamera, maxPixels = 24): string | null {
    for (const { position, name } of this.labels) {
      const projected = position.clone().project(camera);
      if (projected.z > 1) continue;

      const screenX = ((projected.x + 1) / 2) * window.innerWidth;
      const screenY = ((1 - projected.y) / 2) * window.innerHeight;
      if (Math.hypot(screenX - x, screenY - y) < maxPixels) {
        return name;
      }
    }
    return null;
  }

  setLabelsVisible(visible: boolean) {
    this.labelsVisible = visible;
  }

  fadeIn(duration = 2) {
    this.labelsVisible = true;
    for (const material of this.fadeMaterials) {
      // glows look better when they don't go fully opaque
      const target = material instanceof THREE.SpriteMaterial ? 0.8 : 1;
      gsap.to(material, { opacity: target, duration });
    }
  }

  // project each planet into screen space and move its label there
  update(camera: THREE.PerspectiveCamera) {
    for (const { element, position } of this.labels) {
      const projected = position.clone().project(camera);
      const behindCamera = projected.z > 1;

      if (behindCamera || Math.abs(projected.x) > 1.1 || Math.abs(projected.y) > 1.1) {
        element.style.opacity = "0";
        element.style.left = "-9999px";
        continue;
      }

      const x = ((projected.x + 1) / 2) * window.innerWidth;
      const y = ((1 - projected.y) / 2) * window.innerHeight;
      element.style.left = `${x}px`;
      element.style.top = `${y + 14}px`; // sit just below the planet
      element.style.opacity = this.labelsVisible ? "1" : "0";
    }
  }
}
