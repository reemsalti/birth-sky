type CursorMode = "default" | "pointer";

const INTERACTIVE_SELECTOR =
  "button, a, input, select, textarea, label, [role='button'], .panel-toggle, .panel-dismiss, .panel-tuck-tab";

export class CustomCursor {
  private root: HTMLDivElement | null = null;
  private mode: CursorMode = "default";
  private active = false;

  constructor(_canvas: HTMLCanvasElement) {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    this.root = document.createElement("div");
    this.root.id = "custom-cursor";
    this.root.setAttribute("aria-hidden", "true");
    this.root.innerHTML = `
      <div class="cursor-lens">
        <span class="cursor-lens-outer"></span>
        <span class="cursor-lens-ring"></span>
        <span class="cursor-lens-core"></span>
      </div>
    `;
    this.root.dataset.mode = "default";
    document.body.appendChild(this.root);
    document.documentElement.classList.add("custom-cursor-active");
    this.active = true;

    window.addEventListener("pointermove", this.onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onLeave);
    document.documentElement.addEventListener("pointerenter", this.onEnter);
  }

  private onMove = (e: PointerEvent) => {
    if (!this.active || !this.root) return;
    this.root.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    this.setMode(this.resolveMode(e.clientX, e.clientY));
  };

  private onLeave = () => {
    if (!this.active || !this.root) return;
    this.root.classList.add("cursor-hidden");
  };

  private onEnter = () => {
    if (!this.active || !this.root) return;
    this.root.classList.remove("cursor-hidden");
  };

  private resolveMode(x: number, y: number): CursorMode {
    const hit = document.elementFromPoint(x, y);
    if (!hit) return "default";
    if (hit.closest(INTERACTIVE_SELECTOR)) return "pointer";
    return "default";
  }

  private setMode(mode: CursorMode) {
    if (mode === this.mode || !this.root) return;
    this.mode = mode;
    this.root.dataset.mode = mode;
  }
}
