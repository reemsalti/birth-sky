import * as THREE from "three";
import gsap from "gsap";
import { raDecToPosition, SKY_RADIUS } from "./utils/astro";

// lines sit just inside the star sphere
const LINE_RADIUS = SKY_RADIUS * 0.99;

const DIM_OPACITY = 0.28;
const HIGHLIGHT_OPACITY = 0.9;

const DIM_COLOR = new THREE.Color(0x6688bb);
const HIGHLIGHT_COLOR = new THREE.Color(0xbbddff);

// 3-letter IAU codes -> full names, for tooltips and the info panel
export const CONSTELLATION_NAMES: Record<string, string> = {
  And: "Andromeda", Ant: "Antlia", Aps: "Apus", Aql: "Aquila", Aqr: "Aquarius",
  Ara: "Ara", Ari: "Aries", Aur: "Auriga", Boo: "Boötes", Cae: "Caelum",
  Cam: "Camelopardalis", Cap: "Capricornus", Car: "Carina", Cas: "Cassiopeia",
  Cen: "Centaurus", Cep: "Cepheus", Cet: "Cetus", Cha: "Chamaeleon",
  Cir: "Circinus", CMa: "Canis Major", CMi: "Canis Minor", Cnc: "Cancer",
  Col: "Columba", Com: "Coma Berenices", CrA: "Corona Australis",
  CrB: "Corona Borealis", Crt: "Crater", Cru: "Crux", Crv: "Corvus",
  CVn: "Canes Venatici", Cyg: "Cygnus", Del: "Delphinus", Dor: "Dorado",
  Dra: "Draco", Equ: "Equuleus", Eri: "Eridanus", For: "Fornax",
  Gem: "Gemini", Gru: "Grus", Her: "Hercules", Hor: "Horologium",
  Hya: "Hydra", Hyi: "Hydrus", Ind: "Indus", Lac: "Lacerta", Leo: "Leo",
  Lep: "Lepus", Lib: "Libra", LMi: "Leo Minor", Lup: "Lupus", Lyn: "Lynx",
  Lyr: "Lyra", Men: "Mensa", Mic: "Microscopium", Mon: "Monoceros",
  Mus: "Musca", Nor: "Norma", Oct: "Octans", Oph: "Ophiuchus", Ori: "Orion",
  Pav: "Pavo", Peg: "Pegasus", Per: "Perseus", Phe: "Phoenix", Pic: "Pictor",
  PsA: "Piscis Austrinus", Psc: "Pisces", Pup: "Puppis", Pyx: "Pyxis",
  Ret: "Reticulum", Scl: "Sculptor", Sco: "Scorpius", Sct: "Scutum",
  Ser: "Serpens", Sex: "Sextans", Sge: "Sagitta", Sgr: "Sagittarius",
  Tau: "Taurus", Tel: "Telescopium", TrA: "Triangulum Australe",
  Tri: "Triangulum", Tuc: "Tucana", UMa: "Ursa Major", UMi: "Ursa Minor",
  Vel: "Vela", Vir: "Virgo", Vol: "Volans", Vul: "Vulpecula",
};

// The line data is GeoJSON from d3-celestial. Each feature is one
// constellation, coordinates are [lon, lat] pairs in degrees where
// lon is right ascension in the -180..180 range.
interface ConstellationFeature {
  id: string;
  geometry: {
    coordinates: number[][][]; // MultiLineString
  };
}

export class Constellations {
  group = new THREE.Group();

  private materials = new Map<string, THREE.LineBasicMaterial>();
  private centers = new Map<string, THREE.Vector3>();
  private backdropGroup: THREE.Group | null = null;
  private birthCode: string | null = null;
  private showAllLines = true;
  private showBirthLines = true;

