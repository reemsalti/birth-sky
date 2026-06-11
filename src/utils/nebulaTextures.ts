import * as THREE from "three";
import type { DeepSkyObject } from "../data/deepSkyCatalog";

const textureCache = new Map<string, THREE.CanvasTexture>();
const TEXTURE_SIZE = 768;
const TEXTURE_VERSION = 3;

type EmissionPalette = "rose" | "magenta" | "crimson" | "amber" | "copper" | "teal" | "violet" | "gold";

const EMISSION_PALETTE_BY_ID: Record<string, EmissionPalette> = {
  m42: "rose",
  m43: "rose",
  m8: "magenta",
  m16: "crimson",
  m17: "magenta",
  m20: "violet",
  ngc2237: "rose",
  ngc3372: "amber",
  ngc7000: "crimson",
  ngc1499: "copper",
  ic1805: "crimson",
  ngc281: "gold",
  ngc2359: "teal",
  ngc7635: "violet",
  ic1848: "rose",
};

const PALETTE_STOPS: Record<
  EmissionPalette,
  { core: string; mid: string; outer: string; wisp: string }
> = {
  rose: {
    core: "rgba(255, 230, 240, 0.98)",
    mid: "rgba(255, 100, 140, 0.82)",
    outer: "rgba(90, 150, 230, 0.2)",
    wisp: "255, 120, 160",
  },
  magenta: {
    core: "rgba(255, 210, 255, 0.98)",
    mid: "rgba(220, 70, 200, 0.85)",
    outer: "rgba(120, 80, 200, 0.22)",
    wisp: "240, 90, 220",
  },
  crimson: {
    core: "rgba(255, 220, 210, 0.98)",
    mid: "rgba(255, 60, 80, 0.88)",
    outer: "rgba(180, 50, 90, 0.25)",
    wisp: "255, 70, 90",
  },
  amber: {
    core: "rgba(255, 245, 210, 0.98)",
    mid: "rgba(255, 170, 60, 0.86)",
    outer: "rgba(220, 100, 40, 0.28)",
    wisp: "255, 180, 80",
  },
  copper: {
    core: "rgba(255, 230, 200, 0.96)",
    mid: "rgba(230, 110, 60, 0.84)",
    outer: "rgba(160, 70, 50, 0.24)",
    wisp: "255, 140, 90",
  },
  teal: {
    core: "rgba(210, 255, 250, 0.96)",
    mid: "rgba(40, 200, 190, 0.82)",
    outer: "rgba(30, 120, 160, 0.22)",
    wisp: "80, 220, 210",
  },
  violet: {
    core: "rgba(240, 220, 255, 0.98)",
    mid: "rgba(150, 80, 255, 0.84)",
    outer: "rgba(80, 50, 180, 0.24)",
    wisp: "180, 110, 255",
  },
  gold: {
    core: "rgba(255, 250, 220, 0.98)",
    mid: "rgba(255, 200, 80, 0.86)",
    outer: "rgba(200, 140, 50, 0.26)",
    wisp: "255, 210, 100",
  },
};

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
}

function paintEmission(
  ctx: CanvasRenderingContext2D,
  size: number,
  rand: () => number,
  palette: EmissionPalette
) {
  const stops = PALETTE_STOPS[palette];
  const cx = size * (0.42 + rand() * 0.16);
  const cy = size * (0.42 + rand() * 0.16);

  const outer = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
  outer.addColorStop(0, stops.core);
  outer.addColorStop(0.22, stops.mid);
  outer.addColorStop(0.5, stops.mid.replace(/[\d.]+\)$/, "0.45)"));
  outer.addColorStop(0.72, stops.outer);
  outer.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = outer;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 24; i++) {
    const x = cx + (rand() - 0.5) * size * 0.44;
    const y = cy + (rand() - 0.5) * size * 0.36;
    const r = size * (0.05 + rand() * 0.15);
    const wisp = ctx.createRadialGradient(x, y, 0, x, y, r);
    wisp.addColorStop(0, `rgba(${stops.wisp}, ${0.32 + rand() * 0.35})`);
    wisp.addColorStop(0.55, `rgba(${stops.wisp}, ${0.1 + rand() * 0.15})`);
    wisp.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wisp;
    ctx.fillRect(0, 0, size, size);
  }

  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.11);
  core.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  core.addColorStop(0.45, stops.core.replace(/[\d.]+\)$/, "0.6)"));
  core.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
}

