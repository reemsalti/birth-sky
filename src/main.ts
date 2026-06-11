import * as THREE from "three";
import gsap from "gsap";
import { StarMap } from "./StarMap";
import { Constellations, CONSTELLATION_NAMES } from "./Constellations";
import { DeepSky } from "./DeepSky";
import { Planets } from "./Planets";
import { PlanetViewer } from "./PlanetViewer";
import { SolarSystemView } from "./SolarSystemView";
import { CameraController } from "./CameraController";
import { CustomCursor } from "./CustomCursor";
import { spectralTypeDescription } from "./utils/spectralColor";
import {
  DEFAULT_UNKNOWN_TIME,
  buildLiveSkyContext,
  formatAccuracyNote,
  formatObserverLabel,
  getJulianDay,
  getSunConstellation,
  isValidContext,
  loadBirthContext,
  parseBirthMoment,
  saveBirthContext,
  type BirthContext,
} from "./utils/observer";
import { reversePlace, searchPlaces, type GeoPlace } from "./utils/geocode";

const canvas = document.getElementById("sky") as HTMLCanvasElement;
const landing = document.getElementById("landing") as HTMLDivElement;

function randomStarPosition(): { x: number; y: number } {
  let x = 0;
  let y = 0;
  do {
    x = 2 + Math.random() * 96;
    y = 2 + Math.random() * 96;
  } while (x > 24 && x < 76 && y > 16 && y < 84);
  return { x, y };
}

function randomStarSize(): number {
  const roll = Math.random();
  if (roll < 0.12) return 3 + Math.random() * 1.8;
  if (roll < 0.35) return 1.6 + Math.random() * 1.4;
  return 0.7 + Math.random() * 1.1;
}

function randomShineZonePosition(zone: "left" | "right" | "top"): { x: number; y: number } {
  switch (zone) {
    case "left":
      return { x: 6 + Math.random() * 15, y: 10 + Math.random() * 80 };
    case "right":
      return { x: 79 + Math.random() * 15, y: 10 + Math.random() * 80 };
    case "top":
      return { x: 10 + Math.random() * 80, y: 6 + Math.random() * 12 };
  }
}

function appendLandingStar(
  container: Element,
  {
    x,
    y,
    size,
    shineClass = "",
  }: {
    x: number;
    y: number;
    size: number;
    shineClass?: "" | " shine-2" | " shine-4";
  },
) {
  const bright = size >= 2.8;
  const shineLength = size * 4.2 + 7;
  const star = document.createElement("span");
  star.className = `${bright ? "landing-star bright" : "landing-star"}${shineClass}`;
  star.style.left = `${x}%`;
  star.style.top = `${y}%`;

  if (shineClass) {
    const box = shineLength * 2 + size;
    star.style.width = `${box}px`;
    star.style.height = `${box}px`;
    star.style.setProperty("--dot-size", `${size}px`);
    star.style.setProperty("--shine-length", `${shineLength}px`);
    const angle = Math.random() * 180;
    star.style.setProperty("--shine-angle", `${angle}deg`);
    star.style.setProperty("--shine-angle-2", `${(angle + 38 + Math.random() * 52) % 180}deg`);
  } else {
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
  }

  star.style.setProperty("--twinkle-delay", `${Math.random() * 5}s`);
  star.style.setProperty("--twinkle-duration", `${2.5 + Math.random() * 3.5}s`);
  container.appendChild(star);
}

