import type { ChineseAnimal, MoonPhaseName, TropicalSign } from "../utils/nightFacts";

export interface TraditionReading {
  tradition: string;
  insight: string;
  context?: string;
}

export const TROPICAL_SIGN_READINGS: Record<TropicalSign, TraditionReading> = {
  capricorn: {
    tradition: "Western astrology",
    insight:
      "A Capricorn-season birth is traditionally read as serious and enduring — inclined toward duty, long goals, and earning trust slowly rather than seeking quick acclaim.",
    context: "The sea-goat links earthly ambition to depths below the surface; Saturn, its classical ruler, governs limits and maturation.",
  },
  aquarius: {
    tradition: "Western astrology",
    insight:
      "Aquarius is often interpreted as independent and future-minded — drawn to ideas, communities, and reforms that outlast a single lifetime.",
    context: "The water-bearer pours out rather than hoards; in modern astrology it is tied to Uranus and sudden breaks with convention.",
  },
  pisces: {
    tradition: "Western astrology",
    insight:
      "Pisces births are classically associated with empathy, imagination, and porous boundaries — absorbing atmosphere and symbol more readily than fixed fact.",
    context: "Two fish pulling in different directions suggest both transcendence and vulnerability at the year's close.",
  },
  aries: {
    tradition: "Western astrology",
    insight:
      "An Aries-season birth is read as initiating and direct — suited to first steps, contests, and moments that require courage before caution.",
    context: "The ram opens the tropical year at the vernal equinox, when daylight overtakes night in the northern hemisphere.",
  },
  taurus: {
    tradition: "Western astrology",
    insight:
      "Taurus is traditionally linked to steadiness, bodily pleasure, and loyalty — building slowly, holding fast, and valuing what can be touched and kept.",
    context: "The bull is one of the oldest zodiac figures, tied in antiquity to spring pastures and the Pleiades.",
  },
  gemini: {
    tradition: "Western astrology",
    insight:
      "Gemini is read as quick, curious, and relational — comfortable with change, conversation, and holding more than one perspective at once.",
    context: "The twins Castor and Pollux embody mortal skill beside immortal strength.",
  },
  cancer: {
    tradition: "Western astrology",
    insight:
      "Cancer-season births are associated with memory, protection, and belonging — attuned to home, lineage, and the moods of others.",
    context: "The crab carries its shelter on its back; the moon is this sign's classical ruler.",
  },
  leo: {
    tradition: "Western astrology",
    insight:
      "Leo is interpreted as expressive and magnanimous — inclined toward visibility, creative risk, and the warmth of being seen clearly.",
    context: "The Nemean lion was Heracles' first labor; the sign sits at high summer in the northern sky.",
  },
  virgo: {
    tradition: "Western astrology",
    insight:
      "Virgo is read as discerning and service-minded — attentive to detail, craft, and what must be corrected before it can be offered.",
    context: "The maiden is often linked to harvest goddesses and the last weeks of summer labor.",
  },
  libra: {
    tradition: "Western astrology",
    insight:
      "Libra is associated with balance, fairness, and partnership — weighing alternatives and seeking harmony in public as well as private life.",
    context: "Scales are unique among zodiac figures; the sign opens the autumn quarter in the tropical system.",
  },
  scorpio: {
    tradition: "Western astrology",
    insight:
      "Scorpio is traditionally read as intense and transformative — drawn to what is hidden, binding, or worth risking everything to understand.",
    context: "The scorpion's mythic feud with Orion keeps the two constellations apart in the sky.",
  },
  sagittarius: {
    tradition: "Western astrology",
    insight:
      "Sagittarius is linked to aim, distance, and belief — the need to search, teach, and test limits rather than remain in familiar territory.",
    context: "The centaur archer points toward the galactic center in the modern sky.",
  },
};

