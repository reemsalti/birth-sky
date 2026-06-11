# Birth Sky — Project Brief

*Last updated: June 2026 — handoff / context dump after grav-jump intro blocker.*

## Concept

Enter your birth date, time, and birthplace to explore the night sky as it appeared at that moment. The app renders a real starfield, deep-sky nebulae, planet positions, constellation lines, and highlights the sun’s constellation for your date. Users can explore the full sky, hover stars and nebulae, zoom into planets, or view an animated solar system for their date/location.

**Tagline (landing):** *the heavens from your first breath, frozen in time*

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| 3D | Three.js (points, sprites, custom shaders) |
| Language | TypeScript |
| Build | Vite 8 |
| Astronomy | astronomia (VSOP87, moon position, sidereal time, solar longitude) |
| Animation | GSAP |
| Geocoding | OpenStreetMap Nominatim (search + reverse) |
| Fonts | Share Tech Mono (Google Fonts) |

---

## Running the Project

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build-stars + tsc + vite build
npm run build-stars  # regenerate public/data/stars.json from HYG CSV
```

---

## Data Sources

| Asset | Location | Notes |
|-------|----------|-------|
| HYG star database | `data/hygdata_v3.csv` | v3.8 from [HYG-Database](https://github.com/astronexus/HYG-Database) |
| Pre-filtered stars | `public/data/stars.json` | **5,070** stars + **977** pickable; built by `scripts/build-stars.mjs` |
| Constellation lines | `public/data/constellations.lines.json` | GeoJSON from [d3-celestial](https://github.com/ofrohn/d3-celestial) |
| Planet textures | `public/textures/*.jpg` | Solar System Scope (CC BY 4.0) |
| Deep-sky catalog | `src/data/deepSkyCatalog.ts` | **30** real Messier/NGC/IC objects; procedural canvas textures |

---

## File Structure

```
src/
  main.ts                 Entry, view routing, landing, render loop, tooltips
  StarMap.ts              Star points + uWarp grav-jump streak shader
  Constellations.ts       Line segments, birth highlight, backdrop clone
  DeepSky.ts              Nebula/remnant sprites, hover pick, fade-in
  Planets.ts              Geocentric sky planets/moon + DOM labels
  PlanetViewer.ts         Close-up textured bodies (OrbitControls)
  SolarSystemView.ts      Animated VSOP87 heliocentric orbits
  CameraController.ts     Sky drag/zoom, grav-jump intro (GSAP)
  SkyBackdrop.ts          Shared star geometry for sub-views
  CustomCursor.ts         HUD cursor on canvas
  bodies.ts               Close-up viewer body definitions
  data/
    deepSkyCatalog.ts     30 deep-sky objects with age + description
  utils/
    observer.ts           BirthContext, Julian day, horizon, sun constellation
    geocode.ts            Nominatim search/reverse (city, state labels)
    astro.ts              RA/dec → 3D sphere, SKY_RADIUS = 900
    constellationBounds.ts  IAU sun constellation from ecliptic λ
    spectralColor.ts      spectralTypeDescription() for tooltips
    nebulaTextures.ts     Procedural emission/planetary/reflection/SNR textures
    labels.ts             DOM labels with body occlusion
    geometryCache.ts      Shared sphere geometries (getRing removed)
    glowTexture.ts, textureCache.ts, dispose.ts

index.html                Landing form, sky chrome
src/style.css             HUD theme, landing stars, button hover glows
scripts/build-stars.mjs   HYG CSV → stars.json
```

---

## User Flow

### Landing (`#landing`)

1. Twinkling CSS stars (clustered + shine variants)
2. Title **birth sky** + tagline
3. Form:
   - Date + time (or “i don't know my birth time” → default 22:00)
   - Birth city search via Nominatim (`find` button, result list)
   - “born near where i am now?” (geolocation + reverse geocode)
4. **show my sky** — birth sky with grav-jump intro
5. **view current sky** — live sky from current location/time (does not persist to localStorage)
6. Button hover: per-button `::after` irregular blue/white blob glow (opaque `#000` button face, glow only outside)

### First visit → sky

1. `playLandingFade()` — quick landing fade + brief white flash
2. Stars fade in; `revealSky()` — constellations, deep sky, planets fade in; camera looks at birth constellation; panel after delay

### Return visits

- `localStorage` key `birth-sky-context` (full `BirthContext` JSON)
- Legacy migration from `birth-sky-birthday` (date only)
- `skipIntro: true` — no landing, no grav jump
- `sessionStorage` `birth-sky-pick-new` — clean form after **change date**

### In-sky

| Action | Behavior |
|--------|----------|
| Drag | Pan yaw/pitch (planetarium, camera at center) |
| Scroll | FOV zoom 20–75° |
| Star hover | Tooltip: name, constellation, spectral type, mag, distance |
| Nebula hover | Tooltip: name, type, description, **age** |
| Planet click | Close-up `PlanetViewer` |
| Solar system btn | `SolarSystemView` with animated VSOP87 orbits |
| Sky controls | Toggle constellations, birth constellation, labels |
| Solar controls | Toggle orbits, backdrop stars (solar view only) |
| change date | Clears storage, reloads landing |

---

## BirthContext (`utils/observer.ts`)

```ts
interface BirthContext {
  date: string;           // YYYY-MM-DD
  time: string;           // HH:MM local
  latitude: number;
  longitude: number;
  placeName?: string;
  timeApproximate?: boolean;
  liveSky?: boolean;      // view current sky — not saved to localStorage
}
```

- Sun constellation: real IAU bounds from apparent ecliptic longitude (not tropical zodiac sign alone)
- Planets/moon: geocentric for observer lat/lon/time
- Horizon filter on planets only (`isAboveHorizon`); **stars are not horizon-clipped** (removed `StarMap.applyHorizon` — caused diagonal sky cutoff)

---

## View Modes

| Mode | Scene | Camera | Controls |
|------|-------|--------|----------|
| Sky map | stars, deep sky, lines, sky planets | `CameraController` | drag + scroll FOV |
| Planet close-up | `PlanetViewer` | OrbitControls | orbit + zoom |
| Solar system | `SolarSystemView` | OrbitControls | orbit + zoom; animated orbits |

Transitions use `#view-fade` crossfade.

---

## First-visit transition

Grav-jump / warp intro **removed** (Jun 2026). First visit: `playLandingFade()` → stars fade in → `revealSky()`.

## Deep Sky (`DeepSky.ts` + catalog)

- 30 galactic nebulae/remnants (not solar-system objects)
- Procedural textures: emission, planetary, reflection, supernova_remnant
- Sprites on inner sky sphere, `depthTest: false`, additive blend
- Hover tooltips with **age** strings (e.g. Crab ~970 yr, Orion ~1–2 Myr)
- `findAtScreen()` for picking
- Visibility was poor initially — boosted opacity, renderOrder, size boost 1.25×

---

## Landing Page UI (evolution)

| Iteration | State |
|-----------|--------|
| Interstellar-style | Horizontal warp band, horizon silhouette, lens arc, Cormorant serif — **mostly reverted** |
| Current | CSS twinkle stars only; mono title; form glow on **button hover only** (irregular `::after` blob, not through opaque button) |
| Removed | Eyebrow “a map of the heavens”, white horizon streak, building silhouette, planet/lens arc, full-form glow |

---

## UI / Design (current)

- **Font:** Share Tech Mono, lowercase UI
- **Colors:** cool HUD — `#e4e0d8` accent, `#eceae6` text, `#8a8f96` muted, dark tint panels
- **Chrome:** rounded 10–16px, no borders, `backdrop-filter: blur`
- **Panels:** `#constellation-stack` (bottom-left): collapsible constellation panel + **change date** below it
- **Custom cursor** on sky canvas

---

## Performance

- Pre-built `stars.json` (5k stars, not full HYG in browser)
- Star hover: one hit-test per animation frame
- Render pauses when `document.hidden`
- Sky view: continuous render when `skyStarted` (labels + camera)
- `build-stars` runs on every `npm run build`

---

## Persistence

| Key | Content |
|-----|---------|
| `birth-sky-context` | Full `BirthContext` JSON |
| `birth-sky-birthday` | Legacy date-only (migrated on load) |
| `birth-sky-pick-new` | sessionStorage — clear form on change date |

Live sky (`liveSky: true`) is **not** saved.

---

## Geocoding (`utils/geocode.ts`)

- `searchPlaces(query)` → up to 5 results, `city, state` for US/CA/AU/IN
- `reversePlace(lat, lon)` → single object (fixed: reverse API returns object not array)
- Used by birth form and **view current sky**

---

## Solar System (recent)

- Animated VSOP87 3D orbits (replaced flat rings)
- Toggle orbits / toggle backdrop stars in solar view
- Labels deferred until solar view shown (fixed ghost label bug)

---

## Known Gotchas / History

- HYG CSV URL moved to `hyg/v3/hyg_v38.csv.gz`
- Horizon clip on stars → harsh diagonal → **removed** `applyHorizon`
- Ghost label top-left → solar labels created only on `show()`
- Nominatim reverse geocode was broken (`[json]` destructuring on object) — fixed
- `#loading-text` was never hidden — fixed in `startSky`
- Dead code removed: `getRing`, `spectralTypeToColor` runtime, `applyHorizon`, shared form glow
- Constellation panel: sun in {IAU constellation} · time · place; accuracy note for approx time
- Tropical zodiac sign ≠ IAU sun constellation (e.g. Nov 21 2000 still Libra)

---

## Conversation Summary (Jun 2026 session)

Work in this session (not exhaustive):

1. **Location labels** — city, state / city, country via Nominatim formatting
2. **Landing copy** — tagline, larger title (mono), spacing tweaks
3. **Landing stars** — twinkle, shines, size variation, clustering
4. **View current sky** — geolocation + `buildLiveSkyContext`, no localStorage overwrite
5. **Grav-jump intro** — multiple iterations; user wanted Starfield/NMS feel; still **broken / stuck**
6. **Deep sky** — 30 objects, tooltips with ages; not in solar system
7. **Landing cinematic** — partial Interstellar vibe, then stripped to stars + button glows
8. **Button glow** — per-button hover, opaque face, irregular blue/white blob
9. **Title font** — reverted from Cormorant to Share Tech Mono
10. **Code cleanup** — redundant warp/horizon/geocode/ CSS removed

**No git commits** unless user explicitly requests.

---

## Possible Future Work

- [x] **Grav-jump intro removed** — simple landing fade + star reveal
- [ ] Deep-sky visibility toggle
- [ ] Real Hubble textures for nebulae
- [ ] Zodiac sign label alongside IAU constellation
- [ ] Horizon-aware deep-sky visibility
- [ ] IndexedDB cache for stars.json
- [ ] change date without full reload

---

## Dependencies

```json
{
  "dependencies": {
    "astronomia": "^4.2.0",
    "gsap": "^3.15.0",
    "three": "^0.184.0"
  },
  "devDependencies": {
    "@types/three": "^0.184.1",
    "typescript": "^6.0.3",
    "vite": "^8.0.16"
  }
}
```
