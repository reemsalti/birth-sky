# Birth Sky — Project Brief

*Last updated: June 2026*

## Concept

Enter your birth date, time, and birthplace to explore the night sky as it appeared at that moment. The app renders a real starfield, deep-sky nebulae, planet positions, constellation lines, and highlights the sun’s constellation for your date. Users can explore the full sky, hover stars and nebulae, read cultural interpretations of that night, zoom into planets, or view an animated solar system.

**Tagline (landing):** *the heavens from your first breath, frozen in time*

**Live site:** https://reemsalti.github.io/birth-sky/  
**Repo:** https://github.com/reemsalti/birth-sky

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
| Font | Share Tech Mono (Google Fonts) |
| Deploy | GitHub Pages via Actions (`.github/workflows/deploy.yml`) |

---

## Running the Project

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build-stars + tsc + vite build
npm run build-stars  # regenerate public/data/stars.json from HYG CSV
```

Production builds set `VITE_BASE_PATH=/birth-sky/` for GitHub Pages. Local dev uses `/`.

---

## Data Sources

| Asset | Location | Notes |
|-------|----------|-------|
| HYG star database | `data/hygdata_v3.csv` | v3.8 from [HYG-Database](https://github.com/astronexus/HYG-Database) |
| Pre-filtered stars | `public/data/stars.json` | **5,070** stars + **977** pickable; built by `scripts/build-stars.mjs` |
| Constellation lines | `public/data/constellations.lines.json` | GeoJSON from [d3-celestial](https://github.com/ofrohn/d3-celestial) |
| Planet / moon textures | `public/textures/*.jpg` | Solar System Scope + NASA 3D Resources; procedural maps for Ceres, Eris, Haumea, Makemake |
| Deep-sky catalog | `src/data/deepSkyCatalog.ts` | **30** real Messier/NGC/IC objects; procedural canvas textures |
| Sky readings | `src/data/skyReadings.ts` | Scholarly tradition copy for info panel |

---

## File Structure

```
src/
  main.ts                 Entry, view routing, landing, tooltips, panel, persistence
  StarMap.ts              Star points + hover pick
  Constellations.ts       Line segments, birth highlight, backdrop clone
  DeepSky.ts              Nebula/remnant sprites, hover pick, fade-in
  Planets.ts              Geocentric sky planets/moon + DOM labels
  PlanetViewer.ts         Close-up textured bodies, moons, rings (OrbitControls)
  SolarSystemView.ts      VSOP87 + dwarf-planet orbits, asteroid belt haze
  CameraController.ts     Sky drag/zoom camera
  SkyBackdrop.ts          Shared star geometry for sub-views
  HorizonGlow.ts          Bottom-of-screen atmospheric haze (CSS overlay)
  CustomCursor.ts         Minimal lens cursor on canvas
  bodies.ts               Close-up viewer body definitions
  data/
    deepSkyCatalog.ts     30 deep-sky objects with age + description
    skyReadings.ts        Tradition readings (insight + context)
  utils/
    observer.ts           BirthContext, Julian day, horizon, persistence, liveSky
    dwarfPlanets.ts       Keplerian ephemeris for Ceres, Pluto, Eris, Haumea, Makemake
    pluto.ts              Re-exports dwarf-planet helpers (backward compat)
    planetaryRings.ts     Sun-lit ring meshes (Saturn, Uranus, Neptune)
    nightFacts.ts         Moon phase, tropical sign, visible bodies, Chinese zodiac
    nightReading.ts       HTML builder for info panel readings tab
    geocode.ts            Nominatim search/reverse (city, state labels)
    astro.ts              RA/dec → 3D sphere, SKY_RADIUS = 900
    assets.ts             assetUrl() for GitHub Pages base path
    constellationBounds.ts  IAU sun constellation from ecliptic λ
    spectralColor.ts      spectralTypeDescription() for tooltips
    nebulaTextures.ts     Procedural emission/planetary/reflection/SNR textures
    labels.ts             DOM labels with body occlusion
    textureCache.ts, glowTexture.ts, geometryCache.ts, dispose.ts

index.html                Landing form, sky chrome
src/style.css             HUD theme, landing stars, button hover glows, horizon haze
vite.config.ts            base path from VITE_BASE_PATH
.github/workflows/deploy.yml  GitHub Pages deploy on push to main
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
4. **show my sky** — birth sky with landing fade intro
5. **view current sky** — live sky from current location/time (does not persist to localStorage)
6. Button hover: per-button `::after` irregular blue/white blob glow (opaque button face, glow only outside)

### First visit → sky

1. `playLandingFade()` — quick landing fade + brief white flash
2. Stars fade in; `revealSky()` — constellations, deep sky, planets, horizon haze fade in
3. Camera looks at birth constellation; constellation panel opens after delay

### Return visits

- `localStorage` key `birth-sky-context` (full `BirthContext` JSON)
- Legacy migration from `birth-sky-birthday` (date only)
- `restoreSavedSky()` — landing hidden immediately, loading overlay, `skipIntro: true`
- `sessionStorage` `birth-sky-pick-new` — clean form after **change date**

### In-sky

| Action | Behavior |
|--------|----------|
| Drag | Pan yaw/pitch (planetarium, camera at center) |
| Scroll | FOV zoom 20–75° |
| Star hover | Tooltip: name, constellation, spectral type, mag, distance (only when cursor is over `#sky` canvas) |
| Nebula hover | Tooltip: name, type, description, **age** |
| Planet click | Close-up `PlanetViewer` |
| Moon hover (close-up) | Tooltip with moon name |
| Solar system btn | `SolarSystemView` with animated orbits + asteroid belt |
| Sky controls | Toggle constellations, labels (birth sky only: birth constellation) |
| Solar controls | Toggle orbits, backdrop stars (**solar system view only**) |
| Info panel | Side tuck tab slides panel off left; open expanded by default |
| change date | Birth sky only — clears storage, reloads landing |

### Birth sky vs current sky

| Feature | Birth sky | Current sky (`liveSky: true`) |
|---------|-----------|-------------------------------|
| Persistence | Saved to `localStorage` | Not saved |
| Info panel tab | **that night** | **right now** |
| Hide birth constellation toggle | Shown | Hidden |
| change date footer | Shown | Hidden |
| Hide constellations | Dims all lines; **keeps birth constellation highlight** | Hides **all** constellation lines (no separate highlight) |
| Readings | Framed for birth moment | Same factual block; observer label shows `now · place` |

### Body navigation

- Main bar: Sun through Neptune
- **dwarf planets ▾** submenu: Ceres, Pluto, Eris, Haumea, Makemake
- Close-up viewer: major moons per planet (textured where maps exist), stylized orbit speeds
- Haumea: triaxial ellipsoid shape (~1960 × 1518 × 996 km proportions)

---

## “That Night” / “Right Now” Readings

Computed in `nightFacts.ts`, rendered in `nightReading.ts`, copy in `skyReadings.ts`.

### Factual block

- Observer time and place
- Sun’s astronomical constellation (IAU)
- Tropical calendar zodiac sign
- Moon phase + above/below horizon
- Visible planets
- Season at birthplace

### Interpretive readings (scholarly framing)

Each entry has an **insight** (what traditions read from this) and optional **context** (historical background). Disclaimer states these are cultural interpretations, not scientific forecasts.

| Tradition | Content |
|-----------|---------|
| Western astrology | Tropical sun sign temperament |
| Lunar interpretation | Moon phase meaning |
| Chinese zodiac | Birth-year animal character |
| Greek star-lore | Myth for sun’s constellation |
| Seasonal symbolism | Season or nearby solstice/equinox |
| Classical sky-reading | Up to 2 visible planets (incl. dwarf planets when above horizon) |

Tropical zodiac ≠ IAU sun constellation is explained when they differ.

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

- Sun constellation: real IAU bounds from apparent ecliptic longitude
- Planets/moon: geocentric for observer lat/lon/time
- Horizon filter on planets only (`isAboveHorizon`); stars are **not** horizon-clipped
- **Known gap:** `parseBirthMoment()` uses browser local timezone, not birthplace timezone

---

## View Modes

| Mode | Scene | Camera | Controls |
|------|-------|--------|----------|
| Sky map | stars, deep sky, lines, sky planets | `CameraController` | drag + scroll FOV |
| Planet close-up | `PlanetViewer` | OrbitControls | orbit + zoom |
| Solar system | `SolarSystemView` | OrbitControls | orbit + zoom; real-time orbital motion |

Transitions use `#view-fade` crossfade.

---

## UI Layout (current)

| Area | Position | Contents |
|------|----------|----------|
| Top left | fixed | ← back to sky (sub-views only) |
| Top right | fixed | Sky toggles (constellations, labels; birth constellation in birth sky only) |
| Bottom left | fixed | `#constellation-stack`: info panel + side tuck tab; **change date** footer (birth sky only) |
| Bottom center | fixed | `#body-nav`: solar system pill + planets + dwarf planets submenu |
| Canvas overlay | fixed | `#horizon-haze` — subtle bottom gradient |
| Cursor | fixed | Minimal lens (dot + faint ring); disabled on touch devices |

### Design tokens

- **Font:** Share Tech Mono, lowercase UI
- **HUD:** `--hud-surface`, borders, shadows, `backdrop-filter: blur`
- **Panels:** scrollable body, ~22.5rem wide info panel, tuck tab on right edge

---

## Deep Sky (`DeepSky.ts` + catalog)

- 30 galactic nebulae/remnants (not solar-system objects)
- Procedural per-object textures in `nebulaTextures.ts` (type-specific palettes)
- Sprites on inner sky sphere, `frustumCulled: false`, additive blend
- Hover tooltips with **age** strings
- `findAtScreen()` for picking

---

## Solar System

- Animated VSOP87 heliocentric orbits for Mercury–Neptune
- **Dwarf planets** via Keplerian elements in `dwarfPlanets.ts`: Ceres (inner belt), Pluto, Eris, Haumea, Makemake (outer)
- **Asteroid belt** point cloud (~2.2–3.3 AU) between Mars and Jupiter
- **Planetary rings:** Saturn (textured + inner/outer bands), Uranus/Neptune (procedural multi-band; Neptune Adams-ring arcs)
- **Real-time speed** (`simDays += dt / 86400`) — motion is accurate but very slow
- Toggle orbits / toggle backdrop stars — **only visible in solar system view** (`body.solar-system-view`)
- Labels created only on `show()` (fixed ghost label bug)

---

## Performance

- Pre-built `stars.json` (5k stars, not full HYG in browser)
- Star hover: one hit-test per animation frame; skipped when not over canvas
- Render pauses when `document.hidden`
- Sky view: continuous render when `skyStarted`
- `build-stars` runs on every `npm run build`
- Production JS bundle ~2 MB (astronomia VSOP87 data inlined)

---

## Persistence

| Key | Content |
|-----|---------|
| `birth-sky-context` | Full `BirthContext` JSON — saved on sky load |
| `birth-sky-birthday` | Legacy date-only (migrated on load) |
| `birth-sky-pick-new` | sessionStorage — clear form on change date |

Live sky (`liveSky: true`) is **not** saved.

---

## Geocoding (`utils/geocode.ts`)

- `searchPlaces(query)` → up to 5 results, `city, state` for US/CA/AU/IN
- `reversePlace(lat, lon)` → single object
- Used by birth form and **view current sky**

---

## Deployment

- GitHub repo: `reemsalti/birth-sky`
- GitHub Pages at `/birth-sky/` subpath
- `src/utils/assets.ts` + `import.meta.env.BASE_URL` for textures and JSON fetch paths
- Push to `main` triggers `.github/workflows/deploy.yml`

---

## Known Gotchas / History

- **Grav-jump intro removed** (Jun 2026) — was broken; replaced with `playLandingFade()`
- HYG CSV URL: `hyg/v3/hyg_v38.csv.gz`
- Horizon clip on stars removed (`applyHorizon`) — caused harsh diagonal cutoff
- 3D horizon great-circle glow tried and removed — read as diagonal orange band; replaced with CSS `#horizon-haze`
- Constellation panel overflow fixed — flex layout, scrollable body, tuck tab (replaced dismiss ×)
- Live sky mode: birth-only UI hidden; hide constellations hides all lines (no orphan highlight)
- Orbits/stars toggles gated to solar system view only
- Dwarf planets, moon textures, moon hover tooltips, richer ring rendering (Jun 2026)
- Star tooltips blocked when hovering HUD panels (`pointerIsOverSky()`)
- Tropical zodiac sign ≠ IAU sun constellation (e.g. late October births)
- Nominatim reverse geocode object-not-array bug — fixed
- `#loading-text` moved outside landing for restore flow

---

## Possible Future Work

- [ ] Birthplace timezone for accurate Julian date / rising sign
- [ ] Shareable URL with birth params (`?date=&lat=&lon=`)
- [ ] Lazy-load PlanetViewer / SolarSystemView (smaller initial bundle)
- [ ] Solar system speed multiplier toggle
- [ ] Deep-sky visibility toggle
- [ ] Real Hubble textures for nebulae
- [ ] First-load onboarding hints
- [ ] Idle render pause when camera still
- [ ] change date without full page reload

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
