/**
 * Generador de Reporte Jyotish
 * Devuelve { cover, sections } para que el renderizador (pdf.js) lo componga.
 * Copy sobrio, sin emojis: el informe es un documento, no un infomercial.
 */

// ========== INTERPRETACIONES ==========

const SIGN_INTERPS = {
  0: { // Aries
    keywords: 'acción, iniciativa, liderazgo, coraje',
    element: 'Fuego',
    modality: 'Cardinal',
    ruler: 'Marte',
    desc: 'Tu naturaleza interior irradia energía pionera. Posees un espíritu guerrero que te impulsa a abrir caminos nuevos, enfrentar desafíos con valentía y asumir el liderazgo cuando otros dudan. Tu vitalidad es tu mayor fortaleza.'
  },
  1: { // Tauro
    keywords: 'estabilidad, placer, paciencia, abundancia',
    element: 'Tierra',
    modality: 'Fijo',
    ruler: 'Venus',
    desc: 'Tu naturaleza interior busca la solidez y el disfrute sensorial. Valoras la estabilidad material, la belleza y los placeres terrenales. Tu paciencia y determinación te permiten construir bases duraderas.'
  },
  2: { // Géminis
    keywords: 'comunicación, curiosidad, versatilidad, intelecto',
    element: 'Aire',
    modality: 'Mutable',
    ruler: 'Mercurio',
    desc: 'Tu naturaleza interior es ágil e inquisitiva. Posees una mente versátil que absorbe información rápidamente, disfruta el intercambio de ideas y encuentra conexiones donde otros ven caos.'
  },
  3: { // Cáncer
    keywords: 'emoción, protección, nutrición, hogar',
    element: 'Agua',
    modality: 'Cardinal',
    ruler: 'Luna',
    desc: 'Tu naturaleza interior es profundamente emocional y protectora. Tu sensibilidad te permite percibir las necesidades de otros y crear espacios de contención. El hogar y la familia son pilares fundamentales.'
  },
  4: { // Leo
    keywords: 'expresión, creatividad, autoridad, generosidad',
    element: 'Fuego',
    modality: 'Fijo',
    ruler: 'Sol',
    desc: 'Tu naturaleza interior brilla con presencia regia. Posees un magnetismo natural, creatividad expresiva y un deseo genuino de inspirar a otros. Tu generosidad de espíritu es contagiosa.'
  },
  5: { // Virgo
    keywords: 'análisis, servicio, precisión, pureza',
    element: 'Tierra',
    modality: 'Mutable',
    ruler: 'Mercurio',
    desc: 'Tu naturaleza interior busca la perfección a través del servicio. Tu mente analítica detecta detalles que otros pasan por alto, y tu dedicación al mejoramiento constante te hace invaluable.'
  },
  6: { // Libra
    keywords: 'equilibrio, diplomacia, belleza, justicia',
    element: 'Aire',
    modality: 'Cardinal',
    ruler: 'Venus',
    desc: 'Tu naturaleza interior busca la armonía y la equidad. Posees un don natural para mediar conflictos, apreciar la belleza y crear relaciones equilibradas. Tu sentido de justicia es tu brújula moral.'
  },
  7: { // Escorpio
    keywords: 'transformación, intensidad, misterio, poder',
    element: 'Agua',
    modality: 'Fijo',
    ruler: 'Marte',
    desc: 'Tu naturaleza interior es profunda e intensa. Posees la capacidad de penetrar las apariencias, enfrentar verdades incómodas y transformar tanto tu vida como la de quienes te rodean.'
  },
  8: { // Sagitario
    keywords: 'expansión, filosofía, aventura, verdad',
    element: 'Fuego',
    modality: 'Mutable',
    ruler: 'Júpiter',
    desc: 'Tu naturaleza interior anhela la expansión y el conocimiento superior. Eres un buscador nato de verdad y significado, con un espíritu aventurero que te impulsa a explorar horizontes físicos e intelectuales.'
  },
  9: { // Capricornio
    keywords: 'disciplina, ambición, estructura, responsabilidad',
    element: 'Tierra',
    modality: 'Cardinal',
    ruler: 'Saturno',
    desc: 'Tu naturaleza interior es seria y orientada al logro. Posees una disciplina excepcional, ambición bien dirigida y la capacidad de construir estructuras duraderas con paciencia y determinación.'
  },
  10: { // Acuario
    keywords: 'innovación, independencia, visión, humanidad',
    element: 'Aire',
    modality: 'Fijo',
    ruler: 'Saturno',
    desc: 'Tu naturaleza interior es visionaria e independiente. Posees la capacidad de ver más allá de las convenciones, innovar con propósito y trabajar por ideales que beneficien a la colectividad.'
  },
  11: { // Piscis
    keywords: 'compasión, intuición, trascendencia, arte',
    element: 'Agua',
    modality: 'Mutable',
    ruler: 'Júpiter',
    desc: 'Tu naturaleza interior es profundamente empática e intuitiva. Posees una conexión especial con lo trascendente, una imaginación fértil y la capacidad de compasión universal que te conecta con el sufrimiento ajeno.'
  }
};