export const MOON_PHASE_READINGS: Record<MoonPhaseName, TraditionReading> = {
  "new moon": {
    tradition: "Lunar interpretation",
    insight:
      "A new-moon birth is often read as inward and initiatory — a life beginning in darkness, with potential not yet visible to others.",
    context: "Many calendars treat the new moon as the month's true opening.",
  },
  "waxing crescent": {
    tradition: "Lunar interpretation",
    insight:
      "The waxing crescent suggests emergence — intentions forming, confidence gathering, and a life that grows more legible with time.",
    context: "The hilal crescent marks new months in the Islamic calendar.",
  },
  "first quarter": {
    tradition: "Lunar interpretation",
    insight:
      "A first-quarter moon is read as a moment of decision — tension between impulse and obstacle, when action must be chosen over waiting.",
    context: "Half-lit moons divide the lunation into phases of effort and release.",
  },
  "waxing gibbous": {
    tradition: "Lunar interpretation",
    insight:
      "The waxing gibbous is associated with refinement before culmination — adjusting, perfecting, and preparing for what is almost in reach.",
    context: "Agrarian societies often worked late under brightening moons before harvest.",
  },
  "full moon": {
    tradition: "Lunar interpretation",
    insight:
      "A full-moon birth is traditionally read as vivid and exposed — emotions, events, and character traits more visible, as if lit from within.",
    context: "Full moons anchor festivals from Purnima rites to harvest celebrations worldwide.",
  },
  "waning gibbous": {
    tradition: "Lunar interpretation",
    insight:
      "The waning gibbous suggests gratitude and distribution — sharing what was gained, teaching what was learned, and loosening the grip on peak intensity.",
    context: "Post-full phases are linked to thanksgiving and communal closure in many folk calendars.",
  },
  "last quarter": {
    tradition: "Lunar interpretation",
    insight:
      "A last-quarter birth is read as reflective and revisionary — inclined to question prior choices and reorganize before the cycle renews.",
    context: "Several Indigenous lunar counts treat this phase as a time for assessment.",
  },
  "waning crescent": {
    tradition: "Lunar interpretation",
    insight:
      "The waning crescent is associated with surrender and dream-life — endings that fertilize the next beginning, often called the balsamic phase in modern astrology.",
    context: "The old moon is nearly invisible; many traditions place prayer and rest here.",
  },
};

export const PLANET_READINGS: Record<string, TraditionReading> = {
  Mercury: {
    tradition: "Classical sky-reading",
    insight:
      "Mercury above the horizon was read as favoring speech, trade, and nimble thought — a witness to births inclined toward message-bearing and mediation.",
    context: "The swiftest planet carried the caduceus of Hermes in Greco-Roman symbolism.",
  },
  Venus: {
    tradition: "Classical sky-reading",
    insight:
      "Venus as a visible evening or morning star was linked to attraction, artistry, and accord — beauty made conspicuous at the hour of birth.",
    context: "Greece once named its two appearances Phosphorus and Hesperus before uniting them under Aphrodite.",
  },
  Mars: {
    tradition: "Classical sky-reading",
    insight:
      "Mars in the sky was traditionally read as heating and sharpening — courage, conflict, and the will to act when others hesitate.",
    context: "Its red light associated it with war gods from Nergal to Ares.",
  },
  Jupiter: {
    tradition: "Classical sky-reading",
    insight:
      "Jupiter's presence was considered auspicious — expansion, protection, and a generous arc to the life story, as befits the king of planets.",
    context: "Hellenistic astrologers treated Jupiter as the greater benefic.",
  },
  Saturn: {
    tradition: "Classical sky-reading",
    insight:
      "Saturn above the horizon was read as sobering and structuring — demanding patience, discipline, and respect for limits that cannot be rushed.",
    context: "Cronus/Saturn marked the outermost classical planet and the passage of time.",
  },
  Pluto: {
    tradition: "Classical sky-reading",
    insight:
      "Pluto is far too faint for the naked eye, but when included in a birth chart it is sometimes read as transformation — slow, deep change at the edges of what is known.",
    context: "Discovered in 1930 and reclassified as a dwarf planet in 2006.",
  },
  Ceres: {
    tradition: "Classical sky-reading",
    insight:
      "Ceres is too faint for most naked-eye viewing, yet in some chart traditions it is read as nourishment and cycles of loss and return — what must be tended to grow again.",
    context: "The first asteroid discovered (1801) and the only dwarf planet in the inner solar system.",
  },
  Eris: {
    tradition: "Classical sky-reading",
    insight:
      "Eris is far beyond naked-eye reach, but where included it is sometimes read as disruption that clears stale order — naming what was ignored until it cannot be.",
    context: "Its 2005 discovery helped prompt the IAU's dwarf-planet definition.",
  },
  Haumea: {
    tradition: "Classical sky-reading",
    insight:
      "Haumea is invisible without a telescope; where used symbolically it can suggest rapid reshaping — form stretched thin until something new emerges.",
    context: "Named for the Hawaiian goddess of childbirth, with two moons and a ring.",
  },
  Makemake: {
    tradition: "Classical sky-reading",
    insight:
      "Makemake is too distant and dim for the unaided eye; in some readings it hints at hidden fertility — life persisting in cold, distant places.",
    context: "Named for the Rapa Nui creator deity; one of the largest known Kuiper belt objects.",
  },
  Moon: {
    tradition: "Classical sky-reading",
    insight:
      "A visible moon at birth was thought to color temperament through change itself — memory, mood, and responsiveness to cycles of light and dark.",
    context: "Antiquity classed the moon among the wandering planets and tied it to bodily humors.",
  },
};