function paintPlanetary(ctx: CanvasRenderingContext2D, size: number, rand: () => number, id: string) {
  const cx = size * 0.5;
  const cy = size * 0.5;
  const outer = size * (0.38 + rand() * 0.05);
  const inner = outer * (0.52 + rand() * 0.08);

  const ringColors =
    id === "m57"
      ? ["rgba(110, 255, 245, 0.95)", "rgba(60, 200, 230, 0.88)", "rgba(220, 100, 140, 0.42)"]
      : id === "ngc6543"
        ? ["rgba(100, 220, 255, 0.95)", "rgba(80, 160, 255, 0.85)", "rgba(200, 100, 255, 0.45)"]
        : id === "m27"
          ? ["rgba(180, 120, 255, 0.92)", "rgba(120, 200, 255, 0.8)", "rgba(255, 120, 180, 0.4)"]
          : ["rgba(110, 255, 245, 0.9)", "rgba(60, 200, 230, 0.82)", "rgba(180, 120, 220, 0.38)"];

  const ring = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  ring.addColorStop(0, "rgba(0,0,0,0)");
  ring.addColorStop(0.35, "rgba(50, 210, 220, 0.2)");
  ring.addColorStop(0.5, ringColors[0]);
  ring.addColorStop(0.65, ringColors[1]);
  ring.addColorStop(0.82, ringColors[2]);
  ring.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ring;
  ctx.fillRect(0, 0, size, size);

  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, inner * 0.75);
  core.addColorStop(0, "rgba(255, 245, 255, 0.98)");
  core.addColorStop(0.4, "rgba(200, 180, 255, 0.72)");
  core.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
}

