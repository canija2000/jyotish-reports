/**
 * Calculador Jyotish (Astrología Védica) con datos reales
 * Usa astronomy-engine para posiciones planetarias precisas
 * y convierte a coordenadas sidereales (sistema Lahiri)
 */
const Astronomy = require('astronomy-engine');

// ========== CONSTANTES VÉDICAS ==========

const SIGNS = [
  'Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo',
  'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'
];

const SIGNS_SAN = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'P. Phalguni', 'U. Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'P. Ashadha', 'U. Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'P. Bhadrapada', 'U. Bhadrapada', 'Revati'
];

const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
  'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury'
];

const PLANET_NAMES = {
  Su: 'Sol', Mo: 'Luna', Ma: 'Marte', Me: 'Mercurio',
  Ju: 'Júpiter', Ve: 'Venus', Sa: 'Saturno',
  Ra: 'Rahu', Ke: 'Ketu', Asc: 'Lagna'
};

// Orden de dashas en Vimshottari
const DASHA_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

// ========== AYANAMSA LAHIRI ==========

/**
 * Calcula el ayanamsa de Lahiri para una fecha dada
 * astroTime.ut es días desde J2000.0 (no es JD absoluto)
 */
function lahiriAyanamsa(astroTime) {
  // ut = days since J2000.0
  const yearsSinceJ2000 = astroTime.ut / 365.25;
  
  // Lahiri ayanamsa en J2000.0 ≈ 23.856° (23°51'21")
  // Precesión ≈ 50.29"/año
  const baseDeg = 23.856;
  const precessionPerYear = 50.29 / 3600; // degrees per year
  
  return baseDeg + precessionPerYear * yearsSinceJ2000;
}

// ========== CÁLCULO DE POSICIONES ==========

function getEclipticLongitude(astroTime, body) {
  const vec = Astronomy.GeoVector(body, astroTime, true);
  const ecl = new Astronomy.Ecliptic(vec);
  return ecl.elon;
}

function getPlanetPositions(year, month, day, hour, minute, lat, lon, timezone) {
  // Convertir hora local a UTC usando el timezone proporcionado.
  // Acepta zonas horarias fraccionarias (p. ej. 5.5 para India)
  // y el desbordamiento de día/mes/año se resuelve solo vía Date.
  const tzMinutes = Math.round(timezone * 60);
  const totalMinutes = hour * 60 + minute - tzMinutes;
  const anchor = Date.UTC(year, month - 1, day); // medianoche UTC de la fecha de nacimiento
  const utcDate = new Date(anchor + totalMinutes * 60000);
  
  const astroTime = new Astronomy.AstroTime(utcDate);
  const ayanamsa = lahiriAyanamsa(astroTime);
  
  const positions = {};
  
  // Sol
  const sunLon = getEclipticLongitude(astroTime, Astronomy.Body.Sun);
  positions.Su = { tropical: sunLon, sidereal: normalize360(sunLon - ayanamsa) };
  
  // Luna
  const moonLon = getEclipticLongitude(astroTime, Astronomy.Body.Moon);
  positions.Mo = { tropical: moonLon, sidereal: normalize360(moonLon - ayanamsa) };
  
  // Planetas
  const planets = [
    ['Ma', Astronomy.Body.Mars],
    ['Me', Astronomy.Body.Mercury],
    ['Ju', Astronomy.Body.Jupiter],
    ['Ve', Astronomy.Body.Venus],
    ['Sa', Astronomy.Body.Saturn]
  ];
  
  for (const [key, body] of planets) {
    const lon = getEclipticLongitude(astroTime, body);
    positions[key] = { tropical: lon, sidereal: normalize360(lon - ayanamsa) };
  }
  
  // Retrogradación: longitud 12 h antes y después; si disminuye, el planeta va hacia atrás
  const shift = (h) => new Astronomy.AstroTime(new Date(utcDate.getTime() + h * 3600000));
  const before = shift(-12), after = shift(12);
  for (const [key, body] of planets) {
    const delta = ((getEclipticLongitude(after, body) - getEclipticLongitude(before, body) + 540) % 360) - 180;
    positions[key].retrograde = delta < 0;
  }

  // Nodo Norte (Rahu)
  const rahuLon = calcRahuLongitude(astroTime);
  positions.Ra = { tropical: rahuLon, sidereal: normalize360(rahuLon - ayanamsa) };
  
  // Nodo Sur (Ketu) = Rahu + 180°
  positions.Ke = { tropical: normalize360(rahuLon + 180), sidereal: normalize360(rahuLon + 180 - ayanamsa) };
  
  // Ascendente (Lagna)
  const ascLon = calcAscendant(astroTime, lat, lon);
  positions.Asc = { tropical: ascLon, sidereal: normalize360(ascLon - ayanamsa) };
  
  return { positions, ayanamsa };
}