function initLandingStars() {
  const container = landing.querySelector(".landing-stars");
  if (!container) return;

  const shineZones = ["left", "right", "top"] as const;
  for (const zone of shineZones) {
    const pos = randomShineZonePosition(zone);
    const size = 2.8 + Math.random() * 1.6;
    appendLandingStar(container, {
      ...pos,
      size,
      shineClass: Math.random() < 0.55 ? " shine-4" : " shine-2",
    });
  }

  const count = 39;
  for (let i = 0; i < count; i++) {
    const { x, y } = randomStarPosition();
    appendLandingStar(container, { x, y, size: randomStarSize() });
  }

  for (let i = 0; i < 55; i++) {
    const x = 1 + Math.random() * 98;
    const y = Math.random() < 0.5 ? 1 + Math.random() * 22 : 78 + Math.random() * 20;
    appendLandingStar(container, { x, y, size: randomStarSize() * 0.85 });
  }
}
const form = document.getElementById("birthday-form") as HTMLFormElement;
const dateInput = document.getElementById("birthday") as HTMLInputElement;
const timeInput = document.getElementById("birthtime") as HTMLInputElement;
const timeUnknownCheckbox = document.getElementById("time-unknown") as HTMLInputElement;
const birthplaceInput = document.getElementById("birthplace") as HTMLInputElement;
const searchPlaceButton = document.getElementById("search-place") as HTMLButtonElement;
const placeResults = document.getElementById("place-results") as HTMLUListElement;
const placeHint = document.getElementById("place-hint") as HTMLParagraphElement;
const bornNearHereButton = document.getElementById("born-near-here") as HTMLButtonElement;
const viewCurrentSkyButton = document.getElementById("view-current-sky") as HTMLButtonElement;
const latitudeInput = document.getElementById("latitude") as HTMLInputElement;
const longitudeInput = document.getElementById("longitude") as HTMLInputElement;
const placeNameInput = document.getElementById("place-name") as HTMLInputElement;
const formError = document.getElementById("form-error") as HTMLParagraphElement;
const loadingText = document.getElementById("loading-text") as HTMLParagraphElement;
const labelContainer = document.getElementById("labels") as HTMLDivElement;
const viewerLabels = document.getElementById("viewer-labels") as HTMLDivElement;
const starTooltip = document.getElementById("star-tooltip") as HTMLDivElement;
const constellationStack = document.getElementById("constellation-stack") as HTMLDivElement;
const constellationPanel = document.getElementById("constellation-panel") as HTMLElement;
const panelContent = document.getElementById("panel-content") as HTMLDivElement;
const panelTitle = constellationPanel.querySelector(".panel-title") as HTMLSpanElement;
const panelToggle = document.getElementById("panel-toggle") as HTMLButtonElement;
const panelClose = document.getElementById("panel-close") as HTMLButtonElement;
const bodyNav = document.getElementById("body-nav") as HTMLElement;
const bodyBar = document.getElementById("body-bar") as HTMLElement;
const bodyInfo = document.getElementById("body-info") as HTMLElement;
const bodyInfoContent = document.getElementById("body-info-content") as HTMLDivElement;
const bodyInfoTitle = document.getElementById("body-info-title") as HTMLSpanElement;
const bodyInfoToggle = document.getElementById("body-info-toggle") as HTMLButtonElement;
const backButton = document.getElementById("back-to-sky") as HTMLButtonElement;
const skyControls = document.getElementById("sky-controls") as HTMLElement;
const changeBirthdayButton = document.getElementById("change-birthday") as HTMLButtonElement;
const toggleLabelsButton = document.getElementById("toggle-labels") as HTMLButtonElement;
const toggleOrbitsButton = document.getElementById("toggle-orbits") as HTMLButtonElement;
const toggleStarsButton = document.getElementById("toggle-stars") as HTMLButtonElement;
const toggleConstellationsButton = document.getElementById("toggle-constellations") as HTMLButtonElement;
const toggleBirthConstellationButton = document.getElementById(
  "toggle-birth-constellation"
) as HTMLButtonElement;
const solarSystemButton = document.getElementById("solar-system-btn") as HTMLButtonElement;
const viewFade = document.getElementById("view-fade") as HTMLDivElement;
let birthContext: BirthContext | null = null;
let pendingPlaces: GeoPlace[] = [];

function clearResolvedPlace() {
  latitudeInput.value = "";
  longitudeInput.value = "";
  placeNameInput.value = "";
  placeHint.textContent = "where you were born — not where you live now.";
}

function setResolvedPlace(place: GeoPlace) {
  latitudeInput.value = String(place.latitude);
  longitudeInput.value = String(place.longitude);
  placeNameInput.value = place.name;
  birthplaceInput.value = place.name;
  placeHint.textContent = `using ${place.name.toLowerCase()}`;
  hidePlaceResults();
}

function hidePlaceResults() {
  placeResults.classList.add("hidden");
  placeResults.innerHTML = "";
  pendingPlaces = [];
}