function paintReflection(ctx: CanvasRenderingContext2D, size: number, rand: () => number, id: string) {
  const cx = size * (0.45 + rand() * 0.1);
  const cy = size * (0.45 + rand() * 0.1);
  const isIris = id === "ngc7023";

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.48);
  grad.addColorStop(0, isIris ? "rgba(200, 230, 255, 0.98)" : "rgba(235, 245, 255, 0.98)");
  grad.addColorStop(0.2, isIris ? "rgba(120, 190, 255, 0.88)" : "rgba(180, 210, 255, 0.82)");
  grad.addColorStop(0.42, "rgba(90, 150, 240, 0.55)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  if (isIris) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + rand() * 0.3;
      const r = size * (0.12 + i * 0.04);
      ctx.strokeStyle = `rgba(140, 200, 255, ${0.2 + i * 0.04})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + Math.PI * 0.9);
      ctx.stroke();
    }
  }
}

function paintCrab(ctx: CanvasRenderingContext2D, size: number, rand: () => number) {
  const cx = size * 0.5;
  const cy = size * 0.5;
  paintFilamentShell(ctx, size, rand, cx, cy, {
    haze: ["rgba(255, 140, 200, 0.35)", "rgba(120, 220, 180, 0.2)"],
    hot: ["255, 180, 220", "120, 255, 180"],
    cool: ["180, 120, 255", "80, 200, 255"],
    filaments: 44,
  });
}

function paintVeil(ctx: CanvasRenderingContext2D, size: number, rand: () => number) {
  const cx = size * 0.5;
  const cy = size * 0.5;
  ctx.lineCap = "round";
  for (let i = 0; i < 55; i++) {
    const angle = rand() * Math.PI * 2;
    const len = size * (0.2 + rand() * 0.38);
    const x1 = cx + Math.cos(angle) * size * 0.08;
    const y1 = cy + Math.sin(angle) * size * 0.08;
    const x2 = x1 + Math.cos(angle + (rand() - 0.5) * 0.4) * len;
    const y2 = y1 + Math.sin(angle + (rand() - 0.5) * 0.4) * len;
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, "rgba(120, 200, 255, 0)");
    g.addColorStop(0.35, `rgba(100, 180, 255, ${0.5 + rand() * 0.4})`);
    g.addColorStop(0.7, `rgba(180, 140, 255, ${0.35 + rand() * 0.3})`);
    g.addColorStop(1, "rgba(255, 120, 180, 0.15)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5 + rand() * 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(
      (x1 + x2) / 2 + (rand() - 0.5) * size * 0.12,
      (y1 + y2) / 2 + (rand() - 0.5) * size * 0.12,
      x2,
      y2
    );
    ctx.stroke();
  }
}

function paintCassiopeiaA(ctx: CanvasRenderingContext2D, size: number, rand: () => number) {
  const cx = size * 0.5;
  const cy = size * 0.5;
  const shell = ctx.createRadialGradient(cx, cy, size * 0.08, cx, cy, size * 0.42);
  shell.addColorStop(0, "rgba(255, 220, 160, 0.15)");
  shell.addColorStop(0.45, "rgba(255, 150, 80, 0.55)");
  shell.addColorStop(0.7, "rgba(255, 100, 60, 0.35)");
  shell.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shell;
  ctx.fillRect(0, 0, size, size);

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(255, 180, 100, 0.65)";
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 220, 150, 0.4)";
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.18, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rand() * 0.2;
    const knot = ctx.createRadialGradient(
      cx + Math.cos(a) * size * 0.28,
      cy + Math.sin(a) * size * 0.28,
      0,
      cx + Math.cos(a) * size * 0.28,
      cy + Math.sin(a) * size * 0.28,
      size * 0.05
    );
    knot.addColorStop(0, "rgba(255, 240, 200, 0.9)");
    knot.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = knot;
    ctx.fillRect(0, 0, size, size);
  }
}

function paintSN1987A(ctx: CanvasRenderingContext2D, size: number, rand: () => number) {
  const cx = size * 0.5;
  const cy = size * 0.5;
  const ring = ctx.createRadialGradient(cx, cy, size * 0.14, cx, cy, size * 0.22);
  ring.addColorStop(0, "rgba(0,0,0,0)");
  ring.addColorStop(0.45, "rgba(255, 240, 120, 0.95)");
  ring.addColorStop(0.65, "rgba(255, 180, 60, 0.75)");
  ring.addColorStop(0.85, "rgba(255, 120, 40, 0.35)");
  ring.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ring;
  ctx.fillRect(0, 0, size, size);

  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.1);
  core.addColorStop(0, "rgba(255, 255, 255, 1)");
  core.addColorStop(0.5, "rgba(255, 230, 150, 0.7)");
  core.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 3; i++) {
    const r = size * (0.26 + i * 0.06);
    ctx.strokeStyle = `rgba(255, 200, 80, ${0.25 - i * 0.06})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, rand() * 0.5, rand() * 0.5 + Math.PI * 1.5);
    ctx.stroke();
  }
}

function paintJellyfish(ctx: CanvasRenderingContext2D, size: number, rand: () => number) {
  const cx = size * 0.5;
  const cy = size * 0.38;
  const bell = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.22);
  bell.addColorStop(0, "rgba(255, 200, 140, 0.7)");
  bell.addColorStop(0.6, "rgba(255, 120, 80, 0.45)");
  bell.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bell;
  ctx.fillRect(0, 0, size, size);

  ctx.lineCap = "round";
  for (let i = 0; i < 16; i++) {
    const x = cx + (i - 8) * size * 0.035;
    const y1 = cy + size * 0.12;
    const y2 = y1 + size * (0.22 + rand() * 0.28);
    const g = ctx.createLinearGradient(x, y1, x, y2);
    g.addColorStop(0, "rgba(255, 160, 100, 0.7)");
    g.addColorStop(0.5, "rgba(255, 100, 140, 0.55)");
    g.addColorStop(1, "rgba(180, 80, 255, 0.2)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 2 + rand() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.quadraticCurveTo(x + (rand() - 0.5) * size * 0.06, (y1 + y2) / 2, x, y2);
    ctx.stroke();
  }
}