function calcRahuLongitude(astroTime) {
  // astroTime.ut ya son días desde J2000.0 (no un JD absoluto)
  const T = astroTime.ut / 36525;
  
  let omega = 125.04452 - 1934.136261 * T
    + 0.0020708 * T * T
    + T * T * T / 69699;
  
  const L = 218.3165 + 481267.8813 * T;
  omega = omega - 0.002 * Math.sin((2 * L - 2 * omega) * Math.PI / 180);
  
  return normalize360(omega);
}

function calcAscendant(astroTime, lat, lon) {
  // SiderealTime devuelve horas sidéreas de Greenwich: se pasan a grados
  const gst = Astronomy.SiderealTime(astroTime) * 15;
  const lst = normalize360(gst + lon);

  const tilt = Astronomy.e_tilt(astroTime);
  const obl = tilt.tobl; // true obliquity in degrees

  const latRad = lat * Math.PI / 180;
  const oblRad = obl * Math.PI / 180;
  const lstRad = lst * Math.PI / 180;

  // Fórmula estándar del ascendente; atan2 resuelve el cuadrante sin correcciones manuales
  const asc = Math.atan2(
    Math.cos(lstRad),
    -(Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad))
  ) * 180 / Math.PI;

  return normalize360(asc);
}

// ========== UTILIDADES ==========

function normalize360(deg) {
  deg = deg % 360;
  if (deg < 0) deg += 360;
  return deg;
}

function degToSign(deg) {
  return Math.floor(deg / 30);
}

function degInSign(deg) {
  return deg % 30;
}

function degToNakshatra(deg) {
  return Math.floor(deg / (360 / 27));
}

function degToNakshatraPada(deg) {
  const nakDeg = 360 / 27;
  const nak = Math.floor(deg / nakDeg);
  const pada = Math.floor((deg % nakDeg) / (nakDeg / 4)) + 1;
  return { nakshatra: nak, pada };
}

