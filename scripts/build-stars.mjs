// One-time build: filter the HYG CSV down to naked-eye stars only.
// Run with: node scripts/build-stars.mjs
// StarMap loads stars.json instead of parsing CSV in the browser.

import { readFileSync, writeFileSync } from "fs";

const MAG_LIMIT = 6.0;
const PICKABLE_MAG_LIMIT = 4.5;

const SPECTRAL_COLORS = {
  O: [0.72, 0.66, 0.98],
  B: [0.8, 0.74, 0.96],
  A: [0.92, 0.86, 0.96],
  F: [1.0, 0.96, 0.94],
  G: [1.0, 0.94, 0.82],
  K: [1.0, 0.78, 0.65],
  M: [1.0, 0.58, 0.52],
  C: [1.0, 0.62, 0.58],
  R: [1.0, 0.55, 0.54],
  S: [1.0, 0.52, 0.58],
};

function spectralColor(spect) {
  const letter = spect.trim().charAt(0).toUpperCase();
  return SPECTRAL_COLORS[letter] ?? [0.94, 0.9, 0.92];
}

const csv = readFileSync("data/hygdata_v3.csv", "utf8");
const lines = csv.split("\n");
const header = lines[0].split(",").map((h) => h.replace(/"/g, ""));

const cols = {
  ra: header.indexOf("ra"),
  dec: header.indexOf("dec"),
  mag: header.indexOf("mag"),
  spect: header.indexOf("spect"),
  proper: header.indexOf("proper"),
  bf: header.indexOf("bf"),
  hip: header.indexOf("hip"),
  con: header.indexOf("con"),
  dist: header.indexOf("dist"),
};

// compact tuples: [ra, dec, size, r, g, b]
const stars = [];
const pickable = [];

for (let i = 2; i < lines.length; i++) {
  const fields = lines[i].split(",");
  if (fields.length < header.length) continue;

  const mag = parseFloat(fields[cols.mag]);
  if (isNaN(mag) || mag > MAG_LIMIT) continue;

  const ra = parseFloat(fields[cols.ra]);
  const dec = parseFloat(fields[cols.dec]);
  const spect = fields[cols.spect].replace(/"/g, "").trim();
  const size = Math.max(2.2, (7.5 - mag) * 2.2);
  const [r, g, b] = spectralColor(spect);
  const index = stars.length;

  stars.push([ra, dec, size, r, g, b]);

  const properName = fields[cols.proper].replace(/"/g, "").trim();
  if (mag <= PICKABLE_MAG_LIMIT || properName) {
    const bayerName = fields[cols.bf].replace(/"/g, "").trim();
    const hip = fields[cols.hip].trim();
    const distParsecs = parseFloat(fields[cols.dist]);
    pickable.push({
      i: index,
      name: properName || bayerName || (hip ? `HIP ${hip}` : "Unnamed star"),
      con: fields[cols.con].replace(/"/g, "").trim(),
      mag,
      spect,
      distLy: distParsecs > 0 && distParsecs < 99999 ? distParsecs * 3.262 : 0,
    });
  }
}

writeFileSync("public/data/stars.json", JSON.stringify({ stars, pickable }));
console.log(`Wrote ${stars.length} stars, ${pickable.length} pickable`);
