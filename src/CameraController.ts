import * as THREE from "three";
import gsap from "gsap";

// The camera sits at the center of the sky sphere and looks outward,
// like standing in a planetarium. Dragging rotates where you look
// (yaw/pitch), scrolling zooms by narrowing the field of view.
export class CameraController {
  camera: THREE.PerspectiveCamera;

  // turned off while the planet close-up view has the canvas
  enabled = true;

  // yaw matches right ascension, pitch matches declination -
  // that way pointing at a star is just feeding in its coordinates
  private yaw = Math.PI / 2;
  private pitch = 0;
  private targetYaw = Math.PI / 2;
  private targetPitch = 0;

  private targetFov = 60;

  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  private readonly lookDir = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.camera.position.set(0, 0, 0.1);

    canvas.addEventListener("pointerdown", (e) => {
      if (!this.enabled) return;
      this.dragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      canvas.classList.add("dragging");
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      const speed = 0.0022 * (this.camera.fov / 60);
      this.targetYaw += dx * speed;
      this.targetPitch += dy * speed;

      const maxPitch = Math.PI / 2 - 0.05;
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, -maxPitch, maxPitch);
    });

    canvas.addEventListener("pointerup", () => {
      this.dragging = false;
      canvas.classList.remove("dragging");
    });

    canvas.addEventListener("wheel", (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.targetFov = THREE.MathUtils.clamp(this.targetFov + e.deltaY * 0.05, 20, 75);
    });
  }

  lookAtRaDec(raHours: number, decDeg: number, duration = 3) {
    let newYaw = (raHours / 24) * Math.PI * 2;
    const newPitch = THREE.MathUtils.degToRad(decDeg);

    while (newYaw - this.targetYaw > Math.PI) newYaw -= Math.PI * 2;
    while (newYaw - this.targetYaw < -Math.PI) newYaw += Math.PI * 2;

    gsap.to(this, {
      targetYaw: newYaw,
      targetPitch: newPitch,
      duration,
      ease: "power2.inOut",
    });
  }

  isAnimating(): boolean {
    return (
      this.dragging ||
      Math.abs(this.targetYaw - this.yaw) > 0.0005 ||
      Math.abs(this.targetPitch - this.pitch) > 0.0005 ||
      Math.abs(this.targetFov - this.camera.fov) > 0.05
    );
  }

  update(_dt: number) {
    this.yaw += (this.targetYaw - this.yaw) * 0.06;
    this.pitch += (this.targetPitch - this.pitch) * 0.06;
    this.camera.fov += (this.targetFov - this.camera.fov) * 0.1;
    this.camera.updateProjectionMatrix();

    this.lookDir.set(
      Math.cos(this.pitch) * Math.cos(this.yaw),
      Math.sin(this.pitch),
      -Math.cos(this.pitch) * Math.sin(this.yaw)
    );
    this.lookTarget.copy(this.camera.position).add(this.lookDir);
    this.camera.lookAt(this.lookTarget);
  }
}
