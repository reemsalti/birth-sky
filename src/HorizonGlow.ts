import gsap from "gsap";

// Subtle ground-haze at the bottom of the screen (not a sky-sphere band).

export class HorizonGlow {
  private readonly el: HTMLDivElement;

  constructor() {
    this.el = document.createElement("div");
    this.el.id = "horizon-haze";
    this.el.setAttribute("aria-hidden", "true");
    document.body.appendChild(this.el);
  }

  fadeIn(duration = 2.5) {
    gsap.to(this.el, {
      opacity: 1,
      duration,
      ease: "power1.out",
    });
  }

  dispose() {
    this.el.remove();
  }
}