function showFormError(message: string) {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

function clearFormError() {
  formError.textContent = "";
  formError.classList.add("hidden");
}

function syncTimeUnknownUi() {
  const unknown = timeUnknownCheckbox.checked;
  timeInput.disabled = unknown;
  timeInput.required = !unknown;
  if (unknown) timeInput.value = DEFAULT_UNKNOWN_TIME;
}

function buildContextFromForm(): BirthContext | null {
  const latitude = parseFloat(latitudeInput.value);
  const longitude = parseFloat(longitudeInput.value);
  const timeApproximate = timeUnknownCheckbox.checked;

  const ctx: BirthContext = {
    date: dateInput.value,
    time: timeApproximate ? DEFAULT_UNKNOWN_TIME : timeInput.value,
    latitude,
    longitude,
    placeName: placeNameInput.value || undefined,
    timeApproximate: timeApproximate || undefined,
  };

  return isValidContext(ctx) ? ctx : null;
}

function fillForm(ctx: BirthContext) {
  dateInput.value = ctx.date;
  timeInput.value = ctx.time;
  timeUnknownCheckbox.checked = !!ctx.timeApproximate;
  syncTimeUnknownUi();
  latitudeInput.value = String(ctx.latitude);
  longitudeInput.value = String(ctx.longitude);
  placeNameInput.value = ctx.placeName ?? "";
  birthplaceInput.value = ctx.placeName ?? "";
  if (ctx.placeName) {
    placeHint.textContent = `using ${ctx.placeName.toLowerCase()}`;
  }
}

function renderPlaceResults(places: GeoPlace[]) {
  pendingPlaces = places;
  placeResults.innerHTML = "";
  if (places.length === 0) {
    showFormError("no matching places — try adding a country or state.");
    return;
  }

  clearFormError();
  for (const [index, place] of places.entries()) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = place.name.toLowerCase();
    button.addEventListener("click", () => setResolvedPlace(places[index]));
    item.appendChild(button);
    placeResults.appendChild(item);
  }
  placeResults.classList.remove("hidden");

  if (places.length === 1) setResolvedPlace(places[0]);
}

async function fetchAndShowPlaces(query: string): Promise<GeoPlace[]> {
  const places = await searchPlaces(query);
  renderPlaceResults(places);
  return places;
}

function locationErrorMessage(
  err: unknown,
  messages: { denied: string; unavailable: string; fallback: string }
): string {
  if (err instanceof Error && err.message === "denied") return messages.denied;
  if (err instanceof Error && err.message === "unavailable") return messages.unavailable;
  return messages.fallback;
}

function requestCurrentPlace(): Promise<GeoPlace> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordFallback = {
          name: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
          latitude,
          longitude,
        };

        try {
          const place = await reversePlace(latitude, longitude);
          resolve(place ?? coordFallback);
        } catch {
          resolve(coordFallback);
        }
      },
      () => reject(new Error("denied")),
      { enableHighAccuracy: false, timeout: 12000 }
    );
  });
}

async function resolveBirthPlace(): Promise<GeoPlace | null> {
  const lat = parseFloat(latitudeInput.value);
  const lon = parseFloat(longitudeInput.value);
  const savedName = placeNameInput.value.trim().toLowerCase();
  const query = birthplaceInput.value.trim().toLowerCase();

  if (
    !isNaN(lat) &&
    !isNaN(lon) &&
    savedName &&
    query === savedName
  ) {
    return { name: placeNameInput.value, latitude: lat, longitude: lon };
  }

  if (query.length < 2) return null;

  const places = await fetchAndShowPlaces(birthplaceInput.value.trim());
  if (places.length === 0) return null;
  if (places.length === 1) return places[0];
  return null;
}

// --- basic three.js setup ---

const MAX_PIXEL_RATIO = 1.5;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
const controls = new CameraController(camera, canvas);
new CustomCursor(canvas);
const viewer = new PlanetViewer(canvas, viewerLabels, bodyInfoContent, bodyInfoTitle);
const solarSystem = new SolarSystemView(canvas, viewerLabels);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  viewer.camera.aspect = window.innerWidth / window.innerHeight;
  viewer.camera.updateProjectionMatrix();
  solarSystem.camera.aspect = window.innerWidth / window.innerHeight;
  solarSystem.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- render loop ---