function formatDeg(deg) {
  const inSign = deg % 30;
  const d = Math.floor(inSign);
  const m = Math.floor((inSign - d) * 60);
  const s = Math.floor(((inSign - d) * 60 - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
}

// ========== CÁLCULO DE CASAS (WHOLE SIGN) ==========

function calcWholeSignHouses(ascSidereal, planetPositions) {
  const ascSign = degToSign(ascSidereal);
  const houses = {};
  
  for (const [key, data] of Object.entries(planetPositions)) {
    const planetSign = degToSign(data.sidereal);
    let house = ((planetSign - ascSign + 12) % 12) + 1;
    houses[key] = house;
  }
  
  return houses;
}

// ========== NAVAMSHA (D-9) ==========

function calcNavamsha(siderealDeg) {
  const navamshaIndex = Math.floor(siderealDeg / (30 / 9));
  const signIndex = degToSign(siderealDeg);
  const element = Math.floor(signIndex / 4);
  
  const startSigns = [0, 9, 6, 3];
  const startSign = startSigns[element];
  const navamshaSign = (startSign + navamshaIndex) % 12;
  
  return navamshaSign;
}

// ========== DIGNIDADES Y REGENCIAS (Parāśara) ==========

// Regente de cada signo, de Aries a Piscis
const SIGN_LORDS = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju'];
const DASHA_TO_KEY = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };

const EXALTATION = { Su: 0, Mo: 1, Ma: 9, Me: 5, Ju: 3, Ve: 11, Sa: 6 };
// Mūlatrikoṇa: [signo, grado inicial, grado final]
const MOOLATRIKONA = { Su: [4, 0, 20], Mo: [1, 3, 30], Ma: [0, 0, 12], Me: [5, 15, 20], Ju: [8, 0, 10], Ve: [6, 0, 15], Sa: [10, 0, 20] };
// Amistades naturales (naisargika): amigos y enemigos; el resto es neutral
const FRIENDS = { Su: ['Mo', 'Ma', 'Ju'], Mo: ['Su', 'Me'], Ma: ['Su', 'Mo', 'Ju'], Me: ['Su', 'Ve'], Ju: ['Su', 'Mo', 'Ma'], Ve: ['Me', 'Sa'], Sa: ['Me', 'Ve'] };
const ENEMIES = { Su: ['Ve', 'Sa'], Mo: [], Ma: ['Me'], Me: ['Mo'], Ju: ['Me', 'Ve'], Ve: ['Su', 'Mo'], Sa: ['Su', 'Mo', 'Ma'] };

/**
 * Dignidad de un graha por signo: exalted, moolatrikona, own, friend, neutral, enemy, debilitated.
 * Rahu y Ketu no tienen dignidad clásica consensuada: devuelve null.
 */
function calcDignity(key, signIdx, degInS) {
  if (!(key in EXALTATION)) return null;
  const mt = MOOLATRIKONA[key];
  if (signIdx === EXALTATION[key]) {
    // La Luna y Mercurio comparten signo de exaltación con su mūlatrikoṇa / signo propio
    if (key === 'Mo' && degInS >= 3) return 'moolatrikona';
    if (key === 'Me' && degInS >= 15) return degInS < 20 ? 'moolatrikona' : 'own';
    return 'exalted';
  }
  if (signIdx === (EXALTATION[key] + 6) % 12) return 'debilitated';
  if (signIdx === mt[0] && degInS >= mt[1] && degInS < mt[2]) return 'moolatrikona';
  const lord = SIGN_LORDS[signIdx];
  if (lord === key) return 'own';
  if (FRIENDS[key].includes(lord)) return 'friend';
  if (ENEMIES[key].includes(lord)) return 'enemy';
  return 'neutral';
}

// Las 12 casas: signo, regente, dónde está el regente y qué planetas la ocupan
function calcHouseTable(ascSign, planets) {
  return Array.from({ length: 12 }, (_, i) => {
    const signIndex = (ascSign + i) % 12;
    const lord = SIGN_LORDS[signIndex];
    return {
      house: i + 1,
      sign: SIGNS[signIndex],
      signIndex,
      lord,
      lordHouse: planets[lord].house,
      occupants: Object.keys(planets).filter(k => k !== 'Asc' && planets[k].signIndex === signIndex)
    };
  });
}

// ========== VIMSHOTTARI DASHA ==========

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

// Antardashas de un mahadasha: empiezan por el propio regente y siguen el orden Vimshottari.
// fullStart es el inicio teórico del mahadasha completo; se recortan los subperiodos previos al nacimiento.
function calcAntardashas(md, fullStart) {
  const startIdx = DASHA_ORDER.indexOf(md.lord);
  const total = DASHA_YEARS[md.lord];
  const list = [];
  let t = fullStart.getTime();
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(startIdx + i) % 9];
    const years = total * DASHA_YEARS[lord] / 120;
    const end = t + years * YEAR_MS;
    if (end > md.start.getTime()) {
      list.push({ lord, start: new Date(Math.max(t, md.start.getTime())), end: new Date(end), years });
    }
    t = end;
  }
  return list;
}

function calcVimshottariDasha(moonSiderealDeg, birthYear, birthMonth, birthDay) {
  const nak = degToNakshatra(moonSiderealDeg);
  const nakDeg = 360 / 27;
  const nakStart = nak * nakDeg;
  const progress = (moonSiderealDeg - nakStart) / nakDeg;
  
  const dashaLord = NAKSHATRA_LORDS[nak];
  const totalYears = DASHA_YEARS[dashaLord];
  const remainingYears = totalYears * (1 - progress);
  
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  // Fin del primer dasha: lo que le queda por recorrer a la Luna en su nakshatra
  const dashaStartDate = new Date(birthDate.getTime() + remainingYears * 365.25 * 24 * 3600 * 1000);
  
  const dashas = [];
  let currentIndex = DASHA_ORDER.indexOf(dashaLord);
  
  dashas.push({
    lord: dashaLord,
    start: new Date(birthDate),
    end: dashaStartDate,
    years: remainingYears,
    isPartial: true
  });
  
  let currentDate = dashaStartDate;
  for (let i = 1; i < 9; i++) {
    const idx = (currentIndex + i) % 9;
    const lord = DASHA_ORDER[idx];
    const years = DASHA_YEARS[lord];
    const endDate = new Date(currentDate.getTime() + years * 365.25 * 24 * 3600 * 1000);
    
    dashas.push({
      lord,
      start: new Date(currentDate),
      end: endDate,
      years,
      isPartial: false
    });
    
    currentDate = endDate;
  }

  dashas.forEach((d, i) => {
    const fullStart = i === 0 ? new Date(d.end.getTime() - DASHA_YEARS[d.lord] * YEAR_MS) : d.start;
    d.antardashas = calcAntardashas(d, fullStart);
  });

  return dashas;
}

