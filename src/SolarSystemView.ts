import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { planetposition, moonposition } from "astronomia";
import vsop87Bmercury from "astronomia/data/vsop87Bmercury";
import vsop87Bvenus from "astronomia/data/vsop87Bvenus";
import vsop87Bearth from "astronomia/data/vsop87Bearth";
import vsop87Bmars from "astronomia/data/vsop87Bmars";
import vsop87Bjupiter from "astronomia/data/vsop87Bjupiter";
import vsop87Bsaturn from "astronomia/data/vsop87Bsaturn";
import vsop87Buranus from "astronomia/data/vsop87Buranus";
import vsop87Bneptune from "astronomia/data/vsop87Bneptune";
import { BODIES } from "./bodies";
import { createSkyBackdrop, disposeSkyBackdrop } from "./SkyBackdrop";
import { disposeObject3D } from "./utils/dispose";
import { getGlowTexture } from "./utils/glowTexture";
import { getSphere } from "./utils/geometryCache";
import { loadTexture } from "./utils/textureCache";
import { updateLabels } from "./utils/labels";
import { buildPlanetaryRings, updateRingSunDirection } from "./utils/planetaryRings";
import { getJulianDay, parseBirthMoment, type BirthContext } from "./utils/observer";
import {
  DWARF_PLANET_KEYS,
  getDwarfPlanetHeliocentric,
  getDwarfPlanetOrbitDays,
  type DwarfPlanetKey,
} from "./utils/dwarfPlanets";

// Distances are real (from VSOP87) but scaled so you can actually see everything.
// Sizes are exaggerated on purpose — at true scale every planet would be a dot.
const AU_KM = 149597870.7;
const AU_SCALE = 14; // scene units per astronomical unit
const BACKDROP_RADIUS = 800;
/** One real second advances the ephemeris by one real second (86400 s = 1 day). */
const SECONDS_PER_DAY = 86_400;

const DWARF_PLANETS: {
  key: DwarfPlanetKey;
  size: number;
  glow: number;
}[] = [
  { key: "ceres", size: 0.28, glow: 0xa89880 },
  { key: "pluto", size: 0.32, glow: 0xd4c4b4 },
  { key: "eris", size: 0.3, glow: 0xd0c8c0 },
  { key: "haumea", size: 0.24, glow: 0xb8a898 },
  { key: "makemake", size: 0.26, glow: 0x8a6a50 },
];

const PLANETS = [
  { key: "mercury", data: vsop87Bmercury, size: 0.45, glow: 0xb5a89a, periodDays: 87.97 },
  { key: "venus", data: vsop87Bvenus, size: 0.6, glow: 0xf5e9c8, periodDays: 224.7 },
  { key: "earth", data: vsop87Bearth, size: 0.62, glow: 0x88bbee, periodDays: 365.25 },
  { key: "mars", data: vsop87Bmars, size: 0.5, glow: 0xe27b58, periodDays: 686.98 },
  { key: "jupiter", data: vsop87Bjupiter, size: 1.5, glow: 0xd9b38c, periodDays: 4332.59 },
  { key: "saturn", data: vsop87Bsaturn, size: 1.25, glow: 0xe8d9a0, periodDays: 10759.22 },
  { key: "uranus", data: vsop87Buranus, size: 0.85, glow: 0x9fd6d9, periodDays: 30688.5 },
  { key: "neptune", data: vsop87Bneptune, size: 0.8, glow: 0x6e8fe0, periodDays: 60182 },
] as const;

const MOON_PERIOD_DAYS = 27.32;

// astronomia ships without types — VSOP87 heliocentric ephemeris instance
type VsopPlanet = {
  position: (jde: number) => { lon: number; lat: number; range: number };
};

interface AnimatedBody {
  key: string;
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  saturnRing?: THREE.Group;
  planet?: VsopPlanet;
}

function eclipticToPosition(lon: number, lat: number, rangeAu: number): THREE.Vector3 {
  const r = rangeAu * AU_SCALE;
  return new THREE.Vector3(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    -r * Math.cos(lat) * Math.sin(lon)
  );
}

function heliocentricAt(engine: VsopPlanet, jde: number): THREE.Vector3 {
  const pos = engine.position(jde);
  return eclipticToPosition(pos.lon, pos.lat, pos.range);
}

function dwarfPlanetHeliocentricAt(key: DwarfPlanetKey, jde: number): THREE.Vector3 {
  const pos = getDwarfPlanetHeliocentric(key, jde);
  return eclipticToPosition(pos.lon, pos.lat, pos.range);
}