const PLANET_IN_SIGN = {
  Su: {
    0: 'Tu alma irradia coraje y liderazgo natural',
    6: 'Tu alma busca equilibrio y armonía en la acción',
    8: 'Tu alma expande horizontes con optimismo filosófico'
  },
  Mo: {
    8: 'Tu mente emocional es expansiva y aventurera',
    3: 'Tu mente emocional es sensible y protectora',
    11: 'Tu mente emocional es intuitiva y compasiva'
  },
  Ma: {
    0: 'Tu energía es directa, pionera y competitiva',
    8: 'Tu energía se expresa con entusiasmo y aventura',
    9: 'Tu energía es disciplinada y estratégicamente ambiciosa'
  },
  Me: {
    2: 'Tu intelecto es versátil y comunicativo',
    7: 'Tu intelecto es profundo, investigativo y penetrante',
    5: 'Tu intelecto es analítico, preciso y orientado al servicio'
  },
  Ju: {
    9: 'Tu sabiduría se expresa con disciplina y estructura',
    0: 'Tu sabiduría es valiente y de acción directa',
    11: 'Tu sabiduría es visionaria y humanitaria'
  },
  Ve: {
    6: 'Tu amor es equilibrado, diplomático y estético',
    1: 'Tu amor es sensual, estable y disfrutador',
    11: 'Tu amor es compasivo, artístico y trascendente'
  },
  Sa: {
    9: 'Tu karma se manifiesta a través de disciplina y responsabilidad',
    10: 'Tu karma se manifiesta a través de innovación e independencia',
    11: 'Tu karma se manifiesta a través de compasión y disolución de límites'
  }
};

const NAKSHATRA_INTERPS = {
  0: 'Ashwini te otorga velocidad, iniciativa y capacidad curativa',
  1: 'Bharani te da capacidad de transformación y manejo de ciclos de vida-muerte',
  2: 'Krittika te confiere fuego purificador y determinación inquebrantable',
  3: 'Rohini te bendice con creatividad, belleza y magnetismo natural',
  4: 'Mrigashira te hace buscador inquieto de verdad y conocimiento',
  5: 'Ardra te da capacidad de destrucción creativa y renovación',
  6: 'Punarvasu te permite renacer y encontrar luz tras la oscuridad',
  7: 'Pushya te nutre con abundancia y capacidad de cuidar a otros',
  8: 'Ashlesha te otorga astucia, intensidad y poder psicológico',
  9: 'Magha te conecta con linaje ancestral y autoridad natural',
  10: 'P. Phalguni te da creatividad, placer y capacidad de disfrutar la vida',
  11: 'U. Phalguni te confiere capacidad de servicio y ayuda desinteresada',
  12: 'Hasta te da habilidad manual, destreza y capacidad de manifestación',
  13: 'Chitra te bendice con visión artística y capacidad de crear belleza',
  14: 'Swati te otorga independencia, adaptabilidad y equilibrio',
  15: 'Vishakha te da determinación enfocada y capacidad de logro',
  16: 'Anuradha te confiere devoción, amistad y capacidad de cooperación',
  17: 'Jyeshtha te otorga protección, senioridad y capacidad de liderazgo',
  18: 'Mula te da capacidad de investigación profunda y búsqueda de raíces',
  19: 'P. Ashadha te confiere invencibilidad y capacidad de superar obstáculos',
  20: 'U. Ashadha te da victoria final y capacidad de logro duradero',
  21: 'Shravana te otorga capacidad de escucha, aprendizaje y conexión',
  22: 'Dhanishta te da ritmo, riqueza y capacidad de trabajo en equipo',
  23: 'Shatabhisha te confiere capacidad curativa y visión cósmica',
  24: 'P. Bhadrapada te da intensidad espiritual y capacidad de transformación',
  25: 'U. Bhadrapada te otorga profundidad emocional y sabiduría intuitiva',
  26: 'Revati te bendice con compasión, nutrición y conexión con lo divino'
};

