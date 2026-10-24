/**
 * Generador de Reporte Jyotish (Bilingüe ES / EN)
 * Devuelve { cover, sections, lang } para que pdf.js lo componga.
 * Copy sobrio, riguroso y sin emojis: un documento editorial de autoconocimiento.
 */

const { SIGNS, SIGN_LORDS: SIGN_LORD_KEYS } = require('./calculator');

// ========== DICCIONARIOS Y TRADUCCIONES ==========

const SIGNS_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const SIGN_INTERPS = {
  es: {
    0: { keywords: 'acción, iniciativa, liderazgo, coraje', element: 'Fuego', modality: 'Cardinal', ruler: 'Marte', desc: 'Tu naturaleza interior irradia energía pionera. Posees un espíritu guerrero que te impulsa a abrir caminos nuevos, enfrentar desafíos con valentía y asumir el liderazgo cuando otros dudan. Tu vitalidad es tu mayor fortaleza.' },
    1: { keywords: 'estabilidad, placer, paciencia, abundancia', element: 'Tierra', modality: 'Fijo', ruler: 'Venus', desc: 'Tu naturaleza interior busca la solidez y el disfrute sensorial. Valoras la estabilidad material, la belleza y los placeres terrenales. Tu paciencia y determinación te permiten construir bases duraderas.' },
    2: { keywords: 'comunicación, curiosidad, versatilidad, intelecto', element: 'Aire', modality: 'Mutable', ruler: 'Mercurio', desc: 'Tu naturaleza interior es ágil e inquisitiva. Posees una mente versátil que absorbe información rápidamente, disfruta el intercambio de ideas y encuentra conexiones donde otros ven caos.' },
    3: { keywords: 'emoción, protección, nutrición, hogar', element: 'Agua', modality: 'Cardinal', ruler: 'Luna', desc: 'Tu naturaleza interior es profundamente emocional y protectora. Tu sensibilidad te permite percibir las necesidades de otros y crear espacios de contención. El hogar y la familia son pilares fundamentales.' },
    4: { keywords: 'expresión, creatividad, autoridad, generosidad', element: 'Fuego', modality: 'Fijo', ruler: 'Sol', desc: 'Tu naturaleza interior brilla con presencia regia. Posees un magnetismo natural, creatividad expresiva y un deseo genuino de inspirar a otros. Tu generosidad de espíritu es contagiosa.' },
    5: { keywords: 'análisis, servicio, precisión, pureza', element: 'Tierra', modality: 'Mutable', ruler: 'Mercurio', desc: 'Tu naturaleza interior busca la perfección a través del servicio. Tu mente analítica detecta detalles que otros pasan por alto, y tu dedicación al mejoramiento constante te hace invaluable.' },
    6: { keywords: 'equilibrio, diplomacia, belleza, justicia', element: 'Aire', modality: 'Cardinal', ruler: 'Venus', desc: 'Tu naturaleza interior busca la armonía y la equidad. Posees un don natural para mediar conflictos, apreciar la belleza y crear relaciones equilibradas. Tu sentido de justicia es tu brújula moral.' },
    7: { keywords: 'transformación, intensidad, misterio, poder', element: 'Agua', modality: 'Fijo', ruler: 'Marte', desc: 'Tu naturaleza interior es profunda e intensa. Posees la capacidad de penetrar las apariencias, enfrentar verdades incómodas y transformar tanto tu vida como la de quienes te rodean.' },
    8: { keywords: 'expansión, filosofía, aventura, verdad', element: 'Fuego', modality: 'Mutable', ruler: 'Júpiter', desc: 'Tu naturaleza interior anhela la expansión y el conocimiento superior. Eres un buscador nato de verdad y significado, con un espíritu aventurero que te impulsa a explorar horizontes físicos e intelectuales.' },
    9: { keywords: 'disciplina, ambición, estructura, responsabilidad', element: 'Tierra', modality: 'Cardinal', ruler: 'Saturno', desc: 'Tu naturaleza interior es seria y orientada al logro. Posees una disciplina excepcional, ambición bien dirigida y la capacidad de construir estructuras duraderas con paciencia y determinación.' },
    10: { keywords: 'innovación, independencia, visión, humanidad', element: 'Aire', modality: 'Fijo', ruler: 'Saturno', desc: 'Tu naturaleza interior es visionaria e independiente. Posees la capacidad de ver más allá de las convenciones, innovar con propósito y trabajar por ideales que beneficien a la colectividad.' },
    11: { keywords: 'compasión, intuición, trascendencia, arte', element: 'Agua', modality: 'Mutable', ruler: 'Júpiter', desc: 'Tu naturaleza interior es profundamente empática e intuitiva. Posees una conexión especial con lo trascendente, una imaginación fértil y la capacidad de compasión universal que te conecta con el sufrimiento ajeno.' }
  },
  en: {
    0: { keywords: 'action, initiative, leadership, courage', element: 'Fire', modality: 'Cardinal', ruler: 'Mars', desc: 'Your inner nature radiates pioneering energy. You possess a warrior spirit that drives you to forge new paths, face challenges with bravery, and take initiative when others hesitate. Vitality is your greatest asset.' },
    1: { keywords: 'stability, pleasure, patience, abundance', element: 'Earth', modality: 'Fixed', ruler: 'Venus', desc: 'Your inner nature seeks grounding and sensory fulfillment. You value material stability, beauty, and earthly pleasures. Patience and perseverance allow you to build enduring foundations.' },
    2: { keywords: 'communication, curiosity, versatility, intellect', element: 'Air', modality: 'Mutable', ruler: 'Mercury', desc: 'Your inner nature is agile and inquisitive. You possess a versatile intellect that absorbs knowledge rapidly, delights in the exchange of ideas, and perceives connections where others see chaos.' },
    3: { keywords: 'emotion, protection, nurturing, home', element: 'Water', modality: 'Cardinal', ruler: 'Moon', desc: 'Your inner nature is deeply emotional and protective. Your heightened sensitivity enables you to anticipate the needs of others and create spaces of sanctuary. Family and belonging are core pillars.' },
    4: { keywords: 'expression, creativity, authority, generosity', element: 'Fire', modality: 'Fixed', ruler: 'Sun', desc: 'Your inner nature shines with dignified presence. You possess natural magnetism, creative expression, and a genuine impulse to inspire. Your generosity of spirit leaves a lasting impression.' },
    5: { keywords: 'analysis, service, precision, discernment', element: 'Earth', modality: 'Mutable', ruler: 'Mercury', desc: 'Your inner nature seeks refinement through purposeful service. Your analytical mind notices details others overlook, and your dedication to continuous mastery makes your contribution invaluable.' },
    6: { keywords: 'balance, diplomacy, beauty, justice', element: 'Air', modality: 'Cardinal', ruler: 'Venus', desc: 'Your inner nature seeks harmony and equity. You possess an innate gift for mediation, aesthetic appreciation, and balanced relationships. Your sense of justice serves as your moral compass.' },
    7: { keywords: 'transformation, depth, intensity, discernment', element: 'Water', modality: 'Fixed', ruler: 'Mars', desc: 'Your inner nature is deep and penetrating. You possess the capacity to look past appearances, confront uncomfortable truths, and catalyze profound renewal in both yourself and those around you.' },
    8: { keywords: 'expansion, philosophy, aspiration, truth', element: 'Fire', modality: 'Mutable', ruler: 'Jupiter', desc: 'Your inner nature yearns for expansion and higher wisdom. You are a natural seeker of meaning and truth, driven by an adventurous spirit to explore physical, philosophical, and intellectual frontiers.' },
    9: { keywords: 'discipline, ambition, structure, responsibility', element: 'Earth', modality: 'Cardinal', ruler: 'Saturn', desc: 'Your inner nature is measured and achievement-oriented. You possess exceptional discipline, structured ambition, and the patience to erect lasting achievements step by deliberate step.' },
    10: { keywords: 'innovation, independence, vision, humanitarianism', element: 'Air', modality: 'Fixed', ruler: 'Saturn', desc: 'Your inner nature is visionary and independent. You possess the ability to look beyond convention, innovate with purpose, and champion ideals that serve the collective good.' },
    11: { keywords: 'compassion, intuition, transcendence, artistic depth', element: 'Water', modality: 'Mutable', ruler: 'Jupiter', desc: 'Your inner nature is deeply empathetic and intuitive. You hold a natural resonance with the transcendent, a fertile imagination, and universal empathy that bridges personal boundaries.' }
  }
};

