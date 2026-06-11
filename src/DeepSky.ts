import * as THREE from "three";
import gsap from "gsap";
import { DEEP_SKY_CATALOG, type DeepSkyObject } from "./data/deepSkyCatalog";
import { raDecToPosition, SKY_RADIUS } from "./utils/astro";
import { getNebulaTexture } from "./utils/nebulaTextures";

const DEEP_SKY_RADIUS = SKY_RADIUS * 0.996;
const DEG_PER_ARCMIN = Math.PI / 180 / 60;

const TYPE_DISPLAY: Record<
  DeepSkyObject["type"],
  { minArcmin: number; scale: number; opacityMul: number }
> = {
  emission: { minArcmin: 16, scale: 1.5, opacityMul: 1.2 },
  reflection: { minArcmin: 14, scale: 1.6, opacityMul: 1.28 },
  planetary: { minArcmin: 7, scale: 4.2, opacityMul: 1.35 },
  supernova_remnant: { minArcmin: 32, scale: 2.8, opacityMul: 1.5 },
};

export class DeepSky {
  group = new THREE.Group();
  private materials: THREE.SpriteMaterial[] = [];
  private sprites: THREE.Sprite[] = [];
  private readonly projected = new THREE.Vector3();
  private readonly worldPos = new THREE.Vector3();

  build() {
    for (const object of DEEP_SKY_CATALOG) {
      const display = TYPE_DISPLAY[object.type];
      const texture = getNebulaTexture(object);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      });
      if (object.tint) material.color.set(object.tint);
      this.materials.push(material);

      const sprite = new THREE.Sprite(material);
      sprite.frustumCulled = false;
      sprite.position.copy(
        raDecToPosition(object.raHours, object.decDeg, DEEP_SKY_RADIUS)
      );
      sprite.userData.peakOpacity = Math.min(
        object.peakOpacity * display.opacityMul,
        0.98
      );
      sprite.userData.object = object;
      sprite.renderOrder = 3;

      const widthArcmin = Math.max(
        object.widthArcmin * display.scale,
        display.minArcmin
      );
      const heightArcmin = Math.max(
        object.heightArcmin * display.scale,
        display.minArcmin * 0.85
      );
      const widthRad = widthArcmin * DEG_PER_ARCMIN;
      const heightRad = heightArcmin * DEG_PER_ARCMIN;
      sprite.scale.set(
        DEEP_SKY_RADIUS * widthRad,
        DEEP_SKY_RADIUS * heightRad,
        1
      );

      this.sprites.push(sprite);
      this.group.add(sprite);
    }
  }

  findAtScreen(
    x: number,
    y: number,
    camera: THREE.PerspectiveCamera
  ): DeepSkyObject | null {
    let closest: DeepSkyObject | null = null;
    let closestDist = Infinity;
    const fovRad = THREE.MathUtils.degToRad(camera.fov);

    for (const sprite of this.sprites) {
      const material = sprite.material as THREE.SpriteMaterial;
      if (material.opacity < 0.04) continue;

      const object = sprite.userData.object as DeepSkyObject;
      this.worldPos.copy(sprite.position);
      this.projected.copy(this.worldPos).project(camera);
      if (this.projected.z > 1) continue;

      const screenX = ((this.projected.x + 1) / 2) * window.innerWidth;
      const screenY = ((1 - this.projected.y) / 2) * window.innerHeight;
      const dist = Math.hypot(screenX - x, screenY - y);

      const distToCamera = this.worldPos.distanceTo(camera.position);
      const angularRad = Math.max(object.widthArcmin, object.heightArcmin) * DEG_PER_ARCMIN;
      const display = TYPE_DISPLAY[object.type];
      const hitRadius =
        ((angularRad / fovRad) * window.innerHeight * 0.5 + 12) * display.scale;

      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist;
        closest = object;
      }
    }

    return closest;
  }

  fadeIn(duration = 3) {
    for (const material of this.materials) {
      gsap.killTweensOf(material);
      material.opacity = 0;
    }

    this.group.traverse((child) => {
      if (!(child instanceof THREE.Sprite)) return;
      const material = child.material as THREE.SpriteMaterial;
      const peak = (child.userData.peakOpacity as number) ?? 0.4;
      gsap.to(material, { opacity: peak, duration, ease: "power1.inOut" });
    });
  }

  setVisible(visible: boolean, duration = 0.35) {
    this.group.traverse((child) => {
      if (!(child instanceof THREE.Sprite)) return;
      const material = child.material as THREE.SpriteMaterial;
      const peak = (child.userData.peakOpacity as number) ?? 0.4;
      gsap.killTweensOf(material);
      gsap.to(material, {
        opacity: visible ? peak : 0,
        duration,
        ease: "power1.inOut",
      });
    });
  }
}