export const CHINESE_ZODIAC_READINGS: Record<ChineseAnimal, TraditionReading> = {
  rat: {
    tradition: "Chinese zodiac",
    insight:
      "The Rat year is read as clever and conserving — alert to opportunity, skilled at gathering resources, and quick to recover from setback.",
    context: "The Rat leads the folk cycle and rules the midnight double-hour.",
  },
  ox: {
    tradition: "Chinese zodiac",
    insight:
      "The Ox suggests reliability and patient labor — strength that endures routine and keeps promises when flashier temperaments fade.",
    context: "Farm culture elevated the ox as the backbone of harvest.",
  },
  tiger: {
    tradition: "Chinese zodiac",
    insight:
      "The Tiger is associated with boldness and charisma — a commanding presence that protects as fiercely as it advances.",
    context: "Tigers appear as guardians on temples and children's clothing across East Asia.",
  },
  rabbit: {
    tradition: "Chinese zodiac",
    insight:
      "The Rabbit (Cat in Vietnam) is read as gentle and tactful — favoring diplomacy, comfort, and subtle influence over open confrontation.",
    context: "The Jade Rabbit on the moon is a familiar East Asian motif.",
  },
  dragon: {
    tradition: "Chinese zodiac",
    insight:
      "The Dragon year is considered especially auspicious — linked to vitality, leadership, and the capacity to summon change on a large scale.",
    context: "It is the cycle's only mythical animal and a long-standing imperial emblem.",
  },
  snake: {
    tradition: "Chinese zodiac",
    insight:
      "The Snake is read as perceptive and strategic — attentive to what others overlook, and capable of deep renewal through shedding the old skin.",
    context: "Serpent wisdom appears in Chinese, Greek, and Indian medical symbolism alike.",
  },
  horse: {
    tradition: "Chinese zodiac",
    insight:
      "The Horse suggests freedom, speed, and social energy — restlessness in service of distance, adventure, and wide acquaintance.",
    context: "Steppe and trade routes made the horse a symbol of mobility and fortune.",
  },
  goat: {
    tradition: "Chinese zodiac",
    insight:
      "The Goat (Sheep) is associated with artistry and calm — preferring harmony, craft, and pastoral ease to ruthless competition.",
    context: "Pastoral abundance and brush-painting gentleness attach to this sign in folk art.",
  },
  monkey: {
    tradition: "Chinese zodiac",
    insight:
      "The Monkey is read as inventive and irreverent — solving problems by wit, mimicry, and refusal to accept fixed rules.",
    context: "Sun Wukong, the Monkey King, is one of China's great trickster heroes.",
  },
  rooster: {
    tradition: "Chinese zodiac",
    insight:
      "The Rooster suggests punctuality, pride, and frank speech — crowing at dawn, unafraid to name what others leave unsaid.",
    context: "Roosters were kept as living alarms and protective yard spirits.",
  },
  dog: {
    tradition: "Chinese zodiac",
    insight:
      "The Dog is read as loyal and morally alert — defending kin, sensing danger early, and valuing trust above spectacle.",
    context: "Confucian ethics and village life both elevated the faithful dog.",
  },
  pig: {
    tradition: "Chinese zodiac",
    insight:
      "The Pig closes the cycle with abundance and sincerity — enjoyment of life's comforts earned through honest work rather than cunning.",
    context: "Regional New Year customs treat the Pig as a harbinger of plenty.",
  },
};

