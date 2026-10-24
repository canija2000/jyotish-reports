/**
 * Generador de Reporte Jyotish (Bilingüe ES / EN)
 * Devuelve { cover, sections, lang } para que pdf.js lo componga.
 * Copy sobrio, riguroso y sin emojis: un documento editorial de autoconocimiento.
 */

// ========== DICCIONARIOS Y TRADUCCIONES ==========

const SIGNS_EN = [
  'Aries', 'Tauro', 'Gemini', 'Cancer', 'Leo', 'Virgo',
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

// ========== GENERADOR PRINCIPAL ==========

function generateReport(chart, lang = 'es') {
  const l = (lang === 'en') ? 'en' : 'es';
  return {
    lang: l,
    cover: buildCover(chart, l),
    sections: [
      buildTechnicalData(chart, l),
      buildAscendantSection(chart, l),
      buildPlanetsSection(chart, l),
      buildNakshatraSection(chart, l),
      buildHousesSection(chart, l),
      buildDashaSection(chart, l),
      buildSynthesis(chart, l)
    ]
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
      { label: isEn ? 'Place' : 'Lugar', value: chart.subject.place || '—' },
      { label: isEn ? 'Coordinates' : 'Coordenadas', value: chart.subject.coords }
    ],
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
  const el = chart.elements;
  const elLine = isEn
    ? `Fire ${el.fire} · Earth ${el.earth} · Air ${el.air} · Water ${el.water}`
    : `Fuego ${el.fire} · Tierra ${el.earth} · Aire ${el.air} · Agua ${el.water}`;

  return {
    title: isEn ? 'Chart Technical Data' : 'Datos de la carta',
    body: [
      `**${isEn ? 'Zodiac system' : 'Sistema'}:** ${chart.subject.zodiac}`,
      `**Ayanamsa:** ${chart.subject.ayanamsa}`,
      `**${isEn ? 'House system' : 'Casas'}:** ${chart.subject.houseSystem}`,
      '',
      `### ${isEn ? 'Elemental Balance' : 'Balance elemental'}`,
      '',
      elLine,
      '',
      getElementsInterpretation(chart.elements, l)
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
  const rulerKey = getRulerKey(s.ruler);
  const rulerPlanet = chart.planets[rulerKey];
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
      isEn
        ? `As a ${signName} rising, your chart ruler is ${s.ruler}, positioned in House ${rulerPlanet?.house || '?'} (${isEn ? SIGNS_EN[rulerPlanet?.signIndex] : rulerPlanet?.sign}). This house marks a key focal point of your life's vitality and creative focus.`
        : `Como ${asc.sign} ascendente, tu regente es ${s.ruler}, que en tu carta se halla en la Casa ${rulerPlanet?.house || '?'} y en el signo ${rulerPlanet?.sign || '?'}. Esa posición del regente señala el área de vida donde se concentra buena parte de tu energía.`
    ].join('\n')
  };
}

function getRulerKey(ruler) {
  const map = {
    'Sol': 'Su', 'Luna': 'Mo', 'Marte': 'Ma', 'Mercurio': 'Me', 'Júpiter': 'Ju', 'Venus': 'Ve', 'Saturno': 'Sa',
    'Sun': 'Su', 'Moon': 'Mo', 'Mars': 'Ma', 'Mercury': 'Me', 'Jupiter': 'Ju', 'Saturn': 'Sa'
  };
  return map[ruler] || 'Su';
}

function buildPlanetsSection(chart, l) {
  const isEn = l === 'en';
  const blocks = Object.entries(chart.planets)
    .filter(([key]) => key !== 'Asc')
    .map(([key, p]) => {
      const s = SIGN_INTERPS[l][p.signIndex];
      const pName = PLANET_NAMES[l][key] || p.name;
      const sName = isEn ? SIGNS_EN[p.signIndex] : p.sign;
      const sig = PLANET_SIGNIFICATIONS[l][key] || 'planetary energy';
      const houseMeaning = HOUSE_MEANINGS[l][p.house] || '';

      if (isEn) {
        return [
          `### ${pName} in ${sName} (House ${p.house})`,
          '',
          `**Degree:** ${p.degreeFormatted} · **Nakshatra:** ${p.nakshatra} pada ${p.pada} · **Navamsha (D-9):** ${SIGNS_EN[p.navamshaIndex] || p.navamsha}`,
          '',
          `In the Vedic system, ${pName} signifies ${sig}. In ${sName} (${s.keywords}) and House ${p.house}, this archetype expresses predominantly through ${houseMeaning}.`
        ].join('\n');
      } else {
        return [
          `### ${p.name} en ${p.sign} (Casa ${p.house})`,
          '',
          `**Grado:** ${p.degreeFormatted} · **Nakshatra:** ${p.nakshatra} pada ${p.pada} · **Navamsha (D-9):** ${p.navamsha}`,
          '',
          `En el sistema védico, ${p.name} representa ${sig}. Su posición en ${p.sign} (${s.keywords}) y en la Casa ${p.house} indica que esta energía se expresa sobre todo en ${houseMeaning}.`
        ].join('\n');
      }
    })
    .join('\n\n');

  return { title: isEn ? 'Planets in Signs and Houses' : 'Planetas en signos y casas', body: blocks };
}

function buildNakshatraSection(chart, l) {
  const isEn = l === 'en';
  const rows = Object.entries(chart.planets)
    .filter(([key]) => key !== 'Asc')
    .map(([key, p]) => {
      const pName = PLANET_NAMES[l][key] || p.name;
      const interp = NAKSHATRA_INTERPS[l][p.nakshatraIndex] || '';
      return `- **${pName} in ${p.nakshatra}** (pada ${p.pada}) · ${interp}`;
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
  const houseCounts = {};
  Object.entries(chart.planets).forEach(([key, p]) => {
    if (key === 'Asc') return;
    houseCounts[p.house] = (houseCounts[p.house] || 0) + 1;
  });
  const dom = Object.entries(houseCounts).sort((a, b) => b[1] - a[1])[0];

  const rows = Object.entries(houseCounts)
    .sort((a, b) => a[0] - b[0])
    .map(([h, count]) => {
      const meaning = HOUSE_MEANINGS[l][parseInt(h, 10)];
      const pWord = isEn ? (count > 1 ? 'planets' : 'planet') : (count > 1 ? 'planetas' : 'planeta');
      return `- **${isEn ? 'House' : 'Casa'} ${h}** · ${meaning} · ${count} ${pWord}`;
    })
    .join('\n');

  return {
    title: isEn ? 'House Distribution' : 'Casas',
    body: [
      isEn
        ? `Under the Whole Sign system, each astrological house coincides with an entire 30° zodiacal sign. Your 1st House is ${SIGNS_EN[chart.ascendant.signIndex]}, from which all subsequent houses unfold.`
        : `En el sistema de signo completo (*Whole Sign*), cada casa coincide con un signo zodiacal entero. Tu Casa 1 es ${chart.ascendant.sign}, y desde ahí se cuentan las demás.`,
      '',
      `### ${isEn ? 'Planetary Distribution' : 'Distribución planetaria'}`,
      '',
      rows,
      '',
      `### ${isEn ? 'Dominant House' : 'Casa dominante'}`,
      '',
      isEn
        ? `Your **House ${dom[0]}** gathers ${dom[1]} planets, indicating that considerable life energy and karmic activity converge around ${HOUSE_MEANINGS[l][parseInt(dom[0], 10)]}.`
        : `Tu **Casa ${dom[0]}** agrupa ${dom[1]} planetas, lo que indica que buena parte de tu energía y atención se vuelca en ${HOUSE_MEANINGS[l][parseInt(dom[0], 10)]}: un área donde se concentran eventos y aprendizajes.`
    ].join('\n')
  };
}

function buildDashaSection(chart, l) {
  const isEn = l === 'en';
  const now = new Date();
  const cur = chart.currentDasha;
  const curLord = cur.lord;
  const interp = DASHA_INTERPS[l][curLord] || '';

  const list = chart.dashas.map(d => {
    const active = d.start <= now && d.end > now;
    const activeTag = active ? (isEn ? ' (current)' : ' (actual)') : '';
    const yrWord = isEn ? 'years' : 'años';
    return `- **${d.lord}** (${d.years.toFixed(1)} ${yrWord}) · ${d.start.getFullYear()}–${d.end.getFullYear()}${activeTag}`;
  }).join('\n');

  return {
    title: isEn ? 'Planetary Seasons · Vimshottari Dasha' : 'Periodos · Vimshottari Dasha',
    body: [
      isEn
        ? 'The 120-year Vimshottari Dasha system is the cornerstone of classical predictive Jyotish. Originating from the Moon’s exact degree at birth, it divides life into chapters governed by distinct planetary archetypes.'
        : 'El sistema Vimshottari Dasha es una de las herramientas predictivas más usadas del jyotish. A partir de la posición de la Luna al nacer, divide la vida en periodos regidos por distintos planetas, cada uno con su cualidad y sus lecciones.',
      '',
      `### ${isEn ? 'Dasha Sequence' : 'Secuencia de dashas'}`,
      '',
      list,
      '',
      `### ${isEn ? `Current Major Period: ${curLord}` : `Periodo actual: ${curLord}`}`,
      '',
      `**${isEn ? 'Duration' : 'Duración'}:** ${cur.years.toFixed(1)} ${isEn ? 'years' : 'años'} · **${isEn ? 'Timeline' : 'Fechas'}:** ${cur.start.getFullYear()}–${cur.end.getFullYear()}`,
      '',
      interp,
      '',
      isEn
        ? `This planetary archetype sets the thematic atmosphere of your current chapter. The events, opportunities, and inner reflections will resonate with the nature of ${curLord} and its natal house placement.`
        : `Este es el clima astrológico que atraviesas hoy. Los eventos, oportunidades y desafíos del periodo estarán teñidos por la energía de ${curLord} y por su posición en tu carta natal.`
    ].join('\n')
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
      `### ${isEn ? 'Dharmic Direction' : 'Dharma'}`,
      '',
      isEn
        ? `With ${SIGNS_EN[asc.signIndex]} rising and the Sun in ${SIGNS_EN[chart.planets.Su.signIndex]}, your purpose centers on cultivating clear mastery over your gifts and aligning your actions with higher service. Your lunar nakshatra, ${chart.planets.Mo.nakshatra}, grounds this with emotional depth.`
        : `Con ${asc.sign} ascendente y el Sol en ${chart.planets.Su.sign}, tu camino pasa por desarrollar tus talentos únicos y compartirlos con el mundo. Tu nakshatra lunar, ${chart.planets.Mo.nakshatra}, aporta cualidad y profundidad emocional.`,
      '',
      `### ${isEn ? 'Karmic Lessons' : 'Desafíos kármicos'}`,
      '',
      isEn
        ? `Saturn in ${SIGNS_EN[chart.planets.Sa.signIndex]} (House ${chart.planets.Sa.house}) indicates that your deepest maturation arises through patience, structured responsibility, and steady perseverance. Rahu in ${SIGNS_EN[chart.planets.Ra.signIndex]} marks your evolutionary growth edge, while Ketu in ${SIGNS_EN[chart.planets.Ke.signIndex]} highlights innate strengths mastered across past cycles.`
        : `Saturno en ${chart.planets.Sa.sign} (Casa ${chart.planets.Sa.house}) señala que tus lecciones principales pasan por la disciplina y la maduración constante. Rahu en ${chart.planets.Ra.sign} marca el área de crecimiento evolutivo, mientras Ketu en ${chart.planets.Ke.sign} indica talentos innatos ya cultivados.`,
      '',
      '---',
      '',
      isEn
        ? 'This report is an instrument of self-knowledge, not a rigid verdict. Jyotish maps the landscape; you navigate the journey.'
        : 'Este informe es una herramienta de autoconocimiento, no una sentencia fija. El jyotish muestra el mapa; tú recorres el camino.'
    ].join('\n')
  };
}

module.exports = { generateReport };