const DASHA_INTERPS = {
  'Sun': 'Periodo de autoexpresión, liderazgo y reconocimiento de la identidad esencial',
  'Moon': 'Periodo de desarrollo emocional, conexión familiar y nutrición interior',
  'Mars': 'Periodo de acción, coraje y manifestación de deseos materiales',
  'Mercury': 'Periodo de aprendizaje, comunicación e intercambio intelectual',
  'Jupiter': 'Periodo de expansión, sabiduría y crecimiento espiritual',
  'Venus': 'Periodo de amor, placer, belleza y relaciones armoniosas',
  'Saturn': 'Periodo de disciplina, estructura y maduración kármica',
  'Rahu': 'Periodo de ambición, obsesión y búsqueda de experiencias nuevas',
  'Ketu': 'Periodo de desapego, liberación y profundización espiritual'
};

// ========== GENERADOR ==========

function generateReport(chart) {
  return {
    cover: buildCover(chart),
    sections: [
      buildTechnicalData(chart),
      buildAscendantSection(chart),
      buildPlanetsSection(chart),
      buildNakshatraSection(chart),
      buildHousesSection(chart),
      buildDashaSection(chart),
      buildSynthesis(chart)
    ]
  };
}

function buildCover(chart) {
  return {
    name: chart.subject.name,
    subtitle: 'Informe astrológico védico',
    meta: [
      { label: 'Fecha de nacimiento', value: chart.subject.birthDate },
      { label: 'Hora', value: chart.subject.birthTime },
      { label: 'Lugar', value: chart.subject.place || '—' },
      { label: 'Coordenadas', value: chart.subject.coords }
    ],
    epigraph: 'El jyotish, la ciencia de la luz, ilumina el camino del alma a través del tiempo.',
    intro: [
      'Este informe presenta el mapa celeste que se configuró en el momento de tu nacimiento, según la tradición védica de la India. A diferencia de la astrología occidental, emplea el zodíaco sidéreo, que refleja las posiciones reales de las constelaciones, y por eso ofrece una lectura distinta del karma y el dharma (el propósito de vida).',
      'La carta natal, o Janma Kundali, es ante todo una herramienta de autoconocimiento: ayuda a reconocer fortalezas innatas, desafíos kármicos y los tiempos en que suelen producirse los eventos importantes de la vida.'
    ]
  };
}

function buildTechnicalData(chart) {
  const rows = Object.entries(chart.planets).map(([key, p]) => {
    if (key === 'Asc') return `- **Ascendente (Lagna)** · ${p.sign} ${p.degreeFormatted}`;
    return `- **${p.name}** · ${p.sign} ${p.degreeFormatted} · Casa ${p.house} · ${p.nakshatra} (pada ${p.pada})`;
  }).join('\n');

  const el = chart.elements;
  const elLine = `Fuego ${el.fire} · Tierra ${el.earth} · Aire ${el.air} · Agua ${el.water}`;

  return {
    title: 'Datos de la carta',
    body: [
      `**Sistema:** ${chart.subject.zodiac}`,
      `**Ayanamsa:** ${chart.subject.ayanamsa}`,
      `**Casas:** ${chart.subject.houseSystem}`,
      '',
      '### Posiciones planetarias',
      '',
      rows,
      '',
      '### Balance elemental',
      '',
      elLine,
      '',
      getElementsInterpretation(chart.elements)
    ].join('\n')
  };
}

function getElementsInterpretation(elements) {
  const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];
  const elementNames = { fire: 'Fuego', earth: 'Tierra', air: 'Aire', water: 'Agua' };
  const interps = {
    fire: 'Predomina el elemento Fuego en tu carta, lo que te confiere pasión, entusiasmo y una naturaleza orientada a la acción. Tu energía vital es intensa y contagiosa.',
    earth: 'Predomina el elemento Tierra en tu carta, lo que te da estabilidad, practicidad y una conexión sólida con el mundo material. Eres confiable y orientado a resultados.',
    air: 'Predomina el elemento Aire en tu carta, lo que te otorga inteligencia, comunicatividad y una mente ágil. Disfrutas el intercambio de ideas y el análisis.',
    water: 'Predomina el elemento Agua en tu carta, lo que te confiere sensibilidad emocional, intuición y profundidad psicológica. Eres empático y perceptivo.'
  };
  return `**Elemento dominante:** ${elementNames[dominant[0]]}. ${interps[dominant[0]]}`;
}

