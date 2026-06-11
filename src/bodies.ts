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
}

export interface BodyInfo {
  name: string;
  texture: string;
  tilt: number; // axial tilt in degrees
  spinSpeed: number; // radians/sec for the idle rotation
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
      { name: "Phobos", size: 0.08, distance: 2.8, speed: 0.25, color: 0x9a8f85 },
      { name: "Deimos", size: 0.06, distance: 3.8, speed: 0.13, color: 0xa39788 },
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
      { name: "Io", size: 0.1, distance: 3.0, speed: 0.18, color: 0xd8c06a },
      { name: "Europa", size: 0.09, distance: 3.8, speed: 0.13, color: 0xd8cfc0 },
      { name: "Ganymede", size: 0.15, distance: 4.7, speed: 0.09, color: 0x9c8e7e },
      { name: "Callisto", size: 0.14, distance: 5.7, speed: 0.06, color: 0x76675a },
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
      opacity: 1,
    },
    moons: [
      { name: "Titan", size: 0.16, distance: 4.8, speed: 0.06, color: 0xc8a06a },
    ],
    blurb: "The rings are billions of chunks of water ice, some tiny as dust, some big as houses - and only about 10 meters thick.",
    facts: [
      ["Diameter", "116,460 km"],
      ["Day", "10.7 hours"],
      ["Year", "29.4 Earth years"],
      ["Moons", "146 known, Titan shown here"],
    ],
  },
  uranus: {
    name: "Uranus",
    texture: "/textures/2k_uranus.jpg",
    tilt: 97.8, // rolls around the sun on its side
    spinSpeed: 0.04,
    ring: { inner: 1.6, outer: 2.0, color: 0xaabbc4, opacity: 0.25 },
    moons: [
      { name: "Titania", size: 0.1, distance: 3.4, speed: 0.1, color: 0x9aa0a8 },
      { name: "Oberon", size: 0.09, distance: 4.3, speed: 0.07, color: 0x8d9298 },
    ],
    blurb: "Knocked onto its side long ago, so it rolls around the sun like a ball. Even its faint rings are vertical.",
    facts: [
      ["Diameter", "50,724 km"],
      ["Day", "17.2 hours (retrograde)"],
      ["Year", "84 Earth years"],
      ["Moons", "27, named after Shakespeare characters"],
    ],
  },
  neptune: {
    name: "Neptune",
    texture: "/textures/2k_neptune.jpg",
    tilt: 28.3,
    spinSpeed: 0.045,
    ring: { inner: 1.7, outer: 2.1, color: 0x8899bb, opacity: 0.15 },
    moons: [
      // negative speed - Triton genuinely orbits backwards
      { name: "Triton", size: 0.12, distance: 3.6, speed: -0.09, color: 0xc4ccd4 },
    ],
    blurb: "The windiest place known: gusts over 2,000 km/h. Its big moon Triton orbits backwards, unlike every other large moon.",
    facts: [
      ["Diameter", "49,244 km"],
      ["Day", "16.1 hours"],
      ["Year", "165 Earth years"],
      ["Moons", "14, Triton shown here"],
    ],
  },
};