const PLANET_NAMES = {
  es: { Su: 'Sol', Mo: 'Luna', Ma: 'Marte', Me: 'Mercurio', Ju: 'Júpiter', Ve: 'Venus', Sa: 'Saturno', Ra: 'Rahu', Ke: 'Ketu', Asc: 'Lagna' },
  en: { Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu', Asc: 'Ascendant' }
};

const HOUSE_MEANINGS = {
  es: {
    1: 'tu personalidad, cuerpo físico y cómo te presentas al mundo',
    2: 'tus recursos, valores, familia de origen y capacidad de generar riqueza',
    3: 'tu comunicación, hermanos, viajes cortos y coraje',
    4: 'tu hogar, madre, educación temprana y bienestar emocional',
    5: 'tu creatividad, intelecto, vocación y méritos de vidas pasadas',
    6: 'tu trabajo diario, salud, superación de obstáculos y servicio',
    7: 'tu matrimonio, pareja, asociaciones y relaciones uno a uno',
    8: 'tu transformación, longevidad, misterio y recursos compartidos',
    9: 'tu dharma (propósito), filosofía, padre y sabiduría superior',
    10: 'tu carrera, reputación pública, logros y contribución social',
    11: 'tus ganancias, redes, amistades y cumplimiento de aspiraciones',
    12: 'tu vida interior, espiritualidad, aislamiento y liberación final (moksha)'
  },
  en: {
    1: 'your individuality, physical vitality, and overall life path',
    2: 'wealth, values, speech, and material sustenance',
    3: 'courage, initiative, communication, and sibling bonds',
    4: 'home, emotional contentment, inner peace, and maternal ties',
    5: 'intellect, creative expression, romance, and past-life merits',
    6: 'daily labor, resilience, health, and service to others',
    7: 'partnerships, marriage, alliances, and outward social exchange',
    8: 'transformation, esoteric knowledge, longevity, and shared resources',
    9: 'dharma (purpose), higher philosophy, guidance, and spiritual path',
    10: 'profession, public standing, authority, and life achievements',
    11: 'aspirations, community networks, friendships, and earned prosperity',
    12: 'inner contemplation, detachment, expenses, and spiritual liberation (moksha)'
  }
};

const PLANET_SIGNIFICATIONS = {
  es: {
    Su: 'el alma, la identidad esencial, la vitalidad y el propósito de vida',
    Mo: 'la mente emocional (Manas), la memoria y la receptividad intuitiva',
    Ma: 'la energía de acción, el coraje, la disciplina y la capacidad de conquista',
    Me: 'el intelecto analítico (Buddhi), la comunicación y el comercio',
    Ju: 'la sabiduría superior (Guru), el dharma, la expansión y la nobleza',
    Ve: 'la belleza, el amor, el refinamiento sensorial y la armonía',
    Sa: 'el karma, la madurez, la paciencia y las lecciones estructurales',
    Ra: 'la ambición terrenal, la innovación y la búsqueda de experiencias nuevas',
    Ke: 'el desapego interior, la intuición sutil y la liberación espiritual'
  },
  en: {
    Su: 'the core soul (Atman), vital force, personal authority, and purpose',
    Mo: 'the emotional mind (Manas), psychological memory, and inner peace',
    Ma: 'vital courage, focused ambition, direct action, and perseverance',
    Me: 'analytical intellect (Buddhi), articulate speech, commerce, and adaptability',
    Ju: 'higher wisdom (Guru), spiritual guidance, expansion, and ethical righteousness',
    Ve: 'aesthetic grace, love, relational harmony, and sensory refinement',
    Sa: 'karmic duty, endurance, structure, and the lessons of time',
    Ra: 'worldly drive, modern breakthroughs, and material evolution (North Node)',
    Ke: 'spiritual detachment, intuitive insight, and ancestral mastery (South Node)'
  }
};

const DASHA_INTERPS = {
  es: {
    'Sun': 'Periodo de autoexpresión, liderazgo y reconocimiento de la identidad esencial.',
    'Moon': 'Periodo de desarrollo emocional, conexión familiar y nutrición interior.',
    'Mars': 'Periodo de acción, coraje y manifestación de deseos materiales.',
    'Mercury': 'Periodo de aprendizaje, comunicación e intercambio intelectual.',
    'Jupiter': 'Periodo de expansión, sabiduría y crecimiento espiritual.',
    'Venus': 'Periodo de amor, placer, belleza y relaciones armoniosas.',
    'Saturn': 'Periodo de disciplina, estructura y maduración kármica.',
    'Rahu': 'Periodo de ambición, obsesión y búsqueda de experiencias nuevas.',
    'Ketu': 'Periodo de desapego, liberación y profundización espiritual.'
  },
  en: {
    'Sun': 'Period of self-realization, personal authority, and recognition of core identity.',
    'Moon': 'Period of emotional growth, home connection, and inner receptivity.',
    'Mars': 'Period of decisive action, courage, ambition, and strategic initiative.',
    'Mercury': 'Period of intellectual advancement, communication, learning, and trade.',
    'Jupiter': 'Period of expanding horizons, philosophical depth, and spiritual benevolence.',
    'Venus': 'Period of relational harmony, creative appreciation, and material ease.',
    'Saturn': 'Period of perseverance, structural maturation, and karmic consolidation.',
    'Rahu': 'Period of intense drive, unconventional growth, and worldly expansion.',
    'Ketu': 'Period of introspective discernment, spiritual clarity, and inner liberation.'
  }
};

const NAKSHATRA_INTERPS = {
  es: {
    0: 'Ashwini otorga velocidad, iniciativa y capacidad curativa',
    1: 'Bharani confiere capacidad de transformación y manejo de ciclos',
    2: 'Krittika otorga fuego purificador y determinación inquebrantable',
    3: 'Rohini bendice con creatividad fértil, belleza y magnetismo natural',
    4: 'Mrigashira confiere búsqueda incansable de verdad y conocimiento',
    5: 'Ardra otorga capacidad de renovación profunda y resiliencia',
    6: 'Punarvasu permite renacer y encontrar claridad tras la incertidumbre',
    7: 'Pushya nutre con sabiduría, generosidad y cuidado protector',
    8: 'Ashlesha otorga astucia psicológica, profundidad e intensidad',
    9: 'Magha conecta con autoridad natural, dignidad y legado',
    10: 'P. Phalguni otorga vitalidad creativa, placer y dicha en las artes',
    11: 'U. Phalguni confiere lealtad, liderazgo y servicio honorable',
    12: 'Hasta otorga destreza mental y manual, ingenio y manifestación',
    13: 'Chitra bendice con visión estética, brillo y arte constructivo',
    14: 'Swati otorga independencia, adaptabilidad y diplomacia',
    15: 'Vishakha confiere determinación enfocada y conquista de metas',
    16: 'Anuradha otorga devoción, amistad sincera y capacidad asociativa',
    17: 'Jyeshtha confiere veteranía, coraje protector y madurez',
    18: 'Mula otorga capacidad de investigación radical y búsqueda de raíces',
    19: 'P. Ashadha confiere invencibilidad moral y superación de pruebas',
    20: 'U. Ashadha otorga victoria duradera, sobriedad y éxito consolidado',
    21: 'Shravana confiere discernimiento auditivo, estudio y sabiduría oral',
    22: 'Dhanishta otorga ritmo, destreza práctica y capacidad comunitaria',
    23: 'Shatabhisha confiere visión cósmica, reserva y facultades curativas',
    24: 'P. Bhadrapada confiere intensidad ascética y compromiso existencial',
    25: 'U. Bhadrapada otorga profundidad emocional, serenidad y sabiduría',
    26: 'Revati bendice con compasión universal, refinamiento y guía protectora'
  },
  en: {
    0: 'Ashwini imparts agility, pioneering initiative, and restorative vitality',
    1: 'Bharani grants transformative capacity and mastery over life cycles',
    2: 'Krittika confers purifying discernment and unwavering focus',
    3: 'Rohini blesses with fertile creativity, charm, and aesthetic grace',
    4: 'Mrigashira imparts relentless curiosity and search for truth',
    5: 'Ardra brings cathartic breakthrough and profound resilience',
    6: 'Punarvasu grants restoration, renewed vision, and spiritual light',
    7: 'Pushya nourishes with ethical wisdom, abundance, and guidance',
    8: 'Ashlesha imparts psychological insight, depth, and protective instinct',
    9: 'Magha connects with ancestral dignity, self-respect, and authority',
    10: 'P. Phalguni brings expressive creativity, warmth, and joyful vitality',
    11: 'U. Phalguni confers steadfast loyalty, nobility, and benevolent service',
    12: 'Hasta grants craftsmanship, dexterous intellect, and practical mastery',
    13: 'Chitra blesses with architectural elegance, brilliance, and artistry',
    14: 'Swati imparts self-reliance, intellectual balance, and adaptability',
    15: 'Vishakha brings singular determination and the power to attain goals',
    16: 'Anuradha bestows devotion, alliance-building, and enduring friendship',
    17: 'Jyeshtha confers protective seniority, courage, and elder responsibility',
    18: 'Mula grants radical investigation into the foundational roots of reality',
    19: 'P. Ashadha confers invincible resolve and the capacity to overcome trials',
    20: 'U. Ashadha bestows enduring triumph, quiet dignity, and permanent achievements',
    21: 'Shravana grants attentive listening, scholarly reverence, and oral wisdom',
    22: 'Dhanishta brings rhythm, resourcefulness, and collective achievement',
    23: 'Shatabhisha confers cosmic perception, discretion, and healing depth',
    24: 'P. Bhadrapada grants ascetic focus and existential commitment',
    25: 'U. Bhadrapada bestows emotional calm, protective wisdom, and spiritual maturity',
    26: 'Revati blesses with universal empathy, gentle prosperity, and spiritual guidance'
  }
};

// Dignidad por signo: etiqueta corta (tablas) y frase para el texto
const DIGNITY = {
  es: {
    exalted: { label: 'Exaltado', text: 'está exaltado: es el signo donde mejor se expresa, con fuerza y claridad' },
    moolatrikona: { label: 'Mūlatrikoṇa', text: 'está en su mūlatrikoṇa, un signo de gran afinidad donde actúa con autoridad y coherencia' },
    own: { label: 'Signo propio', text: 'está en su propio signo: actúa con autonomía y con recursos propios' },
    friend: { label: 'Signo amigo', text: 'está en un signo amigo, donde encuentra apoyo para expresarse' },
    neutral: { label: 'Neutral', text: 'está en un signo neutral: su resultado depende sobre todo de la casa que ocupa y de las que rige' },
    enemy: { label: 'Signo enemigo', text: 'está en un signo enemigo: necesita más esfuerzo para dar sus frutos' },
    debilitated: { label: 'En caída', text: 'está en caída: sus temas piden trabajo consciente y suelen madurar con el tiempo' }
  },
  en: {
    exalted: { label: 'Exalted', text: 'is exalted: this is the sign where it expresses itself with the most strength and clarity' },
    moolatrikona: { label: 'Mūlatrikoṇa', text: 'is in its mūlatrikoṇa, a sign of deep affinity where it acts with authority and coherence' },
    own: { label: 'Own sign', text: 'is in its own sign: it acts autonomously and with its own resources' },
    friend: { label: 'Friendly sign', text: 'is in a friendly sign, where it finds support to express itself' },
    neutral: { label: 'Neutral', text: 'is in a neutral sign: its results depend mostly on the house it occupies and the houses it rules' },
    enemy: { label: 'Enemy sign', text: 'is in an enemy sign: it needs more effort to bear fruit' },
    debilitated: { label: 'Debilitated', text: 'is debilitated: its themes call for conscious work and tend to mature over time' }
  }
};
const STRONG = ['exalted', 'moolatrikona', 'own'];

// Nombre breve de cada casa, para frases que enumeran varias
const HOUSE_SHORT = {
  es: { 1: 'identidad', 2: 'recursos', 3: 'comunicación', 4: 'hogar', 5: 'creatividad', 6: 'trabajo y salud', 7: 'pareja', 8: 'transformación', 9: 'dharma', 10: 'carrera', 11: 'ganancias y redes', 12: 'vida interior' },
  en: { 1: 'self', 2: 'resources', 3: 'communication', 4: 'home', 5: 'creativity', 6: 'work and health', 7: 'partnership', 8: 'transformation', 9: 'dharma', 10: 'career', 11: 'gains and networks', 12: 'inner life' }
};

const ELEMENT_NAMES = {
  es: { fire: 'Fuego', earth: 'Tierra', air: 'Aire', water: 'Agua' },
  en: { fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water' }
};

const DASHA_KEY = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };

// ---------- utilidades de texto ----------

function pName(key, l) { return PLANET_NAMES[l][key]; }
// Con artículo cuando el castellano lo pide (el Sol, la Luna); cap = mayúscula inicial
function pArt(key, l, cap) {
  const art = l === 'es' ? { Su: 'el ', Mo: 'la ' }[key] || '' : (key === 'Su' || key === 'Mo' ? 'the ' : '');
  const s = art + pName(key, l);
  return cap ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function sName(idx, l) { return l === 'en' ? SIGNS_EN[idx] : SIGNS[idx]; }
function houseWord(l) { return l === 'en' ? 'House' : 'Casa'; }
function joinList(items, l) {
  if (items.length <= 1) return items.join('');
  const and = l === 'en' ? ' and ' : ' y ';
  return items.slice(0, -1).join(', ') + and + items[items.length - 1];
}
function dashaLordName(lord, l) { return pName(DASHA_KEY[lord], l); }
function rulesPhrase(rules, l) {
  return joinList(rules.map(h => `${h} (${HOUSE_SHORT[l][h]})`), l);
}
function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function yearSpan(a, b) { return `${a.getFullYear()}–${b.getFullYear()}`; }

// ========== GENERADOR PRINCIPAL ==========

function generateReport(chart, lang = 'es') {
  const l = (lang === 'en') ? 'en' : 'es';
  return {
    lang: l,
    cover: buildCover(chart, l),
    summary: buildSummaryCards(chart, l),
    labels: {
      dignity: Object.fromEntries(Object.entries(DIGNITY[l]).map(([k, v]) => [k, v.label])),
      houseShort: HOUSE_SHORT[l]
    },
    sections: [
      buildSummarySection(chart, l),
      buildTechnicalData(chart, l),
      buildAscendantSection(chart, l),
      buildPlanetsSection(chart, l),
      buildNakshatraSection(chart, l),
      buildHousesSection(chart, l),
      buildDashaSection(chart, l),
      buildSynthesis(chart, l),
      buildGlossary(chart, l)
    ]
  };
}

// ---------- 0 · Tu carta en una página ----------

function strongPlanets(chart) {
  return ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'].filter(k => STRONG.includes(chart.planets[k].dignity));
}
function weakPlanets(chart) {
  return ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'].filter(k => chart.planets[k].dignity === 'debilitated');
}
function dominantHouses(chart) {
  const max = Math.max(...chart.houseTable.map(h => h.occupants.length));
  return { max, houses: chart.houseTable.filter(h => h.occupants.length === max).map(h => h.house) };
}
function elementBalance(chart) {
  const e = Object.entries(chart.elements).sort((a, b) => b[1] - a[1]);
  return { dominant: e[0][0], count: e[0][1], missing: e.filter(([, n]) => n === 0).map(([k]) => k) };
}

function buildSummaryCards(chart, l) {
  const isEn = l === 'en';
  const P = chart.planets;
  const D = DIGNITY[l];
  const asc = chart.ascendant;
  const ruler = P[SIGN_LORD_KEYS[asc.signIndex]];
  const rulerKey = SIGN_LORD_KEYS[asc.signIndex];
  const el = elementBalance(chart);
  const dom = dominantHouses(chart);
  const md = chart.currentDasha, ad = chart.currentAntardasha;
  const strong = strongPlanets(chart), weak = weakPlanets(chart);
  const none = isEn ? 'None' : 'Ninguno';

  return [
    { label: isEn ? 'Ascendant' : 'Ascendente', value: sName(asc.signIndex, l), note: `Lagna · ${asc.nakshatra}` },
    { label: isEn ? 'Moon' : 'Luna', value: sName(P.Mo.signIndex, l), note: `Janma nakshatra · ${P.Mo.nakshatra}` },
    { label: isEn ? 'Sun' : 'Sol', value: sName(P.Su.signIndex, l), note: `${houseWord(l)} ${P.Su.house} · ${D[P.Su.dignity].label}` },
    { label: isEn ? 'Chart ruler' : 'Regente de la carta', value: pName(rulerKey, l), note: `${sName(ruler.signIndex, l)} · ${houseWord(l)} ${ruler.house} · ${D[ruler.dignity].label}` },
    {
      label: isEn ? 'Dominant element' : 'Elemento dominante',
      value: ELEMENT_NAMES[l][el.dominant],
      note: el.missing.length
        ? `${el.count} ${isEn ? 'of' : 'de'} 7 · ${isEn ? 'no' : 'sin'} ${joinList(el.missing.map(k => ELEMENT_NAMES[l][k]), l)}`
        : `${el.count} ${isEn ? 'of 7 grahas' : 'de 7 grahas'}`
    },
    {
      label: isEn ? 'Busiest house' : 'Casa más poblada',
      value: dom.houses.map(h => `${houseWord(l)} ${h}`).join(' · '),
      note: `${joinList(dom.houses.map(h => HOUSE_SHORT[l][h]), l)} · ${dom.max} ${isEn ? 'planets' : 'planetas'}`
    },
    {
      label: isEn ? 'Current period' : 'Periodo actual',
      value: ad ? `${dashaLordName(md.lord, l)} · ${dashaLordName(ad.lord, l)}` : dashaLordName(md.lord, l),
      note: ad
        ? `${isEn ? 'sub-period until' : 'subperiodo hasta'} ${ad.end.getFullYear()} · ${isEn ? 'major until' : 'mayor hasta'} ${md.end.getFullYear()}`
        : yearSpan(md.start, md.end)
    },
    { label: isEn ? 'Strengths' : 'Fortalezas', value: strong.length ? strong.map(k => pName(k, l)).join(' · ') : none, note: strong.length ? (isEn ? 'exalted, mūlatrikoṇa or own sign' : 'exaltados, en mūlatrikoṇa o en signo propio') : (isEn ? 'strength is evenly spread' : 'la fuerza está repartida') },
    { label: isEn ? 'Growth points' : 'Puntos de trabajo', value: weak.length ? weak.map(k => pName(k, l)).join(' · ') : none, note: weak.length ? (isEn ? 'debilitated grahas' : 'grahas en caída') : (isEn ? 'no debilitated grahas' : 'ningún graha en caída') }
  ];
}

function buildSummarySection(chart, l) {
  const isEn = l === 'en';
  return {
    title: isEn ? 'Your Chart at a Glance' : 'Tu carta en una página',
    body: [
      isEn
        ? 'The essentials of your chart before the detail. Each point is developed in the sections that follow.'
        : 'Lo esencial de tu carta antes del detalle. Cada punto se desarrolla en las secciones que siguen.',
      '',
      '{{SUMMARY}}',
      '',
      `### ${isEn ? 'Elemental Balance' : 'Balance elemental'}`,
      '',
      '{{ELEMENTS}}',
      '',
      getElementsInterpretation(chart.elements, l)
    ].join('\n')
  };
}

function buildCover(chart, l) {
  const isEn = l === 'en';
  return {
    name: chart.subject.name,
    subtitle: isEn ? 'Vedic Astrological Report' : 'Informe astrológico védico',
    meta: [
      { label: isEn ? 'Date of birth' : 'Fecha de nacimiento', value: chart.subject.birthDate },
      { label: isEn ? 'Time' : 'Hora', value: chart.subject.birthTime },
      { label: isEn ? 'Place' : 'Lugar', value: chart.subject.place },
      { label: isEn ? 'Coordinates' : 'Coordenadas', value: chart.subject.coords }
    ].filter(m => m.value),
    epigraph: isEn
      ? 'Jyotish, the sacred science of light, illuminates the soul’s journey through the canvas of time.'
      : 'El jyotish, la ciencia sagrada de la luz, ilumina el camino del alma a través del tiempo.',
    intro: isEn ? [
      'This report presents the celestial pattern configured at the exact moment of your birth according to the classical Vedic tradition of India. Unlike Western tropical astrology, it utilizes the sidereal zodiac, reflecting the actual astronomical positions of the constellations, and offering profound clarity on dharma (life purpose) and karma.',
      'The natal chart, or Janma Kundali, is fundamentally an instrument of self-knowledge: it illuminates inherent strengths, karmic growth areas, and the chronological timing of major life seasons.'
    ] : [
      'Este informe presenta el mapa celeste que se configuró en el momento de tu nacimiento, según la tradición védica de la India. A diferencia de la astrología occidental, emplea el zodíaco sidéreo, que refleja las posiciones reales de las constelaciones, y por eso ofrece una lectura distinta del karma y el dharma (el propósito de vida).',
      'La carta natal, o Janma Kundali, es ante todo una herramienta de autoconocimiento: ayuda a reconocer fortalezas innatas, desafíos kármicos y los tiempos en que suelen producirse los eventos importantes de la vida.'
    ]
  };
}

function buildTechnicalData(chart, l) {
  const isEn = l === 'en';

  return {
    title: isEn ? 'Chart Technical Data' : 'Datos de la carta',
    body: [
      '{{CHARTS}}'
    ].join('\n')
  };
}

function getElementsInterpretation(elements, l) {
  const isEn = l === 'en';
  const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];
  const elementNames = isEn
    ? { fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water' }
    : { fire: 'Fuego', earth: 'Tierra', air: 'Aire', water: 'Agua' };

  const interps = isEn ? {
    fire: 'Fire dominates your chart, conferring passion, initiative, and an action-oriented temperament. Your vital drive inspires others.',
    earth: 'Earth dominates your chart, providing stability, practical perseverance, and a grounded relationship to material realities.',
    air: 'Air dominates your chart, providing intellectual agility, articulate communication, and conceptual clarity.',
    water: 'Water dominates your chart, imparting emotional depth, perceptive intuition, and psychological sensitivity.'
  } : {
    fire: 'Predomina el elemento Fuego en tu carta, lo que te confiere pasión, entusiasmo y una naturaleza orientada a la acción. Tu energía vital es intensa y contagiosa.',
    earth: 'Predomina el elemento Tierra en tu carta, lo que te da estabilidad, practicidad y una conexión sólida con el mundo material. Eres confiable y orientado a resultados.',
    air: 'Predomina el elemento Aire en tu carta, lo que te otorga inteligencia, comunicatividad y una mente ágil. Disfrutas el intercambio de ideas y el análisis.',
    water: 'Predomina el elemento Agua en tu carta, lo que te confiere sensibilidad emocional, intuición y profundidad psicológica. Eres empático y perceptivo.'
  };

  return `**${isEn ? 'Dominant element' : 'Elemento dominante'}:** ${elementNames[dominant[0]]}. ${interps[dominant[0]]}`;
}

function buildAscendantSection(chart, l) {
  const isEn = l === 'en';
  const asc = chart.ascendant;
  const s = SIGN_INTERPS[l][asc.signIndex];
  const rulerPlanet = chart.planets[SIGN_LORD_KEYS[asc.signIndex]];
  const signName = isEn ? SIGNS_EN[asc.signIndex] : asc.sign;

  return {
    title: isEn ? `Ascendant: ${signName}` : `Ascendente: ${asc.sign}`,
    body: [
      `### ${isEn ? 'The Gateway of Life' : 'La puerta de entrada'}`,
      '',
      isEn
        ? `Your Ascendant, or *Lagna* in Sanskrit, represents the lens through which you encounter the world, your physical vitality, and overall trajectory.`
        : `Tu Ascendente, o *Lagna* en sánscrito, es el punto cardinal de la carta védica. Representa la personalidad exterior, el cuerpo físico y la lente por la que experimentas la vida.`,
      '',
      isEn
        ? `**Your Ascendant is in ${signName}** (${s.keywords}) at ${asc.degreeFormatted}, within ${asc.nakshatra} nakshatra (pada ${asc.pada}).`
        : `**Tu Ascendente está en ${asc.sign}** (${s.keywords}) a ${asc.degreeFormatted}, en la nakshatra ${asc.nakshatra} (pada ${asc.pada}).`,
      '',
      `### ${isEn ? 'Essential Temperament' : 'Naturaleza esencial'}`,
      '',
      s.desc,
      '',
      `**${isEn ? 'Element' : 'Elemento'}:** ${s.element} · **${isEn ? 'Modality' : 'Modalidad'}:** ${s.modality} · **${isEn ? 'Ruler' : 'Regente'}:** ${s.ruler}`,
      '',
      `### ${isEn ? 'Your Chart Ruler' : 'El regente de tu carta'}`,
      '',
      `**${isEn ? 'Sign' : 'Signo'}:** ${sName(rulerPlanet.signIndex, l)} · **${houseWord(l)}:** ${rulerPlanet.house} · **${isEn ? 'Dignity' : 'Dignidad'}:** ${DIGNITY[l][rulerPlanet.dignity].label}${rulerPlanet.retrograde ? ` · **${isEn ? 'Motion' : 'Movimiento'}:** ${isEn ? 'retrograde' : 'retrógrado'}` : ''}`,
      '',
      isEn
        ? `The ruler of the Ascendant is the thread that runs through the whole chart. Yours is ${s.ruler}, placed in House ${rulerPlanet.house}, the domain of ${HOUSE_MEANINGS[l][rulerPlanet.house]}: that is where a large part of your energy naturally flows. In ${SIGNS_EN[rulerPlanet.signIndex]} it ${DIGNITY[l][rulerPlanet.dignity].text}.`
        : `El regente del Ascendente es el hilo que atraviesa toda la carta. El tuyo es ${s.ruler}, situado en la Casa ${rulerPlanet.house}, el ámbito de ${HOUSE_MEANINGS[l][rulerPlanet.house]}: hacia ahí fluye de forma natural buena parte de tu energía. En ${rulerPlanet.sign} ${DIGNITY[l][rulerPlanet.dignity].text}.`
    ].join('\n')
  };
}

// Párrafo de un graha: significado, signo y dignidad, casa, regencias y movimiento.
// Cada frase depende de un dato distinto, así que dos planetas no producen el mismo texto.
function planetParagraph(key, p, chart, l) {
  const isEn = l === 'en';
  const s = SIGN_INTERPS[l][p.signIndex];
  const name = pName(key, l);
  const sign = sName(p.signIndex, l);
  const parts = [];

  parts.push(isEn
    ? `${pArt(key, l, true)} signifies ${PLANET_SIGNIFICATIONS[l][key]}.`
    : `${pArt(key, l, true)} representa ${PLANET_SIGNIFICATIONS[l][key]}.`);

  if (p.dignity) {
    parts.push(isEn
      ? `In ${sign} (${s.keywords}) it ${DIGNITY[l][p.dignity].text}.`
      : `En ${sign} (${s.keywords}) ${DIGNITY[l][p.dignity].text}.`);
  } else {
    // Rahu y Ketu actúan a través del regente del signo que ocupan
    const disp = SIGN_LORD_KEYS[p.signIndex];
    const dp = chart.planets[disp];
    parts.push(isEn
      ? `As a shadow graha, it acts through the lord of its sign: in ${sign} (${s.keywords}), its results depend on ${pName(disp, l)}, placed in House ${dp.house}.`
      : `Como graha de sombra, actúa a través del regente de su signo: en ${sign} (${s.keywords}), sus resultados dependen de ${pName(disp, l)}, que está en la Casa ${dp.house}.`);
  }

  parts.push(isEn
    ? `In House ${p.house}, its energy is expressed above all through ${HOUSE_MEANINGS[l][p.house]}.`
    : `En la Casa ${p.house}, su energía se expresa sobre todo en ${HOUSE_MEANINGS[l][p.house]}.`);

  const others = p.rules.filter(h => h !== p.house);
  if (p.rules.length && others.length) {
    parts.push(isEn
      ? `As lord of ${p.rules.length > 1 ? 'Houses' : 'House'} ${rulesPhrase(p.rules, l)}, it links those matters with House ${p.house}.`
      : `Como regente de ${p.rules.length > 1 ? 'las casas' : 'la Casa'} ${rulesPhrase(p.rules, l)}, conecta esos temas con la Casa ${p.house}.`);
  } else if (p.rules.length) {
    parts.push(isEn
      ? `It occupies a house it rules itself, which reinforces the matters of House ${p.house}.`
      : `Ocupa una casa que él mismo rige, lo que refuerza los temas de la Casa ${p.house}.`);
  }

  if (p.retrograde && key !== 'Ra' && key !== 'Ke') {
    parts.push(isEn
      ? 'It was retrograde at your birth: its energy turns more reflective and inward, and its themes tend to be revisited and deepened over time.'
      : 'Estaba retrógrado al nacer: su energía se vuelve más reflexiva e interior, y sus temas tienden a revisarse y profundizarse con el tiempo.');
  }
  return parts.join(' ');
}

function buildPlanetsSection(chart, l) {
  const isEn = l === 'en';
  const blocks = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].map(key => {
    const p = chart.planets[key];
    const data = [
      `**${isEn ? 'Degree' : 'Grado'}:** ${p.degreeFormatted}`,
      `**Nakshatra:** ${p.nakshatra} pada ${p.pada}`,
      `**Navamsha (D-9):** ${sName(p.navamshaIndex, l)}`
    ];
    if (p.dignity) data.push(`**${isEn ? 'Dignity' : 'Dignidad'}:** ${DIGNITY[l][p.dignity].label}`);
    if (p.retrograde && key !== 'Ra' && key !== 'Ke') data.push(`**${isEn ? 'Motion' : 'Movimiento'}:** ${isEn ? 'retrograde' : 'retrógrado'}`);
    return [
      `### ${pName(key, l)} ${isEn ? 'in' : 'en'} ${sName(p.signIndex, l)} (${houseWord(l)} ${p.house})`,
      '',
      data.join(' · '),
      '',
      planetParagraph(key, p, chart, l)
    ].join('\n');
  }).join('\n\n');

  return { title: isEn ? 'Planets in Signs and Houses' : 'Planetas en signos y casas', body: blocks };
}

function buildNakshatraSection(chart, l) {
  const isEn = l === 'en';
  const rows = Object.entries(chart.planets)
    .filter(([key]) => key !== 'Asc')
    .map(([key, p]) => {
      const pName = PLANET_NAMES[l][key] || p.name;
      const interp = NAKSHATRA_INTERPS[l][p.nakshatraIndex] || '';
      return `- **${pName} ${isEn ? 'in' : 'en'} ${p.nakshatra}** (pada ${p.pada}) · ${interp}`;
    })
    .join('\n');

  const moonNak = chart.planets.Mo.nakshatra;
  return {
    title: isEn ? 'Nakshatras · Lunar Mansions' : 'Nakshatras',
    body: [
      isEn
        ? 'The 27 nakshatras are subtle 13°20′ divisions of the zodiac revealing refined psychological and karmic nuances that signs alone do not fully capture. The Moon’s placement determines the *Janma Nakshatra*, the emotional matrix of the psyche and the starting point of the Vimshottari Dasha system.'
        : 'Las 27 nakshatras son divisiones más finas del zodíaco que revelan matices psicológicos y kármicos que los signos no alcanzan a captar. La nakshatra de la Luna es especialmente significativa: determina el *Janma Nakshatra*, que rige la naturaleza mental-emocional básica y el inicio de los periodos planetarios (dashas).',
      '',
      `### ${isEn ? 'Planetary Nakshatras' : 'Nakshatras de tus planetas'}`,
      '',
      rows,
      '',
      `### ${isEn ? 'Birth Star (Janma Nakshatra)' : 'Nakshatra lunar'}`,
      '',
      isEn
        ? `Your Moon is in **${moonNak}**. In Jyotish, the Moon represents the conscious mind (*Manas*). This nakshatra colors your instinctual nature, cognitive style, and grounds your planetary periods.`
        : `Tu Luna está en **${moonNak}**, lo cual es fundamental: en el jyotish la Luna representa la mente (*Manas*) y fija el patrón emocional básico. Esta nakshatra matiza toda tu experiencia y es la base de tu sistema de dashas.`
    ].join('\n')
  };
}

function buildHousesSection(chart, l) {
  const isEn = l === 'en';
  const dom = dominantHouses(chart);
  const empty = chart.houseTable.filter(h => !h.occupants.length).map(h => h.house);
  // Casas cuyo regente está en la propia casa: temas que se sostienen solos
  const selfRuled = chart.houseTable.filter(h => h.lordHouse === h.house).map(h => h.house);

  const domText = dom.houses.map(h => {
    const occ = joinList(chart.houseTable[h - 1].occupants.map(k => pName(k, l)), l);
    return isEn
      ? `Your **House ${h}** gathers ${dom.max} planets (${occ}): a good share of your energy and attention goes to ${HOUSE_MEANINGS[l][h]}.`
      : `Tu **Casa ${h}** reúne ${dom.max} planetas (${occ}): buena parte de tu energía y atención se vuelca en ${HOUSE_MEANINGS[l][h]}.`;
  });

  return {
    title: isEn ? 'The Twelve Houses' : 'Las doce casas',
    body: [
      isEn
        ? `Under the Whole Sign system, each house coincides with an entire sign. Your 1st House is ${SIGNS_EN[chart.ascendant.signIndex]}, and the rest follow in order. Each house is read through two things: the planets inside it and the planet that rules it.`
        : `En el sistema de signo completo (*Whole Sign*), cada casa coincide con un signo entero. Tu Casa 1 es ${chart.ascendant.sign}, y desde ahí se cuentan las demás. Cada casa se lee por dos vías: los planetas que la ocupan y el planeta que la rige.`,
      '',
      '{{HOUSES_TABLE}}',
      '',
      `### ${isEn ? 'Where Your Energy Gathers' : 'Dónde se concentra tu energía'}`,
      '',
      domText.join('\n\n'),
      '',
      `### ${isEn ? 'Empty Houses' : 'Casas vacías'}`,
      '',
      isEn
        ? `Houses ${joinList(empty.map(String), l)} hold no planets. An empty house is not an inactive one: its matters unfold according to its lord, whose position the table shows.`
        : `Las casas ${joinList(empty.map(String), l)} no tienen planetas. Una casa vacía no es una casa inactiva: sus temas se desarrollan según su regente, cuya posición indica la tabla.`,
      ...(selfRuled.length ? [
        '',
        isEn
          ? `House ${joinList(selfRuled.map(String), l)} ${selfRuled.length > 1 ? 'are' : 'is'} ruled by a planet placed in ${selfRuled.length > 1 ? 'them' : 'it'}: matters that sustain themselves and tend to be stable in your life.`
          : `${selfRuled.length > 1 ? 'Las casas' : 'La Casa'} ${joinList(selfRuled.map(String), l)} ${selfRuled.length > 1 ? 'tienen' : 'tiene'} a su regente dentro: temas que se sostienen por sí mismos y suelen ser estables en tu vida.`
      ] : [])
    ].join('\n')
  };
}

// Qué activa un periodo: dónde está su regente en la carta natal y qué casas rige
function dashaPlacement(lord, chart, l) {
  const isEn = l === 'en';
  const key = DASHA_KEY[lord];
  const p = chart.planets[key];
  const name = pName(key, l);
  const sign = sName(p.signIndex, l);
  let text = isEn
    ? `In your chart, ${name} sits in ${sign}, House ${p.house} (${HOUSE_SHORT[l][p.house]})`
    : `En tu carta, ${name} está en ${sign}, Casa ${p.house} (${HOUSE_SHORT[l][p.house]})`;
  if (p.dignity) text += isEn ? `, where it ${DIGNITY[l][p.dignity].text}` : `, donde ${DIGNITY[l][p.dignity].text}`;
  text += '. ';
  if (p.rules.length) {
    text += isEn
      ? `It rules ${p.rules.length > 1 ? 'Houses' : 'House'} ${rulesPhrase(p.rules, l)}: these are the areas this period brings to the foreground.`
      : `Rige ${p.rules.length > 1 ? 'las casas' : 'la Casa'} ${rulesPhrase(p.rules, l)}: son los ámbitos que este periodo pone en primer plano.`;
  } else {
    const disp = SIGN_LORD_KEYS[p.signIndex];
    text += isEn
      ? `As a shadow graha it works through ${pName(disp, l)}, lord of ${sign}: the period brings forward House ${p.house} and the houses ${pName(disp, l)} touches in your chart.`
      : `Como graha de sombra actúa a través de ${pName(disp, l)}, regente de ${sign}: el periodo pone en primer plano la Casa ${p.house} y las casas que ${pName(disp, l)} toca en tu carta.`;
  }
  return text;
}

// Versión breve para el subperiodo: dónde está su regente y qué casas suma
function subPlacement(lord, chart, l) {
  const isEn = l === 'en';
  const key = DASHA_KEY[lord];
  const p = chart.planets[key];
  const focus = [p.house, ...p.rules.filter(h => h !== p.house)];
  return isEn
    ? `${capFirst(pArt(key, l))}, in House ${p.house} of your chart${p.rules.length ? ` and lord of ${p.rules.length > 1 ? 'Houses' : 'House'} ${joinList(p.rules.map(String), l)}` : ''}, brings ${joinList(focus.map(h => HOUSE_SHORT[l][h]), l)} into these months.`
    : `${capFirst(pArt(key, l))}, en la Casa ${p.house} de tu carta${p.rules.length ? ` y regente de ${p.rules.length > 1 ? 'las casas' : 'la Casa'} ${joinList(p.rules.map(String), l)}` : ''}, trae a estos meses los temas de ${focus.map(h => HOUSE_SHORT[l][h]).join(', ')}.`;
}

function buildDashaSection(chart, l) {
  const isEn = l === 'en';
  const md = chart.currentDasha;
  const ad = chart.currentAntardasha;
  const mdName = dashaLordName(md.lord, l);
  const fmt = (n) => n.toFixed(1).replace('.', isEn ? '.' : ',');
  const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  const body = [
    isEn
      ? 'The 120-year Vimshottari Dasha system is the cornerstone of predictive Jyotish. Starting from the Moon’s exact degree at birth, it divides life into major periods (*mahādaśā*) ruled by different planets, each subdivided into sub-periods (*antardaśā*) that fine-tune its tone.'
      : 'El sistema Vimshottari Dasha es la herramienta predictiva central del jyotish. A partir del grado exacto de la Luna al nacer, divide la vida en periodos mayores (*mahādaśā*) regidos por distintos planetas, y cada uno en subperiodos (*antardaśā*) que matizan su tono.',
    '',
    '{{DASHA_TABLE}}',
    '',
    `### ${isEn ? `Current Major Period: ${mdName}` : `Periodo mayor actual: ${mdName}`}`,
    '',
    `**${isEn ? 'Duration' : 'Duración'}:** ${fmt(md.years)} ${isEn ? 'years' : 'años'} · **${isEn ? 'Timeline' : 'Fechas'}:** ${yearSpan(md.start, md.end)}`,
    '',
    DASHA_INTERPS[l][md.lord] || '',
    '',
    dashaPlacement(md.lord, chart, l)
  ];

  if (ad) {
    const adName = dashaLordName(ad.lord, l);
    body.push(
      '',
      `### ${isEn ? `Sub-periods of ${mdName}` : `Subperiodos de ${mdName}`}`,
      '',
      (isEn
        ? `You are now in the **${mdName}–${adName}** sub-period (${yearSpan(ad.start, ad.end)}). ${ad.lord === md.lord ? `Its first sub-period concentrates the pure tone of ${mdName}.` : `Within the climate of ${mdName}, it adds a note of ${lowerFirst(DASHA_INTERPS[l][ad.lord]).replace(/^period of /, '').replace(/\.$/, '')}.`}`
        : `Ahora transitas el subperiodo **${mdName}–${adName}** (${yearSpan(ad.start, ad.end)}). ${ad.lord === md.lord ? `Es el primer subperiodo y concentra el tono puro de ${mdName}.` : `Dentro del clima de ${mdName}, añade una nota de ${lowerFirst(DASHA_INTERPS[l][ad.lord]).replace(/^periodo de /, '').replace(/\.$/, '')}.`}`) + ' ' + subPlacement(ad.lord, chart, l),
      '',
      '{{ANTARDASHA_TABLE}}'
    );
  }

  if (chart.nextDasha) {
    const nx = chart.nextDasha;
    body.push(
      '',
      `### ${isEn ? 'What Comes Next' : 'Lo que viene'}`,
      '',
      isEn
        ? `In ${nx.start.getFullYear()} the major period of **${dashaLordName(nx.lord, l)}** begins (${fmt(nx.years)} years). ${DASHA_INTERPS[l][nx.lord]}`
        : `En ${nx.start.getFullYear()} comienza el periodo mayor de **${dashaLordName(nx.lord, l)}** (${fmt(nx.years)} años). ${DASHA_INTERPS[l][nx.lord]}`
    );
  }

  return {
    title: isEn ? 'Planetary Periods · Vimshottari Dasha' : 'Periodos · Vimshottari Dasha',
    body: body.join('\n')
  };
}

function buildSynthesis(chart, l) {
  const isEn = l === 'en';
  const asc = chart.ascendant;
  const ascSign = SIGN_INTERPS[l][asc.signIndex];
  const sunSign = SIGN_INTERPS[l][chart.planets.Su.signIndex];
  const moonSign = SIGN_INTERPS[l][chart.planets.Mo.signIndex];

  return {
    title: isEn ? 'Synthesis & Life Purpose' : 'Síntesis',
    body: [
      isEn ? 'Key threads uniting your chart:' : 'Algunos hilos que articulan tu carta:',
      '',
      `### ${isEn ? 'Core Trinity' : 'Tríada esencial'}`,
      '',
      isEn
        ? `- **Ascendant ${SIGNS_EN[asc.signIndex]}** · outer personality and life path · ${ascSign.keywords}`
        : `- **Ascendente ${asc.sign}** · la personalidad exterior y el camino de vida · ${ascSign.keywords}`,
      isEn
        ? `- **Sun in ${SIGNS_EN[chart.planets.Su.signIndex]}** · essential soul purpose and vitality · ${sunSign.keywords}`
        : `- **Sol en ${chart.planets.Su.sign}** · el alma y el propósito esencial · ${sunSign.keywords}`,
      isEn
        ? `- **Moon in ${SIGNS_EN[chart.planets.Mo.signIndex]}** · emotional mind and inner sanctuary · ${moonSign.keywords}`
        : `- **Luna en ${chart.planets.Mo.sign}** · la mente emocional y las necesidades internas · ${moonSign.keywords}`,
      '',
      `### ${isEn ? 'Where Your Path Leads' : 'Hacia dónde apunta tu camino'}`,
      '',
      synthesisDirection(chart, l),
      '',
      `### ${isEn ? 'Strengths' : 'Fortalezas'}`,
      '',
      synthesisStrengths(chart, l),
      '',
      `### ${isEn ? 'Karmic Lessons' : 'Desafíos kármicos'}`,
      '',
      synthesisLessons(chart, l),
      '',
      `### ${isEn ? 'The Present Moment' : 'El momento presente'}`,
      '',
      synthesisNow(chart, l),
      '',
      isEn
        ? '> This report is an instrument of self-knowledge, not a rigid verdict. Jyotish maps the landscape; you navigate the journey.'
        : '> Este informe es una herramienta de autoconocimiento, no una sentencia fija. El jyotish muestra el mapa; tú recorres el camino.'
    ].join('\n')
  };
}

// ---------- Síntesis: cada párrafo se arma con datos de la carta ----------

const ELEMENT_TRAITS = {
  es: { fire: 'la iniciativa y el entusiasmo', earth: 'la constancia y el sentido práctico', air: 'la reflexión y el intercambio de ideas', water: 'la sensibilidad y la intuición' },
  en: { fire: 'initiative and enthusiasm', earth: 'steadiness and practical sense', air: 'reflection and the exchange of ideas', water: 'sensitivity and intuition' }
};

function synthesisDirection(chart, l) {
  const isEn = l === 'en';
  const P = chart.planets;
  const rulerKey = SIGN_LORD_KEYS[chart.ascendant.signIndex];
  const ruler = P[rulerKey];
  const ninth = chart.houseTable[8];
  const el = elementBalance(chart);
  const dom = dominantHouses(chart).houses.filter(h => h !== ruler.house);
  const parts = [];

  parts.push(isEn
    ? `The ruler of your Ascendant, ${pArt(rulerKey, l)} in House ${ruler.house}, orients your life towards ${HOUSE_MEANINGS[l][ruler.house]}.`
    : `El regente de tu Ascendente, ${pArt(rulerKey, l)} en la Casa ${ruler.house}, orienta tu vida hacia ${HOUSE_MEANINGS[l][ruler.house]}.`);
  if (dom.length) {
    parts.push(isEn
      ? `House ${joinList(dom.map(String), l)}, the most populated, adds the domain of ${joinList(dom.map(h => HOUSE_SHORT[l][h]), l)}.`
      : `${dom.length > 1 ? 'Las casas' : 'La Casa'} ${joinList(dom.map(String), l)}, ${dom.length > 1 ? 'las más pobladas, suman' : 'la más poblada, suma'} los temas de ${joinList(dom.map(h => HOUSE_SHORT[l][h]), l)}.`);
  }
  parts.push(isEn
    ? `The lord of your 9th House, the house of dharma, is ${pArt(ninth.lord, l)} in House ${ninth.lordHouse}: your sense of purpose is realised through ${HOUSE_MEANINGS[l][ninth.lordHouse]}.`
    : `El regente de tu Casa 9, la del dharma, es ${pArt(ninth.lord, l)} en la Casa ${ninth.lordHouse}: tu sentido de propósito se realiza a través de ${HOUSE_MEANINGS[l][ninth.lordHouse]}.`);
  parts.push(isEn
    ? `${ELEMENT_NAMES[l][el.dominant]} prevails (${el.count} of 7 grahas), which gives you ${ELEMENT_TRAITS[l][el.dominant]}.`
    : `Predomina el ${ELEMENT_NAMES[l][el.dominant]} (${el.count} de 7 grahas), que te da ${ELEMENT_TRAITS[l][el.dominant]}.`);
  if (el.missing.length) {
    parts.push(isEn
      ? `The absence of ${joinList(el.missing.map(k => ELEMENT_NAMES[l][k]), l)} points to a quality worth cultivating consciously: ${joinList(el.missing.map(k => ELEMENT_TRAITS[l][k]), l)}.`
      : `La ausencia de ${joinList(el.missing.map(k => ELEMENT_NAMES[l][k]), l)} señala una cualidad que conviene cultivar a conciencia: ${joinList(el.missing.map(k => ELEMENT_TRAITS[l][k]), l)}.`);
  }
  return parts.join(' ');
}

function synthesisStrengths(chart, l) {
  const isEn = l === 'en';
  const P = chart.planets;
  const strong = strongPlanets(chart);
  const desc = (k) => `${pArt(k, l)} (${DIGNITY[l][P[k].dignity].label.toLowerCase()}, ${houseWord(l)} ${P[k].house})`;
  const parts = [];
  if (strong.length) {
    parts.push(isEn
      ? `Your firmest ${strong.length > 1 ? 'grahas are' : 'graha is'} ${joinList(strong.map(desc), l)}: you can lean on the matters ${strong.length > 1 ? 'they govern' : 'it governs'}.`
      : `${strong.length > 1 ? 'Tus grahas más firmes son' : 'Tu graha más firme es'} ${joinList(strong.map(desc), l)}: puedes apoyarte en los temas que ${strong.length > 1 ? 'gobiernan' : 'gobierna'}.`);
  } else {
    parts.push(isEn
      ? 'No graha is exalted or in its own sign: your strength is not concentrated in one point but spread out, and it is built over time.'
      : 'Ningún graha está exaltado ni en su propio signo: tu fuerza no se concentra en un punto, se reparte y se construye con el tiempo.');
  }
  if (!strong.includes('Ju')) {
    parts.push(isEn
      ? `Jupiter, the great benefic, protects the matters of House ${P.Ju.house} (${HOUSE_SHORT[l][P.Ju.house]}).`
      : `Júpiter, el gran benéfico, protege los temas de la Casa ${P.Ju.house} (${HOUSE_SHORT[l][P.Ju.house]}).`);
  }
  return parts.join(' ');
}

function synthesisLessons(chart, l) {
  const isEn = l === 'en';
  const P = chart.planets;
  const weak = weakPlanets(chart);
  const retro = ['Ma', 'Me', 'Ju', 'Ve', 'Sa'].filter(k => P[k].retrograde);
  const parts = [];
  if (weak.length) {
    parts.push(capFirst(isEn
      ? `${joinList(weak.map(k => `${pArt(k, l)} (House ${P[k].house})`), l)} ${weak.length > 1 ? 'are' : 'is'} debilitated: ${weak.length > 1 ? 'their' : 'its'} matters ask for patience and conscious work, and often become a source of wisdom once matured.`
      : `${joinList(weak.map(k => `${pArt(k, l)} (Casa ${P[k].house})`), l)} ${weak.length > 1 ? 'están' : 'está'} en caída: sus temas piden paciencia y trabajo consciente, y una vez madurados suelen convertirse en fuente de sabiduría.`));
  }
  parts.push(isEn
    ? `Saturn in House ${P.Sa.house} shows where maturity comes slowly but solidly: ${HOUSE_MEANINGS[l][P.Sa.house]}.`
    : `Saturno en la Casa ${P.Sa.house} muestra dónde la madurez llega despacio pero firme: ${HOUSE_MEANINGS[l][P.Sa.house]}.`);
  parts.push(isEn
    ? `The Rahu–Ketu axis runs between House ${P.Ra.house} (${HOUSE_SHORT[l][P.Ra.house]}), where you are called to grow, and House ${P.Ke.house} (${HOUSE_SHORT[l][P.Ke.house]}), where you carry talents already mastered.`
    : `El eje Rahu–Ketu se tiende entre la Casa ${P.Ra.house} (${HOUSE_SHORT[l][P.Ra.house]}), hacia donde te toca crecer, y la Casa ${P.Ke.house} (${HOUSE_SHORT[l][P.Ke.house]}), donde traes talentos ya cultivados.`);
  if (retro.length) {
    parts.push(isEn
      ? `${joinList(retro.map(k => pName(k, l)), l)} ${retro.length > 1 ? 'were' : 'was'} retrograde at birth: themes you revisit and refine more than once.`
      : `${joinList(retro.map(k => pName(k, l)), l)} ${retro.length > 1 ? 'estaban retrógrados' : 'estaba retrógrado'} al nacer: temas que se revisan y pulen más de una vez.`);
  }
  return parts.join(' ');
}

function synthesisNow(chart, l) {
  const isEn = l === 'en';
  const md = chart.currentDasha, ad = chart.currentAntardasha;
  const mdKey = DASHA_KEY[md.lord];
  const p = chart.planets[mdKey];
  const focus = [p.house, ...p.rules.filter(h => h !== p.house)];
  const adText = ad && ad.lord !== md.lord
    ? (isEn ? `, in its ${dashaLordName(ad.lord, l)} sub-period until ${ad.end.getFullYear()}` : `, en su subperiodo de ${dashaLordName(ad.lord, l)} hasta ${ad.end.getFullYear()}`)
    : '';
  return isEn
    ? `You are living the major period of ${dashaLordName(md.lord, l)} until ${md.end.getFullYear()}${adText}. It is a time to work on ${focus.length > 1 ? 'Houses' : 'House'} ${rulesPhrase(focus, l)}: the houses this planet occupies and rules in your chart.`
    : `Vives el periodo mayor de ${dashaLordName(md.lord, l)} hasta ${md.end.getFullYear()}${adText}. Es un tiempo para trabajar ${focus.length > 1 ? 'las casas' : 'la Casa'} ${rulesPhrase(focus, l)}: las que este planeta ocupa y rige en tu carta.`;
}

// ---------- Glosario y método ----------

function buildGlossary(chart, l) {
  const isEn = l === 'en';
  const terms = isEn ? [
    ['Graha', 'each of the nine celestial bodies of Jyotish: the Sun, the Moon, five planets and the lunar nodes Rahu and Ketu.'],
    ['Rāśi', 'zodiac sign. Jyotish uses the sidereal zodiac, aligned with the actual constellations.'],
    ['Lagna', 'the Ascendant: the sign rising on the eastern horizon at the moment of birth. It defines House 1.'],
    ['Bhāva', 'house: each of the twelve areas of life. Here each house coincides with a whole sign (Whole Sign).'],
    ['House lord', 'the planet that rules the sign of a house. Where it sits shows how the matters of that house unfold.'],
    ['Nakshatra', 'each of the 27 lunar mansions of 13°20′; they add psychological nuance to the signs.'],
    ['Pada', 'each quarter of a nakshatra (3°20′).'],
    ['Navāṃśa (D-9)', 'divisional chart that splits each sign into nine parts; it shows the inner maturity of each graha.'],
    ['Dignity', 'how comfortable a graha is in its sign: exalted, mūlatrikoṇa, own, friendly, neutral, enemy or debilitated.'],
    ['Retrograde', 'apparent backward motion of a planet as seen from Earth; its themes tend to turn inward.'],
    ['Mahādaśā · Antardaśā', 'major period and sub-period of the Vimshottari Dasha system.'],
    ['Ayanāṃśa', 'the difference between the tropical and the sidereal zodiac. This report uses Lahiri.']
  ] : [
    ['Graha', 'cada uno de los nueve cuerpos celestes del jyotish: Sol, Luna, cinco planetas y los nodos lunares Rahu y Ketu.'],
    ['Rāśi', 'signo zodiacal. El jyotish usa el zodíaco sidéreo, alineado con las constelaciones reales.'],
    ['Lagna', 'el Ascendente: el signo que asciende por el horizonte este en el momento del nacimiento. Define la Casa 1.'],
    ['Bhāva', 'casa: cada una de las doce áreas de la vida. Aquí cada casa coincide con un signo entero (*Whole Sign*).'],
    ['Regente', 'el planeta que rige el signo de una casa. Su posición muestra cómo se desarrollan los temas de esa casa.'],
    ['Nakshatra', 'cada una de las 27 mansiones lunares de 13°20′; añaden matices psicológicos a los signos.'],
    ['Pada', 'cada cuarto de una nakshatra (3°20′).'],
    ['Navāṃśa (D-9)', 'carta divisional que divide cada signo en nueve partes; muestra la madurez interior de cada graha.'],
    ['Dignidad', 'qué tan cómodo está un graha en su signo: exaltado, mūlatrikoṇa, propio, amigo, neutral, enemigo o en caída.'],
    ['Retrógrado', 'movimiento aparente hacia atrás de un planeta visto desde la Tierra; sus temas tienden a volverse hacia dentro.'],
    ['Mahādaśā · Antardaśā', 'periodo mayor y subperiodo del sistema Vimshottari Dasha.'],
    ['Ayanāṃśa', 'la diferencia entre el zodíaco tropical y el sidéreo. Este informe usa el de Lahiri.']
  ];
  return {
    title: isEn ? 'Glossary and Method' : 'Glosario y método',
    body: [
      terms.map(([t, d]) => `- **${t}** · ${d}`).join('\n'),
      '',
      `### ${isEn ? 'How This Chart Was Calculated' : 'Cómo se calculó esta carta'}`,
      '',
      isEn
        ? `Planetary positions come from the astronomy-engine ephemeris and are converted to the sidereal zodiac with the Lahiri ayanāṃśa (${chart.subject.ayanamsa.replace(/^Lahiri\s*\(|\)$/g, '')} at your birth). Houses follow the Whole Sign system, Rahu is the mean lunar node, and dignities follow the classical rules of Parāśara.`
        : `Las posiciones planetarias provienen de las efemérides de astronomy-engine y se convierten al zodíaco sidéreo con el ayanāṃśa de Lahiri (${chart.subject.ayanamsa.replace(/^Lahiri\s*\(|\)$/g, '')} en tu nacimiento). Las casas siguen el sistema de signo completo, Rahu es el nodo lunar medio y las dignidades siguen las reglas clásicas de Parāśara.`
    ].join('\n')
  };
}

module.exports = { generateReport };