function buildAscendantSection(chart) {
  const asc = chart.ascendant;
  const s = SIGN_INTERPS[asc.signIndex];
  const rk = getRulerKey(s.ruler);
  const rulerPlanet = chart.planets[rk];

  return {
    title: `Ascendente: ${asc.sign}`,
    body: [
      '### La puerta de entrada',
      '',
      `Tu Ascendente, o *Lagna* en sánscrito, es uno de los puntos centrales de la carta védica. Representa la personalidad exterior, el cuerpo físico y la manera en que te presentas al mundo: la lente por la que experimentas la vida.`,
      '',
      `**Tu Ascendente está en ${asc.sign}** (${s.keywords}) a ${asc.degreeFormatted}, en la nakshatra ${asc.nakshatra} (pada ${asc.pada}).`,
      '',
      '### Naturaleza esencial',
      '',
      s.desc,
      '',
      `**Elemento:** ${s.element} · **Modalidad:** ${s.modality} · **Regente:** ${s.ruler}`,
      '',
      `Como ${asc.sign} ascendente, tu regente es ${s.ruler}, que en tu carta se halla en la Casa ${rulerPlanet?.house || '?'} y en el signo ${rulerPlanet?.sign || '?'}. Esa posición del regente señala el área de vida donde se concentra buena parte de tu energía.`
    ].join('\n')
  };
}

function getRulerKey(ruler) {
  const map = { 'Sol': 'Su', 'Luna': 'Mo', 'Marte': 'Ma', 'Mercurio': 'Me', 'Júpiter': 'Ju', 'Venus': 'Ve', 'Saturno': 'Sa' };
  return map[ruler] || 'Su';
}

function buildPlanetsSection(chart) {
  const blocks = Object.entries(chart.planets)
    .filter(([key]) => key !== 'Asc')
    .map(([key, p]) => {
      const interp = PLANET_IN_SIGN[key]?.[p.signIndex];
      const s = SIGN_INTERPS[p.signIndex];
      return [
        `### ${p.name} en ${p.sign} (Casa ${p.house})`,
        '',
        `**Grado:** ${p.degreeFormatted} · **Nakshatra:** ${p.nakshatra} pada ${p.pada}`,
        interp ? '' + interp : null,
        `En el sistema védico, ${p.name} representa ${getPlanetSignification(key)}. Su posición en ${p.sign} (${s.keywords}) y en la Casa ${p.house} indica que esta energía se expresa sobre todo en ${getHouseMeaning(p.house)}.`
      ].filter(x => x !== null).join('\n');
    })
    .join('\n\n');

  return { title: 'Planetas en signos y casas', body: blocks };
}

function getPlanetSignification(key) {
  const sigs = {
    Su: 'tu alma, identidad esencial, vitalidad y propósito de vida',
    Mo: 'tu mente emocional, necesidades psicológicas y conexión con lo maternal',
    Ma: 'tu energía de acción, coraje, competitividad y capacidad de defender tus intereses',
    Me: 'tu intelecto, capacidad comunicativa, aprendizaje y comercio',
    Ju: 'tu sabiduría, expansión, guru interior y conexión con lo divino',
    Ve: 'tu capacidad de amar, apreciar la belleza, disfrutar placeres y crear armonía',
    Sa: 'tu karma, disciplina, responsabilidades y lecciones de vida',
    Ra: 'tu deseo mundano, ambición y búsqueda de experiencias nuevas (nodo norte)',
    Ke: 'tu desapego, liberación y sabiduría de vidas pasadas (nodo sur)'
  };
  return sigs[key] || 'una energía planetaria';
}