const clock = new THREE.Clock();
let starMap: StarMap | null = null;
let planets: Planets | null = null;
let constellations: Constellations | null = null;
let deepSky: DeepSky | null = null;
let birthConstellationCode: string | null = null;
let objectLabelsVisible = true;
let skyStarted = false;
let skyLoading = false;
let viewTransitioning = false;

const FADE_IN = 0.38;
const FADE_OUT = 0.52;

function setViewChromeInteractive(enabled: boolean) {
  bodyNav.style.pointerEvents = enabled ? "" : "none";
  backButton.style.pointerEvents = enabled ? "" : "none";
  viewFade.classList.toggle("blocking", !enabled);
}

function transitionView(swap: () => void) {
  if (viewTransitioning) return;
  viewTransitioning = true;
  setViewChromeInteractive(false);

  gsap.killTweensOf(viewFade);
  gsap.to(viewFade, {
    opacity: 1,
    duration: FADE_IN,
    ease: "power2.inOut",
    onComplete: () => {
      swap();
      gsap.to(viewFade, {
        opacity: 0,
        duration: FADE_OUT,
        ease: "power2.inOut",
        onComplete: () => {
          setViewChromeInteractive(true);
          viewTransitioning = false;
        },
      });
    },
  });
}

function isGsapAnimating() {
  return gsap.globalTimeline.getChildren(false, true, true).length > 0;
}