export const CONSTELLATION_MYTHS: Record<string, TraditionReading> = {
  Ari: {
    tradition: "Greek star-lore",
    insight:
      "Aries' golden fleece was a prize worth kingdoms — readers of the sky have long associated this figure with sacrifice that later becomes treasure.",
    context: "Phrixus rode the ram to Colchis; Jason's quest followed.",
  },
  Tau: {
    tradition: "Greek star-lore",
    insight:
      "Taurus carries themes of desire and earthly power — beauty that moves across borders and reshapes fate.",
    context: "Zeus as a bull bore Europa to Crete; the Pleiades cluster lies within the figure.",
  },
  Gem: {
    tradition: "Greek star-lore",
    insight:
      "Gemini speaks to doubled nature — mortal skill paired with divine favor, and loyalty that survives death.",
    context: "Castor and Pollux alternate between the underworld and the heavens.",
  },
  Cnc: {
    tradition: "Greek star-lore",
    insight:
      "Cancer is a small but tenacious figure — persistence in the margins, and protection that arrives from unexpected quarters.",
    context: "Hera sent the crab during Heracles' battle with the Hydra.",
  },
  Leo: {
    tradition: "Greek star-lore",
    insight:
      "Leo symbolizes a trial that must be faced directly — courage tested against something that cannot be avoided.",
    context: "The Nemean lion's hide became Heracles' armor.",
  },
  Vir: {
    tradition: "Greek star-lore",
    insight:
      "Virgo is tied to innocence leaving the world — grief for what is lost and care for what must still be gathered in.",
    context: "Demeter, Persephone, and Astraea are all linked to this constellation.",
  },
  Lib: {
    tradition: "Greek star-lore",
    insight:
      "Libra asks what is fair when outcomes are uncertain — judgment suspended until the scales settle.",
    context: "The scales were not always distinct from Scorpius in ancient star-catalogues.",
  },
  Sco: {
    tradition: "Greek star-lore",
    insight:
      "Scorpius embodies fatal encounter — intensity that cannot share the sky with boastful strength.",
    context: "Orion and the scorpion are placed on opposite horizons by design.",
  },
  Sgr: {
    tradition: "Greek star-lore",
    insight:
      "Sagittarius aims beyond the immediate horizon — the archer as seeker of distant truth.",
    context: "The centaur points toward the rich star-fields of the galactic center.",
  },
  Cap: {
    tradition: "Greek and Mesopotamian lore",
    insight:
      "Capricorn's sea-goat bridges worlds — ambition that descends into depth and returns transformed.",
    context: "The figure may descend from Enki's amphibious wisdom in Sumer.",
  },
  Aqr: {
    tradition: "Greek star-lore",
    insight:
      "Aquarius pours out what mortals cannot keep — knowledge, nectar, and the burden of service to something larger than the self.",
    context: "Ganymede became cup-bearer to the gods.",
  },
  Psc: {
    tradition: "Greek and Babylonian lore",
    insight:
      "Pisces is escape through transformation — survival by becoming other than oneself.",
    context: "Venus and Cupid leapt into the sea as fish to flee Typhon.",
  },
  Oph: {
    tradition: "Greek star-lore",
    insight:
      "Ophiuchus holds the serpent of healing — power over life and death, and the cost of knowing too much.",
    context: "Asclepius stands in the real zodiac though omitted from the tropical twelve.",
  },
};

export const SEASON_READINGS: Record<string, TraditionReading> = {
  spring: {
    tradition: "Seasonal symbolism",
    insight:
      "A spring birth is read as aligned with renewal — emergence, risk-taking, and the first visible return of growth after winter.",
    context: "Gaelic Imbolc and the vernal equinox frame this quarter in European folk calendars.",
  },
  summer: {
    tradition: "Seasonal symbolism",
    insight:
      "Summer suggests fullness and exposure — long days, public life, and the height of what was planted earlier.",
    context: "Solstice bonfires from Litha to Midsummer sought to bless the sun's peak.",
  },
  autumn: {
    tradition: "Seasonal symbolism",
    insight:
      "Autumn births are associated with harvest and reckoning — gathering results, weighing what endured, and preparing for leaner months.",
    context: "Equinox festivals such as Mabon mark balance before the dark half of the year.",
  },
  winter: {
    tradition: "Seasonal symbolism",
    insight:
      "Winter is read as inward and enduring — survival through scarcity, loyalty in cold weather, and faith that light will return.",
    context: "Yule and midwinter rites celebrate the solstice turning point.",
  },
};

export const SABBAT_READINGS: Record<string, TraditionReading> = {
  "winter solstice (Yule)": {
    tradition: "Seasonal symbolism",
    insight:
      "Born near midwinter, you share the year's deepest dark — a traditional symbol of rebirth when light is scarcest and most valued.",
    context: "Saturnalia, Yule, and countless solstice fires mark this hinge.",
  },
  "spring equinox (Ostara)": {
    tradition: "Seasonal symbolism",
    insight:
      "An equinox birth balances day and night — interpreted as fairness, transition, and the moment winter's debt is finally paid.",
    context: "Ostara and many ancient New Years cluster around this equal light.",
  },
  "summer solstice (Litha)": {
    tradition: "Seasonal symbolism",
    insight:
      "A solstice birth catches the sun at its zenith — visibility, vitality, and the sense that one's life is cast in high relief.",
    context: "Stone circles and hilltop fires align with this longest day.",
  },
  "autumn equinox (Mabon)": {
    tradition: "Seasonal symbolism",
    insight:
      "An autumn-equinox birth falls at the scales of the year — gratitude for harvest and sober awareness that decline has already begun.",
    context: "Mabon and related harvest rites close the bright half of the calendar.",
  },
};
