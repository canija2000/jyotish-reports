/**
 * Genera el mismo informe con los dos renderizadores para compararlos lado a lado:
 *   - src/pdf.js      → estética "manuscrito" (marfil y oro)
 *   - src/pdf-web.js  → estética de la landing (blanco frío, azul noche, cian)
 *
 * Uso: node scripts/compare-pdf.js [es|en]
 * Salida: reports/comparacion-{actual,web}-{lang}.pdf (ignorados por git)
 *
 * Usa la carta de muestra de la landing (Paul Erdős, mediodía local en Budapest).
 */
const path = require('path');
const { calculateChart } = require('../src/calculator');
const { generateReport } = require('../src/report');
const pdfActual = require('../src/pdf');
const pdfWeb = require('../src/pdf-web');

const langs = process.argv[2] ? [process.argv[2]] : ['es', 'en'];

const chart = calculateChart({
  name: 'Paul Erdős',
  year: 1913, month: 3, day: 26,
  hour: 12, minute: 0,
  timezone: 1,
  place: 'Budapest, Hungría',
  lat: 47.4979, lon: 19.0402
});

(async () => {
  const outDir = path.join(__dirname, '../reports');
  for (const lang of langs) {
    const report = generateReport(chart, lang);
    await pdfActual.generatePDF(report, chart, path.join(outDir, `comparacion-actual-${lang}.pdf`), lang);
    await pdfWeb.generatePDF(report, chart, path.join(outDir, `comparacion-web-${lang}.pdf`), lang);
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
