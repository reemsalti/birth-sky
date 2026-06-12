import { CONSTELLATION_NAMES } from "../Constellations";
import {
  CHINESE_ZODIAC_READINGS,
  CONSTELLATION_MYTHS,
  MOON_PHASE_READINGS,
  PLANET_READINGS,
  SABBAT_READINGS,
  SEASON_READINGS,
  TROPICAL_SIGN_READINGS,
  type TraditionReading,
} from "../data/skyReadings";
import type { NightFacts } from "./nightFacts";
import { formatAccuracyNote, formatObserverLabel, type BirthContext } from "./observer";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readingBlock({ tradition, insight, context }: TraditionReading): string {
  const contextHtml = context
    ? `<p class="reading-context">${escapeHtml(context)}</p>`
    : "";
  return `
    <div class="reading-block">
      <div class="reading-tradition">${escapeHtml(tradition)}</div>
      <p class="reading-insight">${escapeHtml(insight)}</p>
      ${contextHtml}
    </div>
  `;
}

function factRow(label: string, value: string): string {
  return `
    <div class="fact-row">
      <span class="fact-label">${escapeHtml(label)}</span>
      <span class="fact-value">${escapeHtml(value)}</span>
    </div>
  `;
}

export function renderNightReading(facts: NightFacts, ctx: BirthContext): string {
  const sunName = (CONSTELLATION_NAMES[facts.sunConstellationCode] ?? facts.sunConstellationCode).toLowerCase();
  const tropical = facts.tropicalSign;
  const tropicalReading = TROPICAL_SIGN_READINGS[tropical];
  const moonReading = MOON_PHASE_READINGS[facts.moonPhase];
  const chineseReading = CHINESE_ZODIAC_READINGS[facts.chineseAnimal];
  const sunMyth = CONSTELLATION_MYTHS[facts.sunConstellationCode];

  const illuminationPct = Math.round(facts.moonIllumination * 100);
  const moonSkyNote = facts.moonAboveHorizon
    ? `above the horizon (${illuminationPct}% lit)`
    : `below the horizon (${illuminationPct}% lit)`;

  const visibleText =
    facts.visibleBodies.length > 0 ? facts.visibleBodies.join(", ") : "none above the horizon";

  const tropicalToCode: Record<string, string> = {
    capricorn: "Cap",
    aquarius: "Aqr",
    pisces: "Psc",
    aries: "Ari",
    taurus: "Tau",
    gemini: "Gem",
    cancer: "Cnc",
    leo: "Leo",
    virgo: "Vir",
    libra: "Lib",
    scorpio: "Sco",
    sagittarius: "Sgr",
  };
  const astronomicalDiffersFromCalendar =
    facts.sunConstellationCode !== tropicalToCode[tropical];

  const factsHtml = `
    <div class="reading-facts">
      ${factRow("observer", formatObserverLabel(ctx))}
      ${factRow("sun (astronomical)", sunName)}
      ${factRow("zodiac (tropical calendar)", tropical)}
      ${factRow("moon phase", `${facts.moonPhase} · ${moonSkyNote}`)}
      ${factRow("visible planets", visibleText)}
      ${factRow("season", facts.season)}
    </div>
  `;

  const disclaimer = `
    <p class="reading-disclaimer">
      Interpretations below summarize how traditions have read skies like this — not scientific claims about you.
    </p>
  `;

  const astronomyNote = astronomicalDiffersFromCalendar
    ? `<p class="reading-aside">The sun's true constellation (${sunName}) differs from the tropical calendar sign (${tropical}) because western astrology uses fixed seasonal dates, not the sun's present position among the stars.</p>`
    : "";

  const approxNote = ctx.timeApproximate
    ? `<p class="reading-aside">With an approximate birth time, moon and planet visibility are estimated for the chosen evening hour.</p>`
    : "";

  const chineseAmbiguous = facts.chineseYearAmbiguous
    ? `<p class="reading-aside">Chinese zodiac years traditionally begin at Lunar New Year; early January or February births may fall in the prior animal year.</p>`
    : "";

  const traditionBlocks: TraditionReading[] = [
    tropicalReading,
    moonReading,
    chineseReading,
  ];

  if (sunMyth) traditionBlocks.push(sunMyth);

  if (facts.nearestSabbat && SABBAT_READINGS[facts.nearestSabbat]) {
    traditionBlocks.push(SABBAT_READINGS[facts.nearestSabbat]);
  } else if (SEASON_READINGS[facts.season]) {
    traditionBlocks.push(SEASON_READINGS[facts.season]);
  }

  for (const body of facts.visibleBodies.slice(0, 2)) {
    const planetReading = PLANET_READINGS[body];
    if (planetReading) traditionBlocks.push(planetReading);
  }

  const accuracy = formatAccuracyNote(ctx);
  const heading = ctx.liveSky ? "right now" : "that night";

  return `
    <div class="reading-section">
      <div class="reading-heading">${heading}</div>
      <p class="subtitle accuracy-note">${escapeHtml(accuracy)}</p>
      ${factsHtml}
      ${disclaimer}
      ${astronomyNote}
      ${approxNote}
      ${chineseAmbiguous}
      <div class="reading-traditions">
        <div class="reading-heading">readings</div>
        ${traditionBlocks.map(readingBlock).join("")}
      </div>
    </div>
  `;
}
