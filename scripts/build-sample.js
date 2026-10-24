/**
 * Genera public/sample-chart.js con la carta de muestra (Paul Erdős),
 * calculada con el motor real del proyecto (src/calculator.js).
 *
 * Uso: node scripts/build-sample.js
 *
 * Nota: la hora de nacimiento de Erdős no está documentada; se usa la
 * convención de mediodía local. Budapest 1913: UTC+1 (sin horario de verano).
 * La Luna pasó de Libra a Escorpio esa madrugada — ver letra chica en la landing.
 */
const fs = require('fs');
const path = require('path');
const { calculateChart } = require('../src/calculator');

const chart = calculateChart({
  name: 'Paul Erdős',
  year: 1913, month: 3, day: 26,
  hour: 12, minute: 0,
  timezone: 1,
  place: 'Budapest, Hungría',
  lat: 47.4979, lon: 19.0402
});

// Solo los campos que la landing necesita (nada de datos innecesarios)
const planets = {};
for (const [key, p] of Object.entries(chart.planets)) {
  planets[key] = {
    name: p.name,
    sign: p.sign,
    signIndex: p.signIndex,
    degreeFormatted: p.degreeFormatted,
    house: p.house,
    nakshatra: p.nakshatra,
    pada: p.pada,
    navamsha: p.navamsha,
    navamshaIndex: p.navamshaIndex
  };
}

const sample = {
  subject: {
    name: 'Paul Erdős',
    dates: '26 de marzo de 1913 – 20 de septiembre de 1996',
    birthLine: '26 de marzo de 1913 · 12:00 · Budapest, Hungría',
    ayanamsa: chart.subject.ayanamsa
  },
  ascendant: {
    sign: chart.ascendant.sign,
    signIndex: chart.ascendant.signIndex,
    degreeFormatted: chart.ascendant.degreeFormatted,
    nakshatra: chart.ascendant.nakshatra,
    pada: chart.ascendant.pada,
    navamsha: chart.planets.Asc.navamsha,
    navamshaIndex: chart.planets.Asc.navamshaIndex
  },
  planets,
  elements: chart.elements,
  dashas: chart.dashas.map(d => ({
    lord: d.lord,
    start: d.start.getFullYear(),
    end: d.end.getFullYear()
  })),
  // Copy curado: deriva de las posiciones calculadas arriba. Si cambian los
  // datos de nacimiento usados, este texto hay que reescribirlo a mano.
  // Con Cáncer ascendente: Sol, Mercurio y Rahu en la casa 9; Júpiter (regente de la 9) en la 6.
  excerpt: [
    'Sol, Mercurio y Rahu en Piscis, reunidos en la casa 9: la del conocimiento superior y la búsqueda de sentido. Es la casa más poblada de su carta, y Erdős le dedicó la vida entera. Fue el matemático más prolífico y colaborativo de la historia — unos 1.500 artículos con más de 500 coautores — y la matemática todavía mide esa cualidad con el “número de Erdős”.',
    'No hay un solo planeta en signos de tierra en su carta. Vivió exactamente así: sin casa, sin empleo fijo ni pertenencias, viajando de universidad en universidad con media maleta, instalándose donde hubiera un problema abierto y alguien dispuesto a trabajarlo con él.',
    'Júpiter, regente de esa casa 9, está en su propio signo, Sagitario, y ocupa la casa del trabajo diario: el propósito se cumple trabajando. Erdős encadenaba jornadas de hasta diecinueve horas. Y la Luna en Anuradha, la nakshatra de la amistad y la cooperación, rige su sistema de periodos: una mente emocional hecha para el trabajo en común.'
  ],
  fineprint: 'La hora de nacimiento de Erdős no está documentada; la carta se calculó al mediodía local (UTC+1), la convención habitual en esos casos. El ascendente y las casas son, por tanto, aproximados. Además la Luna entró en Escorpio esa misma madrugada, así que su signo lunar tiene un margen de duda: lo seguro son el Sol en Piscis, Júpiter en Sagitario y la ausencia de tierra.'
};

const out = '// Generado por scripts/build-sample.js — no editar a mano\n' +
  'window.SAMPLE_CHART = ' + JSON.stringify(sample, null, 2) + ';\n';

const dest = path.join(__dirname, '../public/sample-chart.js');
fs.writeFileSync(dest, out);
console.log('OK →', dest);
console.log('Asc:', sample.ascendant.sign, sample.ascendant.degreeFormatted);
console.log('Tierra:', sample.elements.earth, '| Fuego:', sample.elements.fire, '| Aire:', sample.elements.air, '| Agua:', sample.elements.water);
