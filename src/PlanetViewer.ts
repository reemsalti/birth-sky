import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BODIES } from "./bodies";
import { createSkyBackdrop, disposeSkyBackdrop } from "./SkyBackdrop";
import { disposeObject3D } from "./utils/dispose";
import { getGlowTexture } from "./utils/glowTexture";
import { getSphere } from "./utils/geometryCache";
import { loadTexture } from "./utils/textureCache";
import { updateLabels } from "./utils/labels";

// Close-up view of a single body (planet / sun / moon) with its moons and
// rings. The sky (stars, lines, other planets) sits on a backdrop sphere
// so you're still floating in space while you explore.

const BODY_RADIUS = 2; // every body renders at this size, facts tell the real story
const BACKDROP_RADIUS = 180;

export class PlanetViewer {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  active = false;

  private currentGroup: THREE.Group | null = null;
  private spinners: { object: THREE.Object3D; speed: number }[] = [];
  private moonPivots: { pivot: THREE.Object3D; speed: number }[] = [];
  private labels: { element: HTMLDivElement; object: THREE.Object3D }[] = [];
  private labelContainer: HTMLElement;
  private infoPanel: HTMLElement;
  private infoTitle: HTMLElement;
  private sunLight: THREE.DirectionalLight;
  private skyBackdrop = new THREE.Group();
  private labelsVisible = true;
  private enterTween: gsap.core.Tween | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    labelContainer: HTMLElement,
    infoPanel: HTMLElement,
    infoTitle: HTMLElement
  ) {
    this.labelContainer = labelContainer;
    this.infoPanel = infoPanel;
    this.infoTitle = infoTitle;

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 2, 9);

    // free orbit around the body - look at it from any angle
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = BODY_RADIUS * 1.5;
    this.controls.maxDistance = BODY_RADIUS * 14;
    this.controls.enabled = false;

    this.scene.add(new THREE.AmbientLight(0x202028));
    this.sunLight = new THREE.DirectionalLight(0xfff4e0, 3);
    // light comes mostly from the side, so from the default camera you
    // see both the day side and the night side (with earth's city lights)
    this.sunLight.position.set(10, 2.5, 2);
    this.scene.add(this.sunLight);
    this.scene.add(this.skyBackdrop);
  }

  // Clone the loaded sky into a smaller backdrop sphere so stars and other
  // planets are still visible behind the close-up body.
  setSkyBackdrop(stars: THREE.Points) {
    while (this.skyBackdrop.children.length > 0) {
      const child = this.skyBackdrop.children[0];
      disposeSkyBackdrop(child);
      this.skyBackdrop.remove(child);
    }
    this.skyBackdrop.add(createSkyBackdrop(stars, BACKDROP_RADIUS, "closeup"));
  }

  show(bodyKey: string) {
    const info = BODIES[bodyKey];
    if (!info) return;

    this.clear();
    this.active = true;
    this.controls.enabled = false;

    const group = new THREE.Group();
    this.currentGroup = group;

    // nudge left so the planet sits clear of the info card on the right
    group.position.x = -0.7;

    // tilt lives on the group, the spin happens inside it - that way the
    // body rotates around its own tilted axis like the real thing
    group.rotation.z = THREE.MathUtils.degToRad(info.tilt);

    const texture = loadTexture(info.texture);

    // the sun makes its own light, everything else gets lit by the sun.
    // earth gets a special day/night shader so city lights show after dark.
    let material: THREE.Material;
    if (info.nightTexture) {
      material = this.makeDayNightMaterial(texture, info.nightTexture);
    } else if (info.emissive) {
      material = new THREE.MeshBasicMaterial({ map: texture });
    } else {
      material = new THREE.MeshStandardMaterial({ map: texture, roughness: 1 });
    }

    const body = new THREE.Mesh(getSphere(BODY_RADIUS, 40, 40), material);
    body.userData.isBody = true;
    group.add(body);
    this.spinners.push({ object: body, speed: info.spinSpeed });

    if (info.emissive) {
      group.add(this.makeGlowSprite(BODY_RADIUS * 7, 0xffcc88));
    }

    if (info.clouds) {
      const cloudTexture = loadTexture(info.clouds);
      const clouds = new THREE.Mesh(
        getSphere(BODY_RADIUS * 1.015, 40, 40),
        // additive blending makes the black parts of the cloud map disappear
        new THREE.MeshStandardMaterial({
          map: cloudTexture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      group.add(clouds);
      // clouds drift a little faster than the ground spins
      this.spinners.push({ object: clouds, speed: info.spinSpeed * 1.4 });
    }

    if (info.ring) {
      group.add(this.makeRing(info.ring));
    }

    for (const moonInfo of info.moons ?? []) {
      // each moon hangs off its own pivot at the planet's center;
      // spinning the pivot makes the moon orbit
      const pivot = new THREE.Object3D();
      pivot.rotation.y = Math.random() * Math.PI * 2; // random start position

      let moonMaterial: THREE.MeshStandardMaterial;
      if (moonInfo.texture) {
        moonMaterial = new THREE.MeshStandardMaterial({
          map: loadTexture(moonInfo.texture),
          roughness: 1,
        });
      } else {
        moonMaterial = new THREE.MeshStandardMaterial({ color: moonInfo.color, roughness: 1 });
      }

      const moon = new THREE.Mesh(getSphere(BODY_RADIUS * moonInfo.size, 24, 24), moonMaterial);
      moon.userData.isBody = true;
      moon.position.x = BODY_RADIUS * moonInfo.distance;
      pivot.add(moon);
      group.add(pivot);
      this.moonPivots.push({ pivot, speed: moonInfo.speed });

      const label = document.createElement("div");
      label.className = "planet-label";
      label.textContent = moonInfo.name;
      this.labelContainer.appendChild(label);
      this.labels.push({ element: label, object: moon });
    }

    this.scene.add(group);

    this.enterTween?.kill();
    this.controls.enabled = false;
    this.camera.position.set(-0.7, BODY_RADIUS * 2.8, BODY_RADIUS * 9);
    this.controls.target.set(-0.7, 0, 0);
    this.enterTween = gsap.to(this.camera.position, {
      x: -0.7,
      y: BODY_RADIUS * 1.2,
      z: BODY_RADIUS * 4.5,
      duration: 1.05,
      ease: "power2.out",
      onComplete: () => {
        this.controls.enabled = true;
        this.enterTween = null;
      },
    });

    // fill in the info card (collapsed by default - user can expand if curious)
    this.infoTitle.textContent = info.name;
    this.infoPanel.innerHTML = `
      <p class="blurb">${info.blurb}</p>
      <dl>
        ${info.facts.map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join("")}
      </dl>
    `;
  }

  setLabelsVisible(visible: boolean) {
    this.labelsVisible = visible;
  }

  hide() {
    this.enterTween?.kill();
    this.enterTween = null;
    this.clear();
    this.active = false;
    this.controls.enabled = false;
  }

  update(dt: number) {
    for (const { object, speed } of this.spinners) {
      object.rotation.y += speed * dt;
    }
    for (const { pivot, speed } of this.moonPivots) {
      pivot.rotation.y += speed * dt;
    }
    this.controls.update();

    if (this.currentGroup) {
      const bodies: THREE.Mesh[] = [];
      this.currentGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isBody) bodies.push(child);
      });
      if (this.labelsVisible) {
        updateLabels(this.camera, this.labels, bodies);
      } else {
        for (const { element } of this.labels) element.style.opacity = "0";
      }
    }
  }

  private clear() {
    if (this.currentGroup) {
      disposeObject3D(this.currentGroup);
      this.scene.remove(this.currentGroup);
      this.currentGroup = null;
    }
    this.spinners = [];
    this.moonPivots = [];
    for (const { element } of this.labels) element.remove();
    this.labels = [];
  }

  private makeRing(ring: { inner: number; outer: number; texture?: string; color?: number; opacity: number }) {
    const inner = BODY_RADIUS * ring.inner;
    const outer = BODY_RADIUS * ring.outer;
    const geometry = new THREE.RingGeometry(inner, outer, 64);

    // RingGeometry's default UVs don't work for a ring texture strip -
    // remap them so u runs from the inner edge (0) to the outer edge (1)
    const positions = geometry.attributes.position;
    const uvs = geometry.attributes.uv;
    const point = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i);
      const u = (point.length() - inner) / (outer - inner);
      uvs.setXY(i, u, 1);
    }

    let material: THREE.MeshBasicMaterial;
    if (ring.texture) {
      material = new THREE.MeshBasicMaterial({
        map: loadTexture(ring.texture),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: ring.opacity,
      });
    } else {
      material = new THREE.MeshBasicMaterial({
        color: ring.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: ring.opacity,
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2; // lay it flat around the equator
    return mesh;
  }

  // Blends the day texture with the night-lights texture along the
  // terminator, so as the planet spins, cities light up on the dark side.
  private makeDayNightMaterial(dayTexture: THREE.Texture, nightTexturePath: string) {
    const nightTexture = loadTexture(nightTexturePath);

    return new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayTexture },
        nightMap: { value: nightTexture },
        sunDirection: { value: this.sunLight.position.clone().normalize() },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldNormal;

        void main() {
          vUv = uv;
          // world-space normal, so the day side stays facing the light
          // while the planet itself rotates underneath
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D dayMap;
        uniform sampler2D nightMap;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vWorldNormal;

        void main() {
          float sunlight = dot(normalize(vWorldNormal), sunDirection);

          // soft transition across the terminator instead of a hard edge
          float dayAmount = smoothstep(-0.05, 0.3, sunlight);

          vec3 day = texture2D(dayMap, vUv).rgb * (max(sunlight, 0.0) * 0.9 + 0.06);
          vec3 nightLights = texture2D(nightMap, vUv).rgb * (1.0 - dayAmount) * 2.2;

          gl_FragColor = vec4(day + nightLights, 1.0);

          // let three.js convert to the renderer's output color space
          #include <colorspace_fragment>
        }
      `,
    });
  }

  private makeGlowSprite(size: number, color = 0xffffff) {
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
}