function getHouseMeaning(house) {
  const meanings = {
    1: 'tu personalidad, cuerpo físico y cómo te presentas al mundo',
    2: 'tus recursos, valores, familia de origen y capacidad de generar riqueza',
    3: 'tu comunicación, hermanos, viajes cortos y coraje',
    4: 'tu hogar, madre, educación temprana y bienestar emocional',
    5: 'tu creatividad, hijos, romance y méritos de vidas pasadas',
    6: 'tu trabajo diario, salud, enemigos y servicio a otros',
    7: 'tu matrimonio, pareja, sociedad y relaciones uno a uno',
    8: 'tu transformación, sexualidad, muerte-renacimiento y recursos compartidos',
    9: 'tu guru, filosofía, viajes largos, padre y dharma (propósito)',
    10: 'tu carrera, reputación pública, logros y contribución a la sociedad',
    11: 'tus ganancias, amigos, redes sociales y cumplimiento de deseos',
    12: 'tu espiritualidad, aislamiento, gastos y liberación final (moksha)'
  };
  return meanings[house] || 'un área de vida específica';
}

function buildNakshatraSection(chart) {
  const rows = Object.entries(chart.planets)
    .filter(([key]) => key !== 'Asc')
    .map(([key, p]) => `- **${p.name} en ${p.nakshatra}** (pada ${p.pada}) · ${NAKSHATRA_INTERPS[p.nakshatraIndex]}`)
    .join('\n');

  return {
    title: 'Nakshatras',
    body: [
      'Las 27 nakshatras son divisiones más finas del zodíaco que revelan matices psicológicos y kármicos que los signos no alcanzan a captar. La nakshatra de la Luna es especialmente significativa: determina el *Janma Nakshatra*, que rige la naturaleza mental-emocional básica y el inicio de los periodos planetarios (dashas).',
      '',
      '### Nakshatras de tus planetas',
      '',
      rows,
      '',
      '### Nakshatra lunar',
      '',
      `Tu Luna está en **${chart.planets.Mo.nakshatra}**, lo cual es fundamental: en el jyotish la Luna representa la mente (*Manas*) y fija el patrón emocional básico. Esta nakshatra matiza toda tu experiencia y es la base de tu sistema de dashas.`
    ].join('\n')
  };
}

function buildHousesSection(chart) {
  const houseCounts = {};
  Object.entries(chart.planets).forEach(([key, p]) => {
    if (key === 'Asc') return;
    houseCounts[p.house] = (houseCounts[p.house] || 0) + 1;
  });
  const dom = Object.entries(houseCounts).sort((a, b) => b[1] - a[1])[0];

  const rows = Object.entries(houseCounts)
    .sort((a, b) => a[0] - b[0])
    .map(([h, count]) => `- **Casa ${h}** · ${getHouseMeaning(parseInt(h, 10))} · ${count} planeta${count > 1 ? 's' : ''}`)
    .join('\n');

  return {
    title: 'Casas',
    body: [
      `En el sistema de signo completo (*Whole Sign*), cada casa coincide con un signo zodiacal entero. Tu Casa 1 es ${chart.ascendant.sign}, y desde ahí se cuentan las demás.`,
      '',
      '### Distribución planetaria',
      '',
      rows,
      '',
      '### Casa dominante',
      '',
      `Tu **Casa ${dom[0]}** agrupa ${dom[1]} planetas, lo que indica que buena parte de tu energía y atención se vuelca en ${getHouseMeaning(parseInt(dom[0], 10))}: un área donde se concentran eventos, desafíos y oportunidades de crecimiento a lo largo de la vida.`
    ].join('\n')
  };
}

function buildDashaSection(chart) {
  const now = new Date();
  const cur = chart.currentDasha;
  const list = chart.dashas.map(d => {
    const active = d.start <= now && d.end > now;
    return `- **${d.lord}** (${d.years.toFixed(1)} años) · ${d.start.getFullYear()}–${d.end.getFullYear()}${active ? ' (actual)' : ''}`;
  }).join('\n');

  return {
    title: 'Periodos · Vimshottari Dasha',
    body: [
      'El sistema Vimshottari Dasha es una de las herramientas predictivas más usadas del jyotish. A partir de la posición de la Luna al nacer, divide la vida en periodos regidos por distintos planetas, cada uno con su cualidad y sus lecciones.',
      '',
      '### Secuencia de dashas',
      '',
      list,
      '',
      `### Periodo actual: ${cur.lord}`,
      '',
      `**Duración:** ${cur.years.toFixed(1)} años · **Fechas:** ${cur.start.getFullYear()}–${cur.end.getFullYear()}`,
      '',
      DASHA_INTERPS[cur.lord],
      '',
      `Este es el "clima" astrológico que atraviesas hoy. Los eventos, oportunidades y desafíos del periodo estarán teñidos por la energía de ${cur.lord} y por su posición en tu carta natal.`
    ].join('\n')
  };
}