// ========== FUNCIÓN PRINCIPAL ==========

function calculateChart(birthData) {
  const { year, month, day, hour, minute, lat, lon, name, timezone } = birthData;
  const tz = timezone || 0; // Default to UTC
  
  const { positions, ayanamsa } = getPlanetPositions(year, month, day, hour, minute, lat, lon, tz);
  
  const ascSidereal = positions.Asc.sidereal;
  const houses = calcWholeSignHouses(ascSidereal, positions);
  
  const planets = {};
  for (const [key, data] of Object.entries(positions)) {
    const signIdx = degToSign(data.sidereal);
    const degInS = degInSign(data.sidereal);
    const { nakshatra, pada } = degToNakshatraPada(data.sidereal);
    const navamshaSign = calcNavamsha(data.sidereal);
    
    planets[key] = {
      name: PLANET_NAMES[key],
      sign: SIGNS[signIdx],
      signIndex: signIdx,
      degree: data.sidereal,
      degreeFormatted: formatDeg(data.sidereal),
      degreeInSign: degInS,
      house: houses[key],
      nakshatra: NAKSHATRAS[nakshatra],
      nakshatraIndex: nakshatra,
      pada,
      navamsha: SIGNS[navamshaSign],
      navamshaIndex: navamshaSign,
      // Rahu y Ketu (nodo medio) siempre retrogradan
      retrograde: key === 'Ra' || key === 'Ke' ? true : !!data.retrograde,
      dignity: calcDignity(key, signIdx, degInS),
      rules: []
    };
  }

  // Casas que rige cada graha (contadas desde el ascendente)
  const ascSign = planets.Asc.signIndex;
  for (let h = 1; h <= 12; h++) {
    planets[SIGN_LORDS[(ascSign + h - 1) % 12]].rules.push(h);
  }
  const houseTable = calcHouseTable(ascSign, planets);

  const moonSidereal = positions.Mo.sidereal;
  const dashas = calcVimshottariDasha(moonSidereal, year, month, day);

  const now = new Date();
  const currentDasha = dashas.find(d => d.start <= now && d.end > now)
    || (now < dashas[0].start ? dashas[0] : dashas[dashas.length - 1]);
  const currentAntardasha = currentDasha.antardashas.find(a => a.start <= now && a.end > now) || null;
  const nextDasha = dashas[dashas.indexOf(currentDasha) + 1] || null;
  
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const elementMap = ['fire', 'fire', 'fire', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water'];
  for (const key of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']) {
    elements[elementMap[planets[key].signIndex]]++;
  }
  
  const modalities = { cardinal: 0, fixed: 0, mutable: 0 };
  const modalityMap = ['cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable'];
  for (const key of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']) {
    modalities[modalityMap[planets[key].signIndex]]++;
  }
  
  return {
    subject: {
      name: name || 'Consultante',
      birth: { year, month, day, hour, minute, lat, lon },
      birthDate: `${day} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][month-1]} de ${year}`,
      birthTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      place: birthData.place || '',
      coords: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      ayanamsa: `Lahiri (${ayanamsa.toFixed(4)}°)`,
      houseSystem: 'Whole Sign (Signo Completo)',
      zodiac: 'Sideral'
    },
    ascendant: {
      sign: planets.Asc.sign,
      signIndex: planets.Asc.signIndex,
      degree: planets.Asc.degree,
      degreeFormatted: planets.Asc.degreeFormatted,
      nakshatra: planets.Asc.nakshatra,
      pada: planets.Asc.pada
    },
    planets,
    houses,
    houseTable,
    dashas,
    currentDasha,
    currentAntardasha,
    nextDasha,
    elements,
    modalities,
    calculatedAt: new Date().toISOString()
  };
}

module.exports = { calculateChart, SIGNS, SIGNS_SAN, NAKSHATRAS, PLANET_NAMES, SIGN_LORDS, DASHA_TO_KEY };