  async load() {
    const response = await fetch("/data/constellations.lines.json");
    const json = await response.json();
    const features: ConstellationFeature[] = json.features;

    for (const feature of features) {
      const segmentPoints: THREE.Vector3[] = [];
      const allPoints: THREE.Vector3[] = [];

      for (const line of feature.geometry.coordinates) {
        for (let i = 0; i < line.length; i++) {
          const [lon, lat] = line[i];
          // convert lon back to RA hours (handle the negative half)
          const raHours = ((lon + 360) % 360) / 15;
          const point = raDecToPosition(raHours, lat, LINE_RADIUS);
          allPoints.push(point);

          // LineSegments wants pairs, so every point except the ends goes in twice
          if (i > 0) segmentPoints.push(allPoints[allPoints.length - 2], point);
        }
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(segmentPoints);
      geometry.userData.shared = true;
      const material = new THREE.LineBasicMaterial({
        color: DIM_COLOR.clone(),
        transparent: true,
        opacity: 0, // faded in later
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const lines = new THREE.LineSegments(geometry, material);
      lines.userData.constellationCode = feature.id;
      this.group.add(lines);
      this.materials.set(feature.id, material);

      // rough center of the constellation, used to aim the camera at it
      const center = new THREE.Vector3();
      for (const p of allPoints) center.add(p);
      center.divideScalar(allPoints.length);
      this.centers.set(feature.id, center);
    }
  }

  fadeIn(duration = 2) {
    for (const material of this.materials.values()) {
      gsap.killTweensOf(material);
      material.opacity = 0;
    }
    this.refreshDisplay(true, duration);
  }

  setBackdropGroup(group: THREE.Group | null) {
    this.backdropGroup = group;
    this.refreshDisplay(false);
  }

  setAllLinesVisible(visible: boolean) {
    this.showAllLines = visible;
    this.refreshDisplay();
  }

  setBirthLinesVisible(visible: boolean) {
    this.showBirthLines = visible;
    this.refreshDisplay();
  }

  get allLinesVisible() {
    return this.showAllLines;
  }

  get birthLinesVisible() {
    return this.showBirthLines;
  }

  private refreshDisplay(animate = true, duration = 0.35) {
    this.applyToGroup(this.group, animate, duration);
    if (this.backdropGroup) this.applyToGroup(this.backdropGroup, animate, duration);
  }

  private applyToGroup(group: THREE.Group, animate: boolean, duration = 0.35) {
    group.traverse((child) => {
      if (!(child instanceof THREE.LineSegments)) return;
      const code = child.userData.constellationCode as string;
      const material = child.material as THREE.LineBasicMaterial;
      const targetOpacity = this.opacityForCode(code);
      const targetColor = this.colorForCode(code);

      gsap.killTweensOf(material);
      gsap.killTweensOf(material.color);
      if (animate) {
        gsap.to(material, {
          opacity: targetOpacity,
          duration,
          ease: "power1.out",
        });
        gsap.to(material.color, {
          r: targetColor.r,
          g: targetColor.g,
          b: targetColor.b,
          duration,
          ease: "power1.out",
        });
      } else {
        material.opacity = targetOpacity;
        material.color.copy(targetColor);
      }
    });
  }

  private opacityForCode(code: string): number {
    const isBirth = code === this.birthCode;

    if (!this.showAllLines && !this.showBirthLines) return 0;
    if (!this.showAllLines && this.showBirthLines) return isBirth ? HIGHLIGHT_OPACITY : 0;
    if (this.showAllLines && !this.showBirthLines && isBirth) return 0;
    if (this.showAllLines && this.showBirthLines && isBirth) return HIGHLIGHT_OPACITY;
    return DIM_OPACITY;
  }

  private colorForCode(code: string): THREE.Color {
    const isBirth = code === this.birthCode;
    const highlighted =
      isBirth &&
      this.showBirthLines &&
      (this.showAllLines || (!this.showAllLines && this.showBirthLines));
    return highlighted ? HIGHLIGHT_COLOR : DIM_COLOR;
  }

  // Backdrop copy reuses line geometries instead of deep-cloning them.
  createBackdropGroup(radius: number): THREE.Group {
    const group = new THREE.Group();
    group.scale.setScalar((radius * 0.99) / SKY_RADIUS);

    for (const child of this.group.children) {
      if (!(child instanceof THREE.LineSegments)) continue;
      const material = new THREE.LineBasicMaterial({
        color: DIM_COLOR,
        transparent: true,
        opacity: DIM_OPACITY,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const lines = new THREE.LineSegments(child.geometry, material);
      lines.userData.constellationCode = child.userData.constellationCode;
      group.add(lines);
    }

    return group;
  }

  // Returns the constellation center as RA/dec so the camera can drift over to it.
  highlight(code: string): { raHours: number; decDeg: number } | null {
    const center = this.centers.get(code);
    if (!center) {
      console.warn("no constellation found for code:", code);
      return null;
    }

    this.birthCode = code;
    this.refreshDisplay(false);

    // turn the center point back into sky coordinates
    const normalized = center.clone().normalize();
    const decDeg = THREE.MathUtils.radToDeg(Math.asin(normalized.y));
    let ra = Math.atan2(-normalized.z, normalized.x);
    if (ra < 0) ra += Math.PI * 2;
    const raHours = (ra / (Math.PI * 2)) * 24;

    return { raHours, decDeg };
  }
}