function buildSynthesis(chart) {
  const ascSign = SIGN_INTERPS[chart.ascendant.signIndex];
  const sunSign = SIGN_INTERPS[chart.planets.Su.signIndex];
  const moonSign = SIGN_INTERPS[chart.planets.Mo.signIndex];

  return {
    title: 'Síntesis',
    body: [
      'Algunos hilos que articulan tu carta:',
      '',
      '### Tríada esencial',
      '',
      `- **Ascendente ${chart.ascendant.sign}** · la personalidad exterior y el camino de vida · ${ascSign.keywords}`,
      `- **Sol en ${chart.planets.Su.sign}** · el alma y el propósito esencial · ${sunSign.keywords}`,
      `- **Luna en ${chart.planets.Mo.sign}** · la mente emocional y las necesidades internas · ${moonSign.keywords}`,
      '',
      '### Dharma',
      '',
      `Con ${chart.ascendant.sign} ascendente y el Sol en ${chart.planets.Su.sign}, tu camino en esta vida pasa por ${getDharmaSynthesis(chart)}. Tu nakshatra lunar, ${chart.planets.Mo.nakshatra}, aporta la cualidad de ${NAKSHATRA_INTERPS[chart.planets.Mo.nakshatraIndex].toLowerCase()}.`,
      '',
      '### Desafíos kármicos',
      '',
      `Saturno en ${chart.planets.Sa.sign} (Casa ${chart.planets.Sa.house}) señala que tus lecciones principales pasan por ${getKarmicLesson(chart)}. Rahu en ${chart.planets.Ra.sign} marca donde el alma quiere crecer y experimentar; Ketu en ${chart.planets.Ke.sign} indica talentos innatos, ya dominados, de vidas pasadas.`,
      '',
      '### Tiempo actual',
      '',
      `Estás en el periodo de **${chart.currentDasha.lord}**: ${DASHA_INTERPS[chart.currentDasha.lord].toLowerCase()}.`,
      '',
      '---',
      '',
      'Este informe es una herramienta de autoconocimiento, no una sentencia fija. El jyotish muestra el mapa; tú recorres el camino.'
    ].join('\n')
  };
}

function getDharmaSynthesis(chart) {
  const combinations = {
    'fire-air': 'liderar a través de la comunicación y las ideas',
    'fire-earth': 'manifestar visiones en estructuras tangibles',
    'fire-water': 'inspirar con pasión mientras mantienes sensibilidad',
    'earth-air': 'construir sistemas que sirvan a la comunicación y el intercambio',
    'earth-water': 'crear estabilidad emocional y nutrir a otros',
    'air-water': 'integrar intelecto y emoción para servir a la humanidad'
  };
  const ascElement = SIGN_INTERPS[chart.ascendant.signIndex].element.toLowerCase();
  const sunElement = SIGN_INTERPS[chart.planets.Su.signIndex].element.toLowerCase();
  const key = [ascElement, sunElement].sort().join('-');
  return combinations[key] || 'desarrollar tus talentos únicos y compartirlos con el mundo';
}

function getKarmicLesson(chart) {
  const lessons = {
    0: 'aprender a canalizar tu impulsividad en acción disciplinada',
    1: 'construir seguridad material sin apegarte excesivamente a ella',
    2: 'usar tu intelecto con responsabilidad y profundidad',
    3: 'desarrollar madurez emocional y crear un hogar estable',
    4: 'expresar tu creatividad con disciplina y propósito',
    5: 'servir con humildad mientras perfeccionas tus habilidades',
    6: 'equilibrar tus relaciones con justicia y responsabilidad',
    7: 'transformarte profundamente sin miedo a la intensidad',
    8: 'expandir tu filosofía de vida con estructura y compromiso',
    9: 'lograr tus ambiciones sin sacrificar tu integridad',
    10: 'innovar con responsabilidad y pensar en el colectivo',
    11: 'disolver el egoísmo y servir con compasión universal'
  };
  return lessons[chart.planets.Sa.signIndex] || 'aprender lecciones de disciplina y madurez';
}

module.exports = { generateReport };