function paintFilamentShell(
  ctx: CanvasRenderingContext2D,
  size: number,
  rand: () => number,
  cx: number,
  cy: number,
  opts: {
    haze: [string, string];
    hot: [string, string];
    cool: [string, string];
    filaments: number;
  }
) {
  const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.48);
  haze.addColorStop(0, opts.haze[0]);
  haze.addColorStop(0.5, opts.haze[1]);
  haze.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, size, size);

  ctx.lineCap = "round";
  for (let i = 0; i < opts.filaments; i++) {
    const angle = rand() * Math.PI * 2;
    const len = size * (0.16 + rand() * 0.36);
    const x1 = cx + Math.cos(angle) * size * 0.03 * rand();
    const y1 = cy + Math.sin(angle) * size * 0.03 * rand();
    const x2 = x1 + Math.cos(angle + (rand() - 0.5) * 0.6) * len;
    const y2 = y1 + Math.sin(angle + (rand() - 0.5) * 0.6) * len;
    const hot = rand() > 0.5;
    const rgb = hot ? opts.hot : opts.cool;
    const filament = ctx.createLinearGradient(x1, y1, x2, y2);
    filament.addColorStop(0, `rgba(${rgb[0]}, 0)`);
    filament.addColorStop(0.4, `rgba(${rgb[0]}, ${0.55 + rand() * 0.38})`);
    filament.addColorStop(1, `rgba(${rgb[1]}, ${0.2 + rand() * 0.25})`);
    ctx.strokeStyle = filament;
    ctx.lineWidth = 1.4 + rand() * 3.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(
      (x1 + x2) / 2 + (rand() - 0.5) * size * 0.1,
      (y1 + y2) / 2 + (rand() - 0.5) * size * 0.1,
      x2,
      y2
    );
    ctx.stroke();
  }

  const pulsar = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.09);
  pulsar.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  pulsar.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = pulsar;
  ctx.fillRect(0, 0, size, size);
}

function paintSupernovaRemnant(
  ctx: CanvasRenderingContext2D,
  size: number,
  rand: () => number,
  id: string
) {
  switch (id) {
    case "m1":
      paintCrab(ctx, size, rand);
      break;
    case "ngc6992":
      paintVeil(ctx, size, rand);
      break;
    case "cassiopeia_a":
      paintCassiopeiaA(ctx, size, rand);
      break;
    case "sn1987a":
      paintSN1987A(ctx, size, rand);
      break;
    case "ic443":
      paintJellyfish(ctx, size, rand);
      break;
    default:
      paintFilamentShell(ctx, size, rand, size * 0.5, size * 0.5, {
        haze: ["rgba(210, 225, 255, 0.38)", "rgba(80, 110, 220, 0.1)"],
        hot: ["255, 200, 160", "200, 120, 255"],
        cool: ["120, 180, 255", "80, 120, 220"],
        filaments: 36,
      });
  }
}

export function getNebulaTexture(object: DeepSkyObject): THREE.CanvasTexture {
  const key = `${TEXTURE_VERSION}:${object.id}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = TEXTURE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");

  const rand = seededRandom(hashSeed(object.id));

  if (object.type === "emission") {
    const palette = EMISSION_PALETTE_BY_ID[object.id] ?? "rose";
    paintEmission(ctx, size, rand, palette);
  } else if (object.type === "planetary") {
    paintPlanetary(ctx, size, rand, object.id);
  } else if (object.type === "reflection") {
    paintReflection(ctx, size, rand, object.id);
  } else {
    paintSupernovaRemnant(ctx, size, rand, object.id);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData.shared = true;
  textureCache.set(key, texture);
  return texture;
}
