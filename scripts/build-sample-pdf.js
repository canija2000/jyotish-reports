/**
 * Genera los PDF de muestra que se descargan desde la landing:
 *   public/muestra_erdos.pdf    (español)
 *   public/sample_erdos_en.pdf  (inglés)
 *
 * Uso: node scripts/build-sample-pdf.js
 *
 * Mismos datos de nacimiento que scripts/build-sample.js (mediodía local en Budapest,
 * hora no documentada) y el mismo renderizador que usa el servidor.
 */
const path = require('path');
const { calculateChart } = require('../src/calculator');
const { generateReport } = require('../src/report');
const { generatePDF } = require('../src/pdf-web');

const birth = {
  name: 'Paul Erdős',
  year: 1913, month: 3, day: 26,
  hour: 12, minute: 0,
  timezone: 1,
  lat: 47.4979, lon: 19.0402
};

const outputs = [
  { lang: 'es', place: 'Budapest, Hungría', file: 'muestra_erdos.pdf' },
  { lang: 'en', place: 'Budapest, Hungary', file: 'sample_erdos_en.pdf' }
];

(async () => {
  for (const o of outputs) {
    const chart = calculateChart({ ...birth, place: o.place });
    const report = generateReport(chart, o.lang);
    await generatePDF(report, chart, path.join(__dirname, '../public', o.file), o.lang);
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
