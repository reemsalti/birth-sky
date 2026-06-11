# Birth Sky

Enter your birthday and explore the night sky exactly as it was on that date — real stars, real planet positions, and your birth constellation highlighted.

## Running it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## How it works

- **Stars** come from the [HYG database](https://github.com/astronexus/HYG-Database) (`public/data/hygdata_v3.csv`). Everything brighter than magnitude 6.5 (naked-eye visible) is rendered as a point, colored by spectral type and sized by brightness.
- **Planets** are positioned with the [astronomia](https://github.com/commenthol/astronomia) library using the full VSOP87 theory — their real geocentric positions for the date you enter.
- **Constellation lines** come from [d3-celestial](https://github.com/ofrohn/d3-celestial). Your zodiac constellation gets highlighted and the camera drifts toward it, with a panel listing the stars it's made of.
- **Close-up views** of the Sun, every planet, and the Moon — real textures (Jupiter's Red Spot, Saturn's rings), major moons, and a fact card. Textures are from [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0).

## Controls

- **Drag** to look around, **scroll** to zoom
- **Hover** a bright star for its name, type, magnitude, and distance
- **Click** a planet (or use the bottom bar) for a close-up you can orbit from any angle
- Leave it alone for a few seconds and the camera drifts on its own

## Project layout

```
src/
  main.ts               entry point, wires everything together
  StarMap.ts            loads HYG data, builds the star particle system
  Constellations.ts     constellation lines + highlighting
  Planets.ts            planet/moon sky positions and rendering
  PlanetViewer.ts       close-up body viewer (textures, moons, rings)
  bodies.ts             data for the close-up viewer
  CameraController.ts   drag/zoom controls + scripted camera moves
  utils/astro.ts        Julian dates, RA/dec -> 3D coords, zodiac lookup
  utils/spectralColor.ts  spectral type -> star color
```