function requestRender() {
  if (document.hidden) return;
  if (viewer.active) {
    renderer.render(viewer.scene, viewer.camera);
  } else if (solarSystem.active) {
    renderer.render(solarSystem.scene, solarSystem.camera);
  } else if (skyStarted) {
    renderer.render(scene, camera);
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (document.hidden) return;

  const dt = clock.getDelta();
  let shouldRender = false;

  if (viewer.active) {
    viewer.update(dt);
    shouldRender = true;
  } else if (solarSystem.active) {
    solarSystem.update(dt);
    shouldRender = true;
  } else if (skyStarted) {
    controls.update(dt);
    planets?.update(camera);
    shouldRender = true;
  }

  if (!shouldRender) return;

  if (viewer.active) {
    renderer.render(viewer.scene, viewer.camera);
  } else if (solarSystem.active) {
    renderer.render(solarSystem.scene, solarSystem.camera);
  } else {
    renderer.render(scene, camera);
  }
}
animate();

// --- switching between the sky and the close-up body viewer ---

function clearViewHighlights() {
  bodyNav.querySelectorAll(".active").forEach((el) => el.classList.remove("active"));
}

function setSkyLabelsVisible(visible: boolean) {
  labelContainer.classList.toggle("hidden", !visible);
}

function setViewerLabelsVisible(visible: boolean) {
  viewerLabels.classList.toggle("hidden", !visible);
}

function updateOrbitsButton() {
  const showing = solarSystem.orbitsShowing;
  toggleOrbitsButton.textContent = showing ? "hide orbits" : "show orbits";
  toggleOrbitsButton.classList.toggle("active", !showing);
}

function updateStarsButton() {
  const showing = solarSystem.backdropShowing;
  toggleStarsButton.textContent = showing ? "hide stars" : "show stars";
  toggleStarsButton.classList.toggle("active", !showing);
}

function setSolarControlsVisible(visible: boolean) {
  toggleOrbitsButton.classList.toggle("hidden", !visible);
  toggleStarsButton.classList.toggle("hidden", !visible);
  if (visible) {
    updateOrbitsButton();
    updateStarsButton();
  }
}

function setObjectLabelsVisible(visible: boolean) {
  objectLabelsVisible = visible;
  planets?.setLabelsVisible(visible);
  solarSystem.setLabelsVisible(visible);
  viewer.setLabelsVisible(visible);
  toggleLabelsButton.textContent = visible ? "hide labels" : "show labels";
  toggleLabelsButton.classList.toggle("active", !visible);
  if (skyStarted && !viewer.active && !solarSystem.active) {
    planets?.update(camera);
  }
  requestRender();
}

function updateConstellationButtons() {
  if (!constellations) return;
  const allVisible = constellations.allLinesVisible;
  const birthVisible = constellations.birthLinesVisible;

  toggleConstellationsButton.textContent = allVisible
    ? "hide constellations"
    : "show constellations";
  toggleConstellationsButton.classList.toggle("active", !allVisible);

  toggleBirthConstellationButton.textContent = birthVisible
    ? "hide birth constellation"
    : "show birth constellation";
  toggleBirthConstellationButton.classList.toggle("active", !birthVisible);
}

function setAllConstellationsVisible(visible: boolean) {
  constellations?.setAllLinesVisible(visible);
  updateConstellationButtons();
  requestRender();
}

function setBirthConstellationVisible(visible: boolean) {
  constellations?.setBirthLinesVisible(visible);
  updateConstellationButtons();
  if (!visible) constellationPanel.classList.add("hidden");
  else if (birthConstellationCode) showConstellationPanel(birthConstellationCode);
  requestRender();
}

function applyBodyViewer(bodyKey: string) {
  solarSystem.hide();
  viewer.show(bodyKey);
  controls.enabled = false;
  setSolarControlsVisible(false);
  setSkyLabelsVisible(false);
  setViewerLabelsVisible(true);
  starTooltip.classList.add("hidden");
  constellationPanel.classList.add("hidden");
  backButton.classList.remove("hidden");
  bodyInfo.classList.remove("hidden");
  bodyInfo.classList.add("collapsed");

  clearViewHighlights();
  const button = bodyBar.querySelector(`[data-body="${bodyKey}"]`);
  button?.classList.add("active");
}

function openBodyViewer(bodyKey: string) {
  transitionView(() => applyBodyViewer(bodyKey));
}

function applySolarSystem() {
  viewer.hide();
  bodyInfo.classList.add("hidden");
  solarSystem.show();
  controls.enabled = false;
  setSolarControlsVisible(true);
  setSkyLabelsVisible(false);
  setViewerLabelsVisible(true);
  starTooltip.classList.add("hidden");
  backButton.classList.remove("hidden");

  if (birthConstellationCode && constellations?.birthLinesVisible) {
    showConstellationPanel(birthConstellationCode);
  } else {
    constellationPanel.classList.add("hidden");
  }

  clearViewHighlights();
  solarSystemButton.classList.add("active");
}

function openSolarSystem() {
  if (solarSystem.active) return;
  transitionView(() => applySolarSystem());
}

function applyBackToSky() {
  viewer.hide();
  solarSystem.hide();
  controls.enabled = true;
  setSolarControlsVisible(false);
  setViewerLabelsVisible(false);
  setSkyLabelsVisible(true);
  backButton.classList.add("hidden");
  bodyInfo.classList.add("hidden");
  clearViewHighlights();
}

function backToSky() {
  if (!viewer.active && !solarSystem.active) return;
  transitionView(() => applyBackToSky());
}

bodyNav.addEventListener("click", (e) => {
  const button = (e.target as HTMLElement).closest("button");
  if (!button || viewTransitioning) return;
  if (button.id === "solar-system-btn") {
    openSolarSystem();
    return;
  }
  const bodyKey = button.dataset.body;
  if (!bodyKey) return;
  if (viewer.active && bodyBar.querySelector(`[data-body="${bodyKey}"]`)?.classList.contains("active")) {
    return;
  }
  openBodyViewer(bodyKey);
});

backButton.addEventListener("click", backToSky);
toggleLabelsButton.addEventListener("click", () => {
  setObjectLabelsVisible(!objectLabelsVisible);
});
toggleOrbitsButton.addEventListener("click", () => {
  if (!solarSystem.active) return;
  solarSystem.setOrbitsVisible(!solarSystem.orbitsShowing);
  updateOrbitsButton();
  requestRender();
});
toggleStarsButton.addEventListener("click", () => {
  if (!solarSystem.active) return;
  solarSystem.setBackdropVisible(!solarSystem.backdropShowing);
  updateStarsButton();
  requestRender();
});
toggleConstellationsButton.addEventListener("click", () => {
  if (!constellations) return;
  setAllConstellationsVisible(!constellations.allLinesVisible);
});
toggleBirthConstellationButton.addEventListener("click", () => {
  if (!constellations) return;
  setBirthConstellationVisible(!constellations.birthLinesVisible);
});
changeBirthdayButton.addEventListener("click", () => {
  localStorage.removeItem("birth-sky-context");
  localStorage.removeItem("birth-sky-birthday");
  sessionStorage.setItem("birth-sky-pick-new", "1");
  location.reload();
});

timeUnknownCheckbox.addEventListener("change", syncTimeUnknownUi);

birthplaceInput.addEventListener("input", () => {
  if (birthplaceInput.value.trim().toLowerCase() !== placeNameInput.value.trim().toLowerCase()) {
    clearResolvedPlace();
    hidePlaceResults();
  }
});

searchPlaceButton.addEventListener("click", async () => {
  clearFormError();
  searchPlaceButton.disabled = true;
  searchPlaceButton.textContent = "searching…";
  try {
    await fetchAndShowPlaces(birthplaceInput.value.trim());
  } catch {
    showFormError("couldn't look up that place — check your connection and try again.");
  } finally {
    searchPlaceButton.disabled = false;
    searchPlaceButton.textContent = "find";
  }
});

bornNearHereButton.addEventListener("click", async () => {
  bornNearHereButton.disabled = true;
  bornNearHereButton.textContent = "locating…";
  try {
    const place = await requestCurrentPlace();
    setResolvedPlace(place);
    placeHint.textContent = `${place.name.toLowerCase()} — only use this if you were born near here.`;
  } catch (err) {
    showFormError(
      locationErrorMessage(err, {
        denied: "location permission denied — type your birth city instead.",
        unavailable: "location access isn't available in this browser.",
        fallback: "couldn't look up your location — try typing your birth city.",
      })
    );
  } finally {
    bornNearHereButton.disabled = false;
    bornNearHereButton.textContent = "born near where i am now?";
  }
});

viewCurrentSkyButton.addEventListener("click", async () => {
  clearFormError();
  viewCurrentSkyButton.disabled = true;
  viewCurrentSkyButton.textContent = "locating…";
  try {
    const place = await requestCurrentPlace();
    const ctx = buildLiveSkyContext(place.latitude, place.longitude, place.name);
    await startSky(ctx);
  } catch (err) {
    showFormError(
      locationErrorMessage(err, {
        denied: "location permission denied — allow access to view the current sky.",
        unavailable: "location access isn't available in this browser.",
        fallback: "couldn't find your location — try again in a moment.",
      })
    );
    viewCurrentSkyButton.disabled = false;
    viewCurrentSkyButton.textContent = "view current sky";
  }
});
panelClose.addEventListener("click", () => constellationPanel.classList.add("hidden"));

panelToggle.addEventListener("click", () => {
  constellationPanel.classList.toggle("collapsed");
});
bodyInfoToggle.addEventListener("click", () => {
  bodyInfo.classList.toggle("collapsed");
});

// --- star hover tooltips ---

// only check hover once per frame, not on every raw pointermove event
let hoverPending = false;
let hoverX = 0;
let hoverY = 0;

window.addEventListener("pointermove", (e) => {
  if (!skyStarted || viewer.active || solarSystem.active || !starMap) return;
  hoverX = e.clientX;
  hoverY = e.clientY;
  if (hoverPending) return;
  hoverPending = true;
  requestAnimationFrame(() => {
    hoverPending = false;

    const nebula = deepSky?.findAtScreen(hoverX, hoverY, camera);
    if (nebula) {
      const typeLabel = nebula.type.replace(/_/g, " ");
      starTooltip.innerHTML = `
        <div class="star-name">${nebula.name}</div>
        <div class="star-detail">${typeLabel} nebula</div>
        <div class="star-detail">${nebula.description}</div>
        <div class="star-detail">age: ${nebula.age}</div>
      `;
      starTooltip.style.left = `${Math.min(hoverX + 16, window.innerWidth - 280)}px`;
      starTooltip.style.top = `${hoverY + 16}px`;
      starTooltip.classList.remove("hidden");
      return;
    }

    const star = starMap!.findStarAtScreen(hoverX, hoverY, camera);
    if (!star) {
      starTooltip.classList.add("hidden");
      return;
    }

    const constellationName = CONSTELLATION_NAMES[star.con] ?? star.con;
    const distance = star.distLy
      ? `${Math.round(star.distLy).toLocaleString()} light years away`
      : "distance unknown";
    starTooltip.innerHTML = `
      <div class="star-name">${star.name}</div>
      <div class="star-detail">${constellationName}</div>
      <div class="star-detail">${spectralTypeDescription(star.spect)}${star.spect ? ` (${star.spect})` : ""}</div>
      <div class="star-detail">magnitude ${star.mag.toFixed(1)} &middot; ${distance}</div>
    `;
    starTooltip.style.left = `${Math.min(hoverX + 16, window.innerWidth - 260)}px`;
    starTooltip.style.top = `${hoverY + 16}px`;
    starTooltip.classList.remove("hidden");
  });
});

// --- clicking a planet in the sky opens its close-up ---
// (track the pointer so a drag doesn't count as a click)

let downX = 0;
let downY = 0;
canvas.addEventListener("pointerdown", (e) => {
  downX = e.clientX;
  downY = e.clientY;
});
canvas.addEventListener("pointerup", (e) => {
  if (!skyStarted || viewer.active || viewTransitioning) return;
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;

  if (solarSystem.active) {
    const key = solarSystem.pick(e.clientX, e.clientY);
    if (key) openBodyViewer(key);
    return;
  }

  if (!planets) return;
  const name = planets.pick(e.clientX, e.clientY, camera);
  if (name) openBodyViewer(name.toLowerCase());
});

// --- the birth constellation info panel ---

function showConstellationPanel(code: string) {
  if (!starMap || !constellations?.birthLinesVisible) return;

  // the brightest stars this constellation is drawn from
  const members = starMap.pickableStars
    .filter((star) => star.con === code)
    .sort((a, b) => a.mag - b.mag)
    .slice(0, 8);

  const rows = members
    .map((star) => {
      const distance = star.distLy ? `${Math.round(star.distLy).toLocaleString()} ly` : "? ly";
      return `
        <div class="star-row">
          <div class="star-name">${star.name}</div>
          <div class="star-detail">${spectralTypeDescription(star.spect)} &middot; mag ${star.mag.toFixed(1)} &middot; ${distance}</div>
        </div>
      `;
    })
    .join("");

  const name = CONSTELLATION_NAMES[code] ?? code;
  panelTitle.textContent = name;
  const whenWhere = birthContext ? formatObserverLabel(birthContext) : "";
  const accuracy = birthContext ? formatAccuracyNote(birthContext) : "";
  panelContent.innerHTML = `
    <div class="subtitle">sun in ${name.toLowerCase()} · ${whenWhere}</div>
    <div class="subtitle accuracy-note">${accuracy}</div>
    ${rows}
  `;
  constellationPanel.classList.remove("hidden");
  constellationPanel.classList.add("collapsed"); // stars first, details on demand
}

// --- load the sky for a given birthday ---

async function startSky(ctx: BirthContext, { skipIntro = false } = {}) {
  if (skyStarted || skyLoading) return;
  if (!isValidContext(ctx)) return;

  skyLoading = true;
  birthContext = ctx;
  if (!ctx.liveSky) {
    saveBirthContext(ctx);
    fillForm(ctx);
  }
  loadingText.classList.remove("hidden");

  const moment = parseBirthMoment(ctx);
  const jde = getJulianDay(moment);

  constellations = new Constellations();
  deepSky = new DeepSky();
  starMap = new StarMap();
  const [stars] = await Promise.all([starMap.load(), constellations.load()]);
  const birthCode = getSunConstellation(jde);

  deepSky.build();
  scene.add(stars);
  scene.add(deepSky.group);
  scene.add(constellations.group);

  planets = new Planets(labelContainer);
  planets.build(ctx);
  scene.add(planets.group);
  viewer.setSkyBackdrop(stars);
  solarSystem.setSkyBackdrop(stars);
  solarSystem.setConstellations(constellations.createBackdropGroup(800));
  constellations.setBackdropGroup(solarSystem.getConstellationGroup());
  solarSystem.build(ctx);

  skyStarted = true;
  skyLoading = false;
  loadingText.classList.add("hidden");

  birthConstellationCode = birthCode;
  setObjectLabelsVisible(true);
  skyControls.classList.remove("hidden");
  constellationStack.classList.remove("hidden");
  updateConstellationButtons();
  const skyConstellations = constellations!;

  if (skipIntro) {
    // coming back - drop straight into the sky, no landing screen or fly-in
    landing.remove();
    starMap.opacity = 1;
    skyConstellations.fadeIn(0.5);
    deepSky!.fadeIn(0.5);
    planets.fadeIn(0.5);
    bodyNav.classList.remove("hidden");

    const target = skyConstellations.highlight(birthCode);
    if (target) controls.lookAtRaDec(target.raHours, target.decDeg, 2);
    gsap.delayedCall(1, () => showConstellationPanel(birthCode));
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const starFade = reduceMotion ? 0.8 : 1.2;

  playLandingFade(() => {
    gsap.to(starMap, { opacity: 1, duration: starFade, ease: "power1.out" });
    revealSky(birthCode, skyConstellations);
  });
}

function revealSky(birthCode: string, skyConstellations: Constellations) {
  skyConstellations.fadeIn();
  deepSky?.fadeIn(5);
  planets!.fadeIn();
  bodyNav.classList.remove("hidden");

  const target = skyConstellations.highlight(birthCode);
  if (target) controls.lookAtRaDec(target.raHours, target.decDeg, 4);
  gsap.delayedCall(4.5, () => showConstellationPanel(birthCode));
}

function playLandingFade(onDone?: () => void) {
  const starsLayer = landing.querySelector(".landing-stars");
  const inner = landing.querySelector(".landing-inner");

  const tl = gsap.timeline({
    onComplete: () => {
      landing.remove();
      onDone?.();
    },
  });

  if (inner) {
    tl.to(inner, { opacity: 0, duration: 0.12, ease: "power2.in" }, 0);
  }
  if (starsLayer) {
    tl.to(starsLayer, { scale: 1.6, opacity: 0, duration: 0.22, ease: "power3.in" }, 0.04);
  }
  tl.to(landing, { opacity: 0, duration: 0.1, ease: "power2.in" }, 0.18);

  gsap.to(viewFade, {
    opacity: 0.55,
    duration: 0.06,
    delay: 0.12,
    yoyo: true,
    repeat: 1,
    ease: "power3.in",
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFormError();
  syncTimeUnknownUi();

  if (!dateInput.value || !/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) {
    dateInput.setCustomValidity("pick your full birth date.");
    dateInput.reportValidity();
    dateInput.setCustomValidity("");
    return;
  }

  if (!birthplaceInput.value.trim()) {
    showFormError("enter the city where you were born.");
    return;
  }

  const submitButton = form.querySelector(".submit-btn") as HTMLButtonElement;
  submitButton.disabled = true;
  submitButton.textContent = "looking up place…";

  try {
    let place = await resolveBirthPlace();
    if (!place && pendingPlaces.length > 1) {
      showFormError("pick your birth city from the list.");
      return;
    }
    if (!place) {
      showFormError("couldn't find that place — try city, state, country.");
      return;
    }

    setResolvedPlace(place);
    const ctx = buildContextFromForm();
    if (!ctx) {
      showFormError("something's missing — check your date and time.");
      return;
    }

    await startSky(ctx);
  } catch {
    showFormError("couldn't reach the place search — try again in a moment.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "show my sky";
  }
});

syncTimeUnknownUi();
initLandingStars();

// pick up where you left off, or show a clean form after "change date"
if (sessionStorage.getItem("birth-sky-pick-new")) {
  sessionStorage.removeItem("birth-sky-pick-new");
  dateInput.value = "";
  timeInput.value = DEFAULT_UNKNOWN_TIME;
  timeUnknownCheckbox.checked = false;
  syncTimeUnknownUi();
  birthplaceInput.value = "";
  clearResolvedPlace();
} else {
  const saved = loadBirthContext();
  if (saved) {
    fillForm(saved);
    startSky(saved, { skipIntro: true });
  }
}
