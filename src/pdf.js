/**
 * Renderizador de PDF para Reportes Jyotish
 * Composición editorial sobria: papel, serif EB Garamond, tinta + acento óxido,
 * jerarquía por escala y filetes finos. Sin gradientes, púrpura ni emojis.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');

// ---------- markdown mínima a HTML (bloques + énfasis) ----------

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  s = escapeHtml(s);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return s;
}

function mdToHtml(md) {
  const lines = String(md).replace(/\r/g, '').split('\n');
  let html = '';
  let para = [];
  let list = [];

  const flushPara = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br>') + '</p>'; para = []; } };
  const flushList = () => { if (list.length) { html += '<ul>' + list.map(t => '<li>' + inline(t) + '</li>').join('') + '</ul>'; list = []; } };

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

// ---------- composición del documento ----------

function generateHTML(report, chart) {
  const c = report.cover;

  const metaRows = c.meta.map(m =>
    `<div><dt>${escapeHtml(m.label)}</dt><dd>${escapeHtml(m.value)}</dd></div>`
  ).join('');

  const intro = c.intro.map(p => `<p class="lede">${inline(p)}</p>`).join('');

  const sections = report.sections.map(s =>
    `<section><h2>${escapeHtml(s.title)}</h2>${mdToHtml(s.body)}</section>`
  ).join('');

  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(c.name)} · Informe astrológico védico</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  :root {
    --paper: #ffffff;
    --ink: #211d1a;
    --body: #3d3935;
    --muted: #6f6a62;
    --faint: #a49e93;
    --line: #e6e2d9;
    --accent: #8a3b2e;
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
  .cover { margin-bottom: 10mm; page-break-inside: avoid; }
  .cover .kicker {
    font-size: 9pt; letter-spacing: .15em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 10pt;
  }
  .cover h1 {
    font-size: 27pt; font-weight: 500; color: var(--ink);
    line-height: 1.1; letter-spacing: -0.01em; margin-bottom: 16pt;
  }
  .cover .meta { margin: 10pt 0 16pt; }
  .cover .meta > div {
    display: flex; gap: 10pt; padding: 5.5pt 0;
    border-bottom: 1px solid var(--line); font-size: 10pt;
  }
  .cover .meta dt { flex: none; width: 92pt; color: var(--muted); }
  .cover .meta dd { margin: 0; color: var(--ink); }
  .cover .epigraph {
    font-style: italic; color: var(--muted); font-size: 10.5pt;
    border-left: 2px solid var(--line); padding-left: 12pt; margin: 14pt 0 16pt;
  }
  .cover .lede { font-size: 11pt; color: var(--body); margin-bottom: 8pt; text-align: justify; }

  /* secciones */
  section { margin-top: 7mm; }
  h2 {
    font-size: 14pt; font-weight: 600; color: var(--ink);
    margin: 0 0 8pt; padding-bottom: 4pt; border-bottom: 1px solid var(--line);
    page-break-after: avoid;
  }
  h3 {
    font-size: 11.5pt; font-weight: 600; color: var(--ink);
    margin: 13pt 0 4pt; page-break-after: avoid;
  }
  p { margin: 0 0 7pt; text-align: justify; font-size: 10.5pt; }
  strong { color: var(--ink); font-weight: 600; }
  em { font-style: italic; color: var(--body); }

  ul { list-style: none; margin: 4pt 0 9pt; padding: 0; }
  li {
    padding-left: 13pt; text-indent: -13pt; margin-bottom: 4.5pt;
    font-size: 10.5pt; line-height: 1.5; page-break-inside: avoid;
  }
  li::before { content: '—\\00a0\\00a0'; color: var(--faint); }

  hr { border: none; border-top: 1px solid var(--line); margin: 13pt 0; }

  .colophon {
    margin-top: 12mm; padding-top: 8pt; border-top: 1px solid var(--line);
    font-size: 8.5pt; color: var(--muted); line-height: 1.6;
  }
  .colophon p { margin: 0; text-align: left; font-size: 8.5pt; }
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
  ${sections}
  <footer class="colophon">
    <p>Calculado con astronomy-engine · ayanamsa Lahiri · casas por signo completo · zodíaco sidéreo</p>
    <p>Informe generado el ${today}. Material de autoconocimiento; no reemplaza consejo profesional.</p>
  </footer>
</body>
</html>`;
}

async function generatePDF(report, chart, outputPath) {
  const html = generateHTML(report, chart);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '16mm', left: '16mm' },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%;text-align:center;font-size:8px;color:#a49e93;font-family:serif;">' +
        '<span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });
    console.log('PDF generado: ' + outputPath);
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF, generateHTML };
