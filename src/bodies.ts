// Data for the close-up planet viewer. Sizes and distances are stylized -
// at true scale most moons would be invisible specks. Facts are real though.

export interface MoonInfo {
  name: string;
  size: number; // fraction of the planet's display radius
  distance: number; // in planet radii from the center
  speed: number; // orbit speed, radians/sec (negative = retrograde)
  color?: number;
  texture?: string;
}

export interface RingInfo {
  inner: number; // in planet radii
  outer: number;
  texture?: string;
  color?: number;
  opacity: number;
  kind?: "saturn" | "uranus" | "neptune";
}

export interface BodyInfo {
  name: string;
  texture: string;
  tilt: number; // axial tilt in degrees
  spinSpeed: number; // radians/sec for the idle rotation
  /** Non-uniform scale for triaxial ellipsoids — Y is the spin axis. */
  ellipsoid?: [number, number, number];
  emissive?: boolean; // the sun lights itself
  clouds?: string; // extra cloud layer (earth)
  nightTexture?: string; // city lights shown on the dark side (earth)
  ring?: RingInfo;
  moons?: MoonInfo[];
  blurb: string;
  facts: [string, string][];
}

export const BODIES: Record<string, BodyInfo> = {
  sun: {
    name: "Sun",
    texture: "/textures/2k_sun.jpg",
    tilt: 7.25,
    spinSpeed: 0.008,
    emissive: true,
    blurb: "Every star you saw on the map is a sun. This one is just close enough to keep us warm.",
    facts: [
      ["Diameter", "1,392,700 km (109 Earths wide)"],
      ["Surface", "~5,500 °C"],
      ["Age", "about 4.6 billion years"],
      ["Mass", "99.86% of the whole solar system"],
    ],
  },
  mercury: {
    name: "Mercury",
    texture: "/textures/2k_mercury.jpg",
    tilt: 0.03,
    spinSpeed: 0.01,
    blurb: "Days here are brutal: 430 °C in sunlight, -180 °C in shadow, and a single day lasts 59 Earth days.",
    facts: [
      ["Diameter", "4,879 km"],
      ["Day", "59 Earth days"],
      ["Year", "88 Earth days"],
      ["Moons", "none"],
    ],
  },
  venus: {
    name: "Venus",
    texture: "/textures/2k_venus_atmosphere.jpg",
    tilt: 177, // spins almost exactly upside down
    spinSpeed: 0.004,
    blurb: "A day on Venus is longer than its year, and it spins backwards. The clouds are sulfuric acid.",
    facts: [
      ["Diameter", "12,104 km"],
      ["Day", "243 Earth days (retrograde)"],
      ["Year", "225 Earth days"],
      ["Surface", "~465 °C, hotter than Mercury"],
    ],
  },
  earth: {
    name: "Earth",
    texture: "/textures/2k_earth_daymap.jpg",
    nightTexture: "/textures/2k_earth_nightmap.jpg",
    clouds: "/textures/2k_earth_clouds.jpg",
    tilt: 23.4,
    spinSpeed: 0.03,
    moons: [
      { name: "Moon", size: 0.27, distance: 4.5, speed: 0.05, texture: "/textures/2k_moon.jpg" },
    ],
    blurb: "Home. The only place in the universe where we know for sure somebody is looking up at the stars.",
    facts: [
      ["Diameter", "12,742 km"],
      ["Day", "23.9 hours"],
      ["Year", "365.25 days"],
      ["Moons", "1"],
    ],
  },
  moon: {
    name: "The Moon",
    texture: "/textures/2k_moon.jpg",
    tilt: 6.7,
    spinSpeed: 0.005,
    blurb: "Tidally locked, so it always shows us the same face. The far side stayed hidden until 1959.",
    facts: [
      ["Diameter", "3,474 km"],
      ["Distance", "384,400 km from Earth"],
      ["Day", "29.5 Earth days"],
      ["Gravity", "1/6th of Earth's"],
    ],
  },
  mars: {
    name: "Mars",
    texture: "/textures/2k_mars.jpg",
    tilt: 25.2,
    spinSpeed: 0.03,
    moons: [
      { name: "Phobos", size: 0.08, distance: 2.8, speed: 0.25, texture: "/textures/2k_phobos.jpg" },
      { name: "Deimos", size: 0.06, distance: 3.8, speed: 0.13, texture: "/textures/2k_deimos.jpg" },
    ],
    blurb: "Its two lumpy moons are probably captured asteroids. Phobos orbits so low it circles Mars three times a day.",
    facts: [
      ["Diameter", "6,779 km"],
      ["Day", "24.6 hours"],
      ["Year", "687 Earth days"],
      ["Moons", "2 (Phobos & Deimos)"],
    ],
  },
  jupiter: {
    name: "Jupiter",
    texture: "/textures/2k_jupiter.jpg",
    tilt: 3.1,
    spinSpeed: 0.06, // fastest spinner in the solar system
    moons: [
      { name: "Io", size: 0.1, distance: 3.0, speed: 0.18, texture: "/textures/2k_io.jpg" },
      { name: "Europa", size: 0.09, distance: 3.8, speed: 0.13, texture: "/textures/2k_europa.jpg" },
      { name: "Ganymede", size: 0.15, distance: 4.7, speed: 0.09, texture: "/textures/2k_ganymede.jpg" },
      { name: "Callisto", size: 0.14, distance: 5.7, speed: 0.06, texture: "/textures/2k_callisto.jpg" },
    ],
    blurb: "The Great Red Spot is a storm wider than Earth that has been raging for at least 350 years.",
    facts: [
      ["Diameter", "139,820 km (11 Earths wide)"],
      ["Day", "9.9 hours"],
      ["Year", "11.9 Earth years"],
      ["Moons", "95 known, 4 big ones shown here"],
    ],
  },
  saturn: {
    name: "Saturn",
    texture: "/textures/2k_saturn.jpg",
    tilt: 26.7,
    spinSpeed: 0.055,
    ring: {
      inner: 1.35,
      outer: 2.4,
      texture: "/textures/2k_saturn_ring_alpha.png",
      kind: "saturn",
      opacity: 1,
    },
    moons: [
      { name: "Mimas", size: 0.06, distance: 2.55, speed: 0.28, texture: "/textures/2k_mimas.jpg" },
      { name: "Enceladus", size: 0.07, distance: 2.85, speed: 0.24, texture: "/textures/2k_enceladus.jpg" },
      { name: "Tethys", size: 0.08, distance: 3.15, speed: 0.2, texture: "/textures/2k_tethys.jpg" },
      { name: "Dione", size: 0.08, distance: 3.45, speed: 0.17, texture: "/textures/2k_dione.jpg" },
      { name: "Rhea", size: 0.09, distance: 3.85, speed: 0.14, texture: "/textures/2k_rhea.jpg" },
      { name: "Titan", size: 0.16, distance: 4.8, speed: 0.06, texture: "/textures/2k_titan.jpg" },
      { name: "Iapetus", size: 0.1, distance: 5.8, speed: 0.04, texture: "/textures/2k_iapetus.jpg" },
    ],
    blurb: "The rings are billions of chunks of water ice, some tiny as dust, some big as houses - and only about 10 meters thick.",
    facts: [
      ["Diameter", "116,460 km"],
      ["Day", "10.7 hours"],
      ["Year", "29.4 Earth years"],
      ["Moons", "146 known, 7 major ones shown here"],
    ],
  },
  uranus: {
    name: "Uranus",
    texture: "/textures/2k_uranus.jpg",
    tilt: 97.8, // rolls around the sun on its side
    spinSpeed: 0.04,
    ring: { inner: 1.55, outer: 2.05, kind: "uranus", opacity: 0.85 },
    moons: [
      { name: "Miranda", size: 0.05, distance: 2.5, speed: 0.15, texture: "/textures/2k_miranda.jpg" },
      { name: "Ariel", size: 0.08, distance: 2.9, speed: 0.12, texture: "/textures/2k_ariel.jpg" },
      { name: "Umbriel", size: 0.08, distance: 3.1, speed: 0.11, texture: "/textures/2k_umbriel.jpg" },
      { name: "Titania", size: 0.1, distance: 3.4, speed: 0.1, texture: "/textures/2k_titania.jpg" },
      { name: "Oberon", size: 0.09, distance: 4.3, speed: 0.07, texture: "/textures/2k_oberon.jpg" },
    ],
    blurb: "Knocked onto its side long ago, so it rolls around the sun like a ball. Even its faint rings are vertical.",
    facts: [
      ["Diameter", "50,724 km"],
      ["Day", "17.2 hours (retrograde)"],
      ["Year", "84 Earth years"],
      ["Moons", "27 known, 5 major ones shown here"],
    ],
  },
  neptune: {
    name: "Neptune",
    texture: "/textures/2k_neptune.jpg",
    tilt: 28.3,
    spinSpeed: 0.045,
    ring: { inner: 1.65, outer: 2.15, kind: "neptune", opacity: 0.75 },
    moons: [
      // no global map exists for Proteus — dark gray is close to its albedo
      { name: "Proteus", size: 0.06, distance: 2.6, speed: 0.11, color: 0x6e6c68 },
      // negative speed - Triton genuinely orbits backwards
      { name: "Triton", size: 0.12, distance: 3.6, speed: -0.09, texture: "/textures/2k_triton.jpg" },
    ],
    blurb: "The windiest place known: gusts over 2,000 km/h. Its big moon Triton orbits backwards, unlike every other large moon.",
    facts: [
      ["Diameter", "49,244 km"],
      ["Day", "16.1 hours"],
      ["Year", "165 Earth years"],
      ["Moons", "14 known, Triton & Proteus shown here"],
    ],
  },
  ceres: {
    name: "Ceres",
    texture: "/textures/2k_ceres.jpg",
    tilt: 4,
    spinSpeed: 0.018,
    blurb: "The largest object in the asteroid belt — a round world of rock and salt, with bright spots that may be salt deposits from ancient brine.",
    facts: [
      ["Diameter", "939 km"],
      ["Day", "9.1 hours"],
      ["Year", "4.6 Earth years"],
      ["Region", "asteroid belt, ~2.8 AU from the sun"],
      ["Note", "mag ~7–9 — needs binoculars or a telescope"],
    ],
  },
  pluto: {
    name: "Pluto",
    texture: "/textures/2k_pluto.jpg",
    tilt: 122.5, // spins on its side like Uranus
    spinSpeed: -0.012, // retrograde, ~6.4 Earth days
    moons: [
      { name: "Charon", size: 0.42, distance: 2.4, speed: 0.012, texture: "/textures/2k_charon.jpg" },
    ],
    blurb: "A dwarf planet with a heart-shaped glacier of nitrogen ice. Charon is so big they orbit a point in space between them.",
    facts: [
      ["Diameter", "2,376 km"],
      ["Day", "6.4 Earth days (retrograde)"],
      ["Year", "248 Earth years"],
      ["Moons", "5 known, Charon shown here"],
      ["Note", "too faint to see with the naked eye — mag ~14"],
    ],
  },
  eris: {
    name: "Eris",
    texture: "/textures/2k_eris.jpg",
    tilt: 78,
    spinSpeed: 0.008,
    blurb: "A distant icy dwarf planet whose discovery helped redefine what counts as a planet. Its surface is almost as reflective as fresh snow.",
    facts: [
      ["Diameter", "~2,326 km"],
      ["Day", "~25.9 hours"],
      ["Year", "~559 Earth years"],
      ["Region", "scattered disc, ~68 AU from the sun"],
      ["Note", "mag ~18 — far too faint for the naked eye"],
    ],
  },
  haumea: {
    name: "Haumea",
    texture: "/textures/2k_haumea.jpg",
    tilt: 126,
    spinSpeed: 0.045,
    // ~1960 × 1518 × 996 km — spins around its shortest (Y) axis
    ellipsoid: [1, 0.51, 0.77],
    blurb: "A fast-spinning egg-shaped world in the Kuiper belt. Two small moons and a ring of debris trail its elongated body.",
    facts: [
      ["Longest axis", "~1,960 km"],
      ["Day", "~4 hours (fastest large body known)"],
      ["Year", "~285 Earth years"],
      ["Region", "Kuiper belt, ~43 AU from the sun"],
      ["Note", "mag ~17 — telescope only"],
    ],
  },
  makemake: {
    name: "Makemake",
    texture: "/textures/2k_makemake.jpg",
    tilt: 29,
    spinSpeed: 0.011,
    blurb: "A reddish, methane-coated dwarf planet in the outer solar system — one of the largest known Kuiper belt objects.",
    facts: [
      ["Diameter", "~1,430 km"],
      ["Day", "~22.5 hours"],
      ["Year", "~305 Earth years"],
      ["Region", "Kuiper belt, ~45 AU from the sun"],
      ["Note", "mag ~17 — telescope only"],
    ],
  },
};
