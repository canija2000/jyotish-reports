/**
 * Renderizador de PDF para Reportes Jyotish (Bilingüe ES / EN)
 * Composición editorial sobria: papel marfil, serif EB Garamond, tinta índigo + acento óxido y cyan,
 * tablas tipográficas limpias, diagrama SVG de la carta, Navamsha (D-9) y filetes finos.
 */
const puppeteer = require('puppeteer');

const SIGN_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const PLANET_GLYPHS = { Su:'☉', Mo:'☽', Ma:'♂', Me:'☿', Ju:'♃', Ve:'♀', Sa:'♄', Ra:'☊', Ke:'☋', Asc:'Lg' };
const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const PLANET_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'];

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  let res = escapeHtml(s);
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  res = res.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return res;
}

function mdToHtml(md) {
  const lines = String(md).replace(/\r/g, '').split('\n');
  let html = '';
  let para = [];
  let list = [];

  const flushPara = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br>') + '</p>'; para = []; } };
  const flushList = () => { if (list.length) { html += '<ul class="editorial-list">' + list.map(t => '<li>' + inline(t) + '</li>').join('') + '</ul>'; list = []; } };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { flushPara(); flushList(); continue; }
    let m;
    if ((m = line.match(/^### (.*)$/))) { flushPara(); flushList(); html += '<h3>' + inline(m[1]) + '</h3>'; continue; }
    if ((m = line.match(/^## (.*)$/)))  { flushPara(); flushList(); html += '<h2>' + inline(m[1]) + '</h2>'; continue; }
    if ((m = line.match(/^# (.*)$/)))   { flushPara(); flushList(); html += '<h1>' + inline(m[1]) + '</h1>'; continue; }
    if (line === '---') { flushPara(); flushList(); html += '<hr>'; continue; }
    if ((m = line.match(/^- (.*)$/))) { flushPara(); list.push(m[1]); continue; }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return html;
}

// ---------- DIAGRAMA SVG DE LA CARTA (SUR DE LA INDIA) ----------

function renderChartSVG(chart) {
  const S = 70;
  const W = S * 4;
  const H = S * 4;
  const CELL = {
    '11':[0,0], '0':[0,1], '1':[0,2], '2':[0,3],
    '10':[1,0],               '3':[1,3],
    '9':[2,0],                '4':[2,3],
    '8':[3,0],  '7':[3,1], '6':[3,2], '5':[3,3]
  };

  const ascIdx = chart.ascendant.signIndex;
  const bySign = {};
  PLANET_ORDER.forEach(k => {
    const s = chart.planets[k].signIndex;
    (bySign[s] = bySign[s] || []).push(k);
  });

  let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">`;

  Object.keys(CELL).forEach(sign => {
    const [r, c] = CELL[sign];
    const x = c * S, y = r * S;
    svg += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${S - 1}" height="${S - 1}" fill="#fafbfc" stroke="#d8e2ed"/>`;
    svg += `<text x="${x + 6}" y="${y + 15}" font-size="11" font-weight="600" fill="#148096" font-family="'EB Garamond', serif">${SIGN_GLYPHS[sign]}</text>`;

    // Lagna: doble trazo diagonal
    if (+sign === ascIdx) {
      svg += `<line x1="${x + S - 12}" y1="${y + 2}" x2="${x + S - 2}" y2="${y + 12}" stroke="#96382a" stroke-width="1.2"/>`;
      svg += `<line x1="${x + S - 17}" y1="${y + 2}" x2="${x + S - 2}" y2="${y + 17}" stroke="#96382a" stroke-width="1.2"/>`;
    }

    const plist = bySign[sign] || [];
    if (plist.length) {
      const label = plist.join(' ');
      svg += `<text x="${x + S / 2}" y="${y + S / 2 + 4}" text-anchor="middle" font-size="10.5" font-weight="500" letter-spacing="1" fill="#0d1b2a" font-family="'EB Garamond', serif">${label}</text>`;
      if (+sign === ascIdx) {
        svg += `<text x="${x + S / 2}" y="${y + S / 2 + 18}" text-anchor="middle" font-size="8.5" font-weight="600" fill="#96382a" font-family="'EB Garamond', serif">ASC</text>`;
      }
    } else if (+sign === ascIdx) {
      svg += `<text x="${x + S / 2}" y="${y + S / 2 + 4}" text-anchor="middle" font-size="9" font-weight="600" fill="#96382a" font-family="'EB Garamond', serif">ASC</text>`;
    }
  });

  // Centro
  const cx = W / 2, cy = H / 2;
  svg += `<text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="12" font-weight="600" fill="#0d1b2a" font-family="'EB Garamond', serif">${escapeHtml(chart.subject.name)}</text>`;
  svg += `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="8.5" fill="#415a77" font-family="'EB Garamond', serif">Janma Kundali (D-1)</text>`;
  svg += `</svg>`;

  return svg;
}

// ---------- TABLA DE POSICIONES PLANETARIAS ----------

function renderPlanetsTable(chart, isEn) {
  const pList = ['Asc', ...PLANET_ORDER];
  let rows = '';

  pList.forEach(k => {
    const p = chart.planets[k];
    const isAsc = (k === 'Asc');
    const glyph = isAsc ? 'Asc' : (PLANET_GLYPHS[k] || '');
    const name = isAsc ? (isEn ? 'Ascendant' : 'Ascendente') : p.name;
    const sign = isEn ? SIGNS_EN[p.signIndex] : p.sign;
    const signGlyph = SIGN_GLYPHS[p.signIndex] || '';
    const house = isAsc ? '1' : String(p.house);
    const nak = `${p.nakshatra} (${p.pada})`;
    const nav = isEn ? (SIGNS_EN[p.navamshaIndex] || p.navamsha) : p.navamsha;

    rows += `<tr>
      <td class="col-glyph">${glyph}</td>
      <td class="col-name"><strong>${escapeHtml(name)}</strong></td>
      <td class="col-sign"><span class="sign-glyph">${signGlyph}</span> ${escapeHtml(sign)}</td>
      <td class="col-deg">${escapeHtml(p.degreeFormatted)}</td>
      <td class="col-house">${house}</td>
      <td class="col-nak">${escapeHtml(nak)}</td>
      <td class="col-nav"><strong>${escapeHtml(nav)}</strong></td>
    </tr>`;
  });

  return `
  <table class="astro-table">
    <thead>
      <tr>
        <th style="width: 28pt;"></th>
        <th>${isEn ? 'Planet' : 'Planeta'}</th>
        <th>${isEn ? 'Sidereal Sign' : 'Signo sidéreo'}</th>
        <th>${isEn ? 'Degree' : 'Grado'}</th>
        <th>${isEn ? 'House' : 'Casa'}</th>
        <th>${isEn ? 'Nakshatra (Pada)' : 'Nakshatra (Pada)'}</th>
        <th>${isEn ? 'Navamsha (D-9)' : 'Navamsha (D-9)'}</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

// ---------- TABLA DE DASHAS ----------

function renderDashaTable(chart, isEn) {
  const now = new Date();
  let rows = '';

  chart.dashas.forEach(d => {
    const active = d.start <= now && d.end > now;
    const rowClass = active ? ' class="current-dasha-row"' : '';
    const statusText = active ? (isEn ? 'Active now' : 'Activo') : (d.end < now ? (isEn ? 'Completed' : 'Concluido') : (isEn ? 'Upcoming' : 'Próximo'));
    const yrsWord = isEn ? 'years' : 'años';

    rows += `<tr${rowClass}>
      <td><strong>${escapeHtml(d.lord)}</strong></td>
      <td>${d.years.toFixed(1)} ${yrsWord}</td>
      <td>${d.start.getFullYear()} – ${d.end.getFullYear()}</td>
      <td class="col-status">${statusText}</td>
    </tr>`;
  });

  return `
  <table class="astro-table dasha-table">
    <thead>
      <tr>
        <th>${isEn ? 'Planetary Lord' : 'Planeta regente'}</th>
        <th>${isEn ? 'Duration' : 'Duración'}</th>
        <th>${isEn ? 'Timeline' : 'Periodo'}</th>
        <th>${isEn ? 'Status' : 'Estado'}</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

// ---------- COMPOSICIÓN DEL DOCUMENTO ----------

function generateHTML(report, chart, lang = 'es') {
  const isEn = (lang === 'en' || report.lang === 'en');
  const c = report.cover;

  const metaRows = c.meta.map(m =>
    `<div><dt>${escapeHtml(m.label)}</dt><dd>${escapeHtml(m.value)}</dd></div>`
  ).join('');

  const intro = c.intro.map(p => `<p class="lede">${inline(p)}</p>`).join('');
  const chartSVG = renderChartSVG(chart);
  const planetsTable = renderPlanetsTable(chart, isEn);
  const dashaTable = renderDashaTable(chart, isEn);

  // Mapear secciones e inyectar tablas en los lugares pertinentes
  const sectionsHtml = report.sections.map((s, idx) => {
    let extra = '';
    // En la primera sección técnica: inyectar diagrama y tabla de posiciones
    if (idx === 0) {
      extra = `<div class="chart-and-table">
        <div class="chart-block">${chartSVG}</div>
        <div class="table-block">${planetsTable}</div>
      </div>`;
    }
    // En la sección de Dashas: inyectar la tabla de Vimshottari
    if (idx === 5) {
      extra = `<div class="dasha-table-block">${dashaTable}</div>`;
    }

    return `<section>
      <h2>${escapeHtml(s.title)}</h2>
      ${extra}
      ${mdToHtml(s.body)}
    </section>`;
  }).join('');

  const locale = isEn ? 'en-US' : 'es-ES';
  const today = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'es'}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(c.name)} · ${escapeHtml(c.subtitle)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  :root {
    --paper: #ffffff;
    --ink: #0d1b2a;
    --body: #1f3044;
    --muted: #415a77;
    --faint: #6e849f;
    --line: #d8e2ed;
    --accent: #96382a;
    --cyan: #148096;
    --serif: 'EB Garamond', 'Iowan Old Style', Palatino, Georgia, serif;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: var(--paper); }
  body {
    font-family: var(--serif);
    font-size: 10.5pt;
    line-height: 1.55;
    color: var(--body);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* portada */
  .cover { margin-bottom: 8mm; page-break-inside: avoid; }
  .cover .kicker {
    font-size: 9pt; letter-spacing: .15em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 9pt; font-weight: 500;
  }
  .cover h1 {
    font-size: 26pt; font-weight: 500; color: var(--ink);
    line-height: 1.1; letter-spacing: -0.01em; margin-bottom: 14pt;
  }
  .cover .meta { margin: 8pt 0 14pt; }
  .cover .meta > div {
    display: flex; gap: 10pt; padding: 4.5pt 0;
    border-bottom: 1px solid var(--line); font-size: 9.5pt;
  }
  .cover .meta dt { flex: none; width: 92pt; color: var(--muted); }
  .cover .meta dd { margin: 0; color: var(--ink); font-weight: 500; }
  .cover .epigraph {
    font-style: italic; color: var(--muted); font-size: 10pt;
    border-left: 2px solid var(--accent); padding-left: 11pt; margin: 12pt 0 14pt;
  }
  .cover .lede { font-size: 10.5pt; color: var(--body); margin-bottom: 7pt; text-align: justify; }

  /* secciones */
  section { margin-top: 6mm; page-break-inside: auto; }
  h2 {
    font-size: 13.5pt; font-weight: 600; color: var(--ink);
    margin: 0 0 7pt; padding-bottom: 4pt; border-bottom: 1px solid var(--line);
    page-break-after: avoid; letter-spacing: -0.01em;
  }
  h3 {
    font-size: 11pt; font-weight: 600; color: var(--ink);
    margin: 11pt 0 4pt; page-break-after: avoid;
  }
  p { margin: 0 0 6pt; text-align: justify; font-size: 10.5pt; }
  strong { color: var(--ink); font-weight: 600; }
  em { font-style: italic; color: var(--body); }

  /* tablas astronómicas editoriales */
  table.astro-table {
    width: 100%; border-collapse: collapse; margin: 10pt 0 14pt;
    font-size: 9.5pt; line-height: 1.4; page-break-inside: avoid;
  }
  table.astro-table th {
    text-align: left; padding: 6pt 5pt; font-weight: 600;
    font-size: 8pt; text-transform: uppercase; letter-spacing: .08em;
    color: var(--muted); border-bottom: 1.2px solid var(--ink);
  }
  table.astro-table td {
    padding: 5.5pt 5pt; border-bottom: 1px solid var(--line);
    color: var(--body);
  }
  table.astro-table tbody tr:hover { background: #fafbfc; }
  table.astro-table .col-glyph {
    color: var(--accent); font-size: 11pt; text-align: center;
  }
  table.astro-table .sign-glyph {
    color: var(--cyan); font-weight: 600; margin-right: 3pt;
  }
  table.astro-table .col-nav {
    color: var(--cyan); font-weight: 500;
  }
  table.astro-table .col-house {
    color: var(--muted); text-align: center;
  }
  table.dasha-table .current-dasha-row {
    background-color: #f0f7f9;
  }
  table.dasha-table .current-dasha-row td {
    color: var(--ink); font-weight: 500;
  }
  table.dasha-table .col-status {
    color: var(--accent); font-weight: 500;
  }

  /* layout diagrama + tabla */
  .chart-and-table {
    margin: 12pt 0 16pt; page-break-inside: avoid;
  }
  .chart-block {
    margin: 0 auto 12pt; text-align: center;
  }
  .chart-svg {
    border: 1px solid var(--line); background: #ffffff;
    box-shadow: 0 1px 3px rgba(13,27,42,0.03);
  }

  /* listas editoriales */
  ul.editorial-list { list-style: none; margin: 4pt 0 8pt; padding: 0; }
  ul.editorial-list li {
    padding-left: 12pt; text-indent: -12pt; margin-bottom: 4pt;
    font-size: 10pt; line-height: 1.45; page-break-inside: avoid;
  }
  ul.editorial-list li::before { content: '—\\00a0\\00a0'; color: var(--accent); font-weight: 600; }

  hr { border: none; border-top: 1px solid var(--line); margin: 12pt 0; }

  .colophon {
    margin-top: 10mm; padding-top: 7pt; border-top: 1px solid var(--line);
    font-size: 8pt; color: var(--muted); line-height: 1.5; page-break-inside: avoid;
  }
  .colophon p { margin: 0; text-align: left; font-size: 8pt; }
</style>
</head>
<body>
  <header class="cover">
    <p class="kicker">${escapeHtml(c.subtitle)}</p>
    <h1>${escapeHtml(c.name)}</h1>
    <dl class="meta">${metaRows}</dl>
    <p class="epigraph">${inline(c.epigraph)}</p>
    ${intro}
  </header>
  ${sectionsHtml}
  <footer class="colophon">
    <p>${isEn ? 'Calculated with astronomy-engine · Lahiri ayanamsa · Whole Sign house system · Sidereal zodiac' : 'Calculado con astronomy-engine · ayanamsa Lahiri · casas por signo completo · zodíaco sidéreo'}</p>
    <p>${isEn ? `Report generated on ${today}. Self-knowledge material; does not replace professional advice.` : `Informe generado el ${today}. Material de autoconocimiento; no reemplaza consejo profesional.`}</p>
  </footer>
</body>
</html>`;
}

async function generatePDF(report, chart, outputPath, lang = 'es') {
  const html = generateHTML(report, chart, lang);
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '14mm', bottom: '14mm', left: '14mm' },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%;text-align:center;font-size:7.5pt;color:#6e849f;font-family:serif;">' +
        '<span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });
    console.log('PDF generado con éxito: ' + outputPath);
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF, generateHTML };