function isDwarfPlanetKey(key: string): key is DwarfPlanetKey {
  return (DWARF_PLANET_KEYS as readonly string[]).includes(key);
}

export class SolarSystemView {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  active = false;

  private bodiesGroup = new THREE.Group();
  private orbitsGroup = new THREE.Group();
  private orbitsVisible = true;
  private backdropVisible = true;
  private readonly pickProjected = new THREE.Vector3();
  private readonly pickWorld = new THREE.Vector3();
  private spinners: { mesh: THREE.Mesh; speed: number }[] = [];
  private labels: { element: HTMLDivElement; object: THREE.Object3D; key: string }[] = [];
  private labelData: { object: THREE.Object3D; key: string; displayName: string }[] = [];
  private labelContainer: HTMLElement;
  private skyBackdrop = new THREE.Group();
  private constellationGroup: THREE.Group | null = null;
  private sunLight: THREE.PointLight;
  private labelsVisible = true;
  private enterTween: gsap.core.Tween | null = null;
  private asteroidBelt: THREE.Points | null = null;

  private epochJde = 0;
  private simDays = 0;
  private bodies: AnimatedBody[] = [];
  private planetEngines = new Map<string, VsopPlanet>();
  private readonly scratchEarth = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement, labelContainer: HTMLElement) {
    this.labelContainer = labelContainer;

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );
    this.camera.position.set(0, 70, 110);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 650;
    this.controls.enabled = false;

    this.scene.add(new THREE.AmbientLight(0x252535, 0.55));
    this.sunLight = new THREE.PointLight(0xfff0d8, 4, 1200);
    this.scene.add(this.sunLight);
    this.scene.add(this.bodiesGroup);
    this.scene.add(this.orbitsGroup);
    this.scene.add(this.skyBackdrop);
  }

  setSkyBackdrop(stars: THREE.Points) {
    while (this.skyBackdrop.children.length > 0) {
      const child = this.skyBackdrop.children[0];
      disposeSkyBackdrop(child);
      this.skyBackdrop.remove(child);
    }
    this.constellationGroup = null;
    this.skyBackdrop.add(createSkyBackdrop(stars, BACKDROP_RADIUS, "overview"));
  }

  setConstellations(group: THREE.Group) {
    if (this.constellationGroup) {
      disposeObject3D(this.constellationGroup);
      this.skyBackdrop.remove(this.constellationGroup);
    }
    this.constellationGroup = group;
    this.skyBackdrop.add(group);
  }

  getConstellationGroup(): THREE.Group | null {
    return this.constellationGroup;
  }

  setLabelsVisible(visible: boolean) {
    this.labelsVisible = visible;
    if (!visible) {
      for (const { element } of this.labels) element.style.opacity = "0";
    }
  }

  setOrbitsVisible(visible: boolean) {
    this.orbitsVisible = visible;
    this.orbitsGroup.visible = visible;
  }

  get orbitsShowing(): boolean {
    return this.orbitsVisible;
  }

  setBackdropVisible(visible: boolean) {
    this.backdropVisible = visible;
    this.skyBackdrop.visible = visible;
  }

  get backdropShowing(): boolean {
    return this.backdropVisible;
  }

  build(ctx: BirthContext) {
    this.clear();
    this.epochJde = getJulianDay(parseBirthMoment(ctx));
    this.simDays = 0;

    for (const planet of PLANETS) {
      if ("data" in planet && planet.data) {
        this.planetEngines.set(planet.key, new planetposition.Planet(planet.data));
      }
    }

    this.addSun();
    this.addOrbitPaths(this.epochJde);
    this.asteroidBelt = this.buildAsteroidBelt();
    this.orbitsGroup.add(this.asteroidBelt);

    for (const planet of PLANETS) {
      const engine = this.planetEngines.get(planet.key);
      this.bodies.push(
        this.addBody(planet.key, planet.size, planet.glow, engine)
      );
    }

    for (const dwarf of DWARF_PLANETS) {
      this.bodies.push(this.addBody(dwarf.key, dwarf.size, dwarf.glow));
    }

    this.bodies.push(this.addBody("moon", 0.22, 0xd8d8d8));
    this.updatePositions(this.epochJde);
  }

  show() {
    this.enterTween?.kill();
    this.active = true;
    this.simDays = 0;
    this.controls.enabled = false;
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(0, 130, 190);
    this.updatePositions(this.epochJde);
    this.mountLabels();

    this.enterTween = gsap.to(this.camera.position, {
      x: 0,
      y: 70,
      z: 110,
      duration: 1.15,
      ease: "power2.out",
      onComplete: () => {
        this.controls.enabled = true;
        this.enterTween = null;
      },
    });
  }

  hide() {
    this.enterTween?.kill();
    this.enterTween = null;
    this.active = false;
    this.controls.enabled = false;
    this.removeLabels();
  }

  update(dt: number) {
    for (const { mesh, speed } of this.spinners) {
      mesh.rotation.y += speed * dt;
    }

    this.simDays += dt / SECONDS_PER_DAY;
    this.updatePositions(this.epochJde + this.simDays);

    this.controls.update();

    const bodies: THREE.Mesh[] = [];
    this.bodiesGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isBody) bodies.push(child);
    });
    if (this.labelsVisible) {
      const sunOnly = bodies.filter((mesh) => mesh.userData.isSun);
      updateLabels(this.camera, this.labels, sunOnly);
    } else {
      for (const { element } of this.labels) element.style.opacity = "0";
    }
  }

  pick(x: number, y: number, maxPixels = 20): string | null {
    for (const { object, key } of this.labels) {
      object.getWorldPosition(this.pickWorld);
      this.pickProjected.copy(this.pickWorld).project(this.camera);
      if (this.pickProjected.z > 1) continue;

      const screenX = ((this.pickProjected.x + 1) / 2) * window.innerWidth;
      const screenY = ((1 - this.pickProjected.y) / 2) * window.innerHeight;
      if (Math.hypot(screenX - x, screenY - y) < maxPixels) return key;
    }
    return null;
  }

  private updatePositions(jde: number) {
    const earthEngine = this.planetEngines.get("earth");

    for (const body of this.bodies) {
      if (body.key === "moon") continue;

      const position = isDwarfPlanetKey(body.key)
        ? dwarfPlanetHeliocentricAt(body.key, jde)
        : body.planet
          ? heliocentricAt(body.planet, jde)
          : null;
      if (!position) continue;

      body.mesh.position.copy(position);
      body.glow.position.copy(position);
      if (body.saturnRing) {
        updateRingSunDirection(body.saturnRing, position.clone().negate());
      }

      if (body.key === "earth") this.scratchEarth.copy(position);
    }

    const moon = this.bodies.find((body) => body.key === "moon");
    if (moon && earthEngine) {
      if (this.scratchEarth.lengthSq() === 0) {
        this.scratchEarth.copy(heliocentricAt(earthEngine, jde));
      }
      const moonGeo = moonposition.position(jde);
      const moonOffset = eclipticToPosition(
        moonGeo.lon,
        moonGeo.lat,
        moonGeo.range / AU_KM
      );
      moon.mesh.position.copy(this.scratchEarth).add(moonOffset);
      moon.glow.position.copy(moon.mesh.position);
    }
  }

  private addSun() {
    const info = BODIES.sun;
    const sun = new THREE.Mesh(
      getSphere(2.8, 32, 32),
      new THREE.MeshBasicMaterial({ map: loadTexture(info.texture) })
    );
    sun.userData.isBody = true;
    sun.userData.isSun = true;
    this.bodiesGroup.add(sun);
    this.spinners.push({ mesh: sun, speed: info.spinSpeed });
    this.registerLabel(sun, "sun", "Sun");
    this.bodiesGroup.add(this.makeGlowSprite(2.2 * 5, 0xffcc66));
  }

  private addBody(
    key: string,
    size: number,
    glowColor: number,
    planet?: VsopPlanet
  ): AnimatedBody {
    const info = BODIES[key];
    const mesh = new THREE.Mesh(
      getSphere(size, 24, 24),
      new THREE.MeshBasicMaterial({ map: loadTexture(info.texture) })
    );
    mesh.userData.isBody = true;
    if (info.ellipsoid) mesh.scale.set(...info.ellipsoid);
    mesh.rotation.z = THREE.MathUtils.degToRad(info.tilt);
    this.bodiesGroup.add(mesh);
    this.spinners.push({ mesh, speed: info.spinSpeed });

    const glow = this.makeGlowSprite(size * 3.5, glowColor);
    this.bodiesGroup.add(glow);

    let saturnRing: THREE.Group | undefined;
    if (info.ring) {
      saturnRing = buildPlanetaryRings(info.ring, size, new THREE.Vector3(1, 0, 0));
      mesh.add(saturnRing);
    }

    this.registerLabel(mesh, key, info.name);

    return { key, mesh, glow, saturnRing, planet };
  }

  private addOrbitPaths(epochJde: number) {
    for (const planet of PLANETS) {
      const engine = this.planetEngines.get(planet.key)!;
      this.orbitsGroup.add(
        this.buildOrbitLine(engine, planet.periodDays, epochJde, 0x7788aa, 0.38)
      );
    }

    for (const dwarf of DWARF_PLANETS) {
      const periodDays = getDwarfPlanetOrbitDays(dwarf.key);
      this.orbitsGroup.add(
        this.buildDwarfPlanetOrbitLine(dwarf.key, epochJde, periodDays, 0x998877, 0.28)
      );
    }

    this.orbitsGroup.add(this.buildMoonOrbitLine(epochJde));
  }

  private buildDwarfPlanetOrbitLine(
    key: DwarfPlanetKey,
    epochJde: number,
    periodDays: number,
    color: number,
    opacity: number
  ): THREE.Line {
    const samples = Math.min(180, Math.max(72, Math.round(periodDays / 40)));
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= samples; i++) {
      const dayOffset = (i / samples) * periodDays;
      points.push(dwarfPlanetHeliocentricAt(key, epochJde + dayOffset));
    }

    return this.buildOrbitLineFromPoints(points, color, opacity);
  }

  private buildAsteroidBelt(): THREE.Points {
    const innerAu = 2.2;
    const outerAu = 3.3;
    const count = 4200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radiusAu = innerAu + Math.random() * (outerAu - innerAu);
      const angle = Math.random() * Math.PI * 2;
      const lat = (Math.random() - 0.5) * 0.18;
      const pos = eclipticToPosition(angle, lat, radiusAu);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const shade = 0.45 + Math.random() * 0.35;
      colors[i * 3] = shade * 0.72;
      colors[i * 3 + 1] = shade * 0.66;
      colors[i * 3 + 2] = shade * 0.58;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const belt = new THREE.Points(geometry, material);
    belt.frustumCulled = false;
    return belt;
  }

  private buildOrbitLine(
    engine: VsopPlanet,
    periodDays: number,
    epochJde: number,
    color: number,
    opacity: number
  ): THREE.Line {
    const samples = Math.min(240, Math.max(72, Math.round(periodDays / 2.5)));
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= samples; i++) {
      const dayOffset = (i / samples) * periodDays;
      points.push(heliocentricAt(engine, epochJde + dayOffset));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    return line;
  }

  private buildMoonOrbitLine(epochJde: number): THREE.Line {
    const earth = this.planetEngines.get("earth")!;
    const samples = 120;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= samples; i++) {
      const dayOffset = (i / samples) * MOON_PERIOD_DAYS;
      const jde = epochJde + dayOffset;
      const earthPos = heliocentricAt(earth, jde);
      const moonGeo = moonposition.position(jde);
      const moonOffset = eclipticToPosition(
        moonGeo.lon,
        moonGeo.lat,
        moonGeo.range / AU_KM
      );
      points.push(earthPos.clone().add(moonOffset));
    }

    return this.buildOrbitLineFromPoints(points, 0x667788, 0.28);
  }

  private buildOrbitLineFromPoints(
    points: THREE.Vector3[],
    color: number,
    opacity: number
  ): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    return line;
  }

  private registerLabel(object: THREE.Object3D, key: string, displayName: string) {
    this.labelData.push({ object, key, displayName });
  }

  private mountLabels() {
    this.removeLabels();
    for (const data of this.labelData) {
      const label = document.createElement("div");
      label.className = "planet-label";
      label.textContent = data.displayName;
      label.style.opacity = "0";
      this.labelContainer.appendChild(label);
      this.labels.push({ element: label, object: data.object, key: data.key });
    }
  }

  private removeLabels() {
    for (const { element } of this.labels) element.remove();
    this.labels = [];
  }

  private makeGlowSprite(size: number, color: number) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: getGlowTexture(),
        color,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sprite.scale.setScalar(size);
    return sprite;
  }

  private clear() {
    disposeObject3D(this.bodiesGroup);
    this.bodiesGroup.clear();
    disposeObject3D(this.orbitsGroup);
    this.orbitsGroup.clear();
    this.orbitsVisible = true;
    this.orbitsGroup.visible = true;
    this.spinners = [];
    this.bodies = [];
    this.planetEngines.clear();
    this.epochJde = 0;
    this.simDays = 0;
    this.removeLabels();
    this.asteroidBelt = null;
  }
}
