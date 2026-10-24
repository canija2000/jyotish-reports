/**
 * Renderizador de PDF para Reportes Jyotish (Bilingüe ES / EN)
 *
 * Variante "web": misma estructura que pdf.js, con la estética de la landing (public/index.html).
 *  - Papel blanco frío, tinta azul noche, óxido como acento y cian para el Navāṃśa, igual que la web.
 *  - El yantra en filigrana de la web (public/yantra-pattern.svg) como marca de agua de cada hoja,
 *    y un bhupura de trazo fino en azul mineral como marco.
 *  - Una sola familia serif (Source Serif 4), títulos en peso regular como en la web.
 *  - Portada propia, página de introducción con índice, aperturas de sección con loto,
 *    cartas Rāśi (D-1) y Navāmśa (D-9) en estilo sur de la India.
 * Sin emojis ni glifos Unicode astrológicos: todos los símbolos son SVG.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { SIGNS } = require('./calculator');

const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const PLANET_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'];
const PLANET_NAMES = {
  es: { Su: 'Sol', Mo: 'Luna', Ma: 'Marte', Me: 'Mercurio', Ju: 'Júpiter', Ve: 'Venus', Sa: 'Saturno', Ra: 'Rahu', Ke: 'Ketu', Asc: 'Ascendente' },
  en: { Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu', Asc: 'Ascendant' }
};
const DASHA_LORDS_ES = { Sun: 'Sol', Moon: 'Luna', Mars: 'Marte', Mercury: 'Mercurio', Jupiter: 'Júpiter', Venus: 'Venus', Saturn: 'Saturno', Rahu: 'Rahu', Ketu: 'Ketu' };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// Paleta
// Paleta (tokens de public/index.html; orn = azul mineral de yantra-pattern.svg)
const C = {
  paper: '#f8fafc',
  cell: '#ffffff',
  ink: '#0d1b2a',
  body: '#1f3044',
  muted: '#415a77',
  faint: '#6e849f',
  orn: '#1f4b75',
  ornSoft: '#9fb3c8',
  accent: '#96382a',
  cyan: '#148096',
  line: '#d8e2ed'
};

// Geometría de página (mm)
const PAGE = { w: 210, h: 297, top: 25, bottom: 24, side: 24 };

function signName(i, isEn) { return isEn ? SIGNS_EN[i] : SIGNS[i]; }
function signAbbr(i, isEn) { return signName(i, isEn).slice(0, 3).toUpperCase(); }

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function cssString(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}
function svgUrl(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// ---------- ORNAMENTOS SVG ----------

// Loto de 16 pétalos en dos coronas, con bindu central. Sin círculo envolvente: lee como flor, no como rueda.
function lotusSVG(size) {
  let outer = '', inner = '';
  for (let i = 0; i < 8; i++) {
    outer += `<path d="M50 50 C 41 38, 42 20, 50 8 C 58 20, 59 38, 50 50 Z" transform="rotate(${i * 45} 50 50)" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  }
  for (let i = 0; i < 8; i++) {
    inner += `<path d="M50 50 C 44 42, 45 32, 50 24 C 55 32, 56 42, 50 50 Z" transform="rotate(${i * 45 + 22.5} 50 50)" fill="${C.accent}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">${outer}${inner}
    <circle cx="50" cy="50" r="9" fill="${C.ornSoft}" stroke="${C.ink}" stroke-width="2"/><circle cx="50" cy="50" r="3" fill="${C.ink}"/></svg>`;
}

// Separador: filete — punto — rombo — punto — filete
function dividerSVG(width = 150) {
  const m = width / 2;
  return `<svg class="divider" xmlns="http://www.w3.org/2000/svg" width="${width}" height="12" viewBox="0 0 ${width} 12">
    <line x1="0" y1="6" x2="${m - 16}" y2="6" stroke="${C.ornSoft}" stroke-width="0.9"/>
    <line x1="${m + 16}" y1="6" x2="${width}" y2="6" stroke="${C.ornSoft}" stroke-width="0.9"/>
    <circle cx="${m - 11}" cy="6" r="1.4" fill="${C.ornSoft}"/><circle cx="${m + 11}" cy="6" r="1.4" fill="${C.ornSoft}"/>
    <path d="M${m} 0.8 L${m + 5.2} 6 L${m} 11.2 L${m - 5.2} 6 Z" fill="${C.accent}"/>
  </svg>`;
}

// Yantra de portada: marco cuadrado doble, loto de 8 pétalos ojivales con contorno, círculo con
// 8 hojas, hexagrama opaco de bandas entrelazadas (tapa las hojas, solo asoman sus puntas) y bindu grande al centro. Tintes muy suaves de la paleta
// fría; el único color pleno es el óxido del bindu.
function yantraSVG(size) {
  const ink = C.ink, acc = C.accent, orn = C.orn, cyan = C.cyan;
  const rot = (n, off = 0) => Array.from({ length: n }, (_, i) => i * (360 / n) + off);
  // Pétalo ojival apuntando hacia arriba; la base queda oculta bajo el círculo interior
  const PETAL = 'M100 14 C104 22 111 26 117 30 C126 36 125 52 119 64 L81 64 C75 52 74 36 83 30 C89 26 96 22 100 14 Z';
  const LEAF = 'M100 72 Q117 54 100 30 Q83 54 100 72 Z';
  const petals = (attrs) => rot(8).map(a => `<path d="${PETAL}" transform="rotate(${a} 100 100)" ${attrs}/>`).join('');
  const leaves = rot(8, 22.5).map(a => `<path d="${LEAF}" transform="rotate(${a} 100 100)"/>`).join('');
  const up = 'M100 38 L153.7 131 H46.3 Z';
  const down = 'M100 162 L46.3 69 H153.7 Z';
  // Banda: trazo oscuro ancho con trazo de papel encima → doble filete
  const band = (d) => `<path d="${d}" fill="none" stroke="${ink}" stroke-opacity="0.8" stroke-width="3.6" stroke-linejoin="miter"/>
    <path d="${d}" fill="none" stroke="${C.paper}" stroke-width="2.1" stroke-linejoin="miter"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200">
    <rect x="3" y="3" width="194" height="194" fill="#eef3f8" stroke="${ink}" stroke-opacity="0.7" stroke-width="0.7"/>
    <rect x="9" y="9" width="182" height="182" fill="${C.paper}" stroke="${orn}" stroke-opacity="0.55" stroke-width="0.5"/>
    ${petals(`fill="none" stroke="${C.ornSoft}" stroke-width="3.4" stroke-linejoin="round"`)}
    ${petals(`fill="#edf2f7" stroke="${ink}" stroke-opacity="0.75" stroke-width="0.6" stroke-linejoin="round"`)}
    <circle cx="100" cy="100" r="47" fill="#e6f1f3" stroke="${cyan}" stroke-opacity="0.7" stroke-width="0.6"/>
    <g fill="${cyan}" fill-opacity="0.16" stroke="${cyan}" stroke-width="0.6" stroke-linejoin="round">${leaves}</g>
    <path d="${up}" fill="#e8f2f4"/>
    <path d="${down}" fill="#f5ebe8"/>
    ${band(up)}${band(down)}
    <circle cx="100" cy="100" r="25" fill="${C.paper}" stroke="${ink}" stroke-opacity="0.6" stroke-width="0.5"/>
    <circle cx="100" cy="100" r="21" fill="${acc}" fill-opacity="0.9"/>
  </svg>`;
}

// Marca de agua: el mismo yantra en filigrana que usa la landing de fondo (public/yantra-pattern.svg)
const YANTRA_PATTERN = (() => {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '../public/yantra-pattern.svg'), 'utf8');
    return raw.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'));
  } catch (e) {
    return '';
  }
})();

function watermarkYantra(cx, cy, size, opacity) {
  if (!YANTRA_PATTERN) return '';
  const k = size / 340;
  // El bindu de la web (fill-opacity 0.25) se ve como una mancha detrás del texto: se baja al nivel del trazo
  const body = YANTRA_PATTERN
    .replace(/stroke-opacity="[\d.]+"/, `stroke-opacity="${opacity}"`)
    .replace(/fill-opacity="[\d.]+"/g, `fill-opacity="${opacity}"`);
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${k})">${body}</g>`;
}

// Fondo de página: bhupura de trazo fino con puertas escalonadas (como el patrón de la web) + yantra de agua
function pageBackgroundSVG({ watermark }) {
  const { w, h } = PAGE;
  const o = 9;
  const gw = 14, d1 = 2.6, d2 = 1.8, gw2 = 8; // puerta: semiancho y escalones
  const stroke = `fill="none" stroke="${C.orn}" stroke-opacity="0.45" stroke-width="0.25"`;
  // Puerta escalonada sobre un lado; (nx, ny) apunta hacia afuera
  const gate = (mx, my, horiz, out) => {
    const s1 = out * d1, s2 = out * (d1 + d2);
    return horiz
      ? `<path ${stroke} d="M${mx - gw} ${my} V${my + s1} H${mx + gw} V${my} M${mx - gw2} ${my + s1} V${my + s2} H${mx + gw2} V${my + s1}"/>`
      : `<path ${stroke} d="M${mx} ${my - gw} H${mx + s1} V${my + gw} H${mx} M${mx + s1} ${my - gw2} H${mx + s2} V${my + gw2} H${mx + s1}"/>`;
  };
  const corner = (x, y) => `<path d="M${x} ${y - 1} L${x + 1} ${y} L${x} ${y + 1} L${x - 1} ${y} Z" fill="${C.accent}" fill-opacity="0.7"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">
    ${watermark ? watermarkYantra(w / 2, h / 2 + 4, 150, 0.075) : ''}
    <rect x="${o}" y="${o}" width="${w - 2 * o}" height="${h - 2 * o}" ${stroke}/>
    <rect x="${o + 2}" y="${o + 2}" width="${w - 2 * o - 4}" height="${h - 2 * o - 4}" fill="none" stroke="${C.orn}" stroke-opacity="0.3" stroke-width="0.15" stroke-dasharray="1 1.2"/>
    ${gate(w / 2, o, true, -1)}${gate(w / 2, h - o, true, 1)}${gate(o, h / 2, false, -1)}${gate(w - o, h / 2, false, 1)}
    ${corner(o, o)}${corner(w - o, o)}${corner(o, h - o)}${corner(w - o, h - o)}
  </svg>`;
}

// ---------- MARKDOWN → HTML ----------

function inline(s) {
  let res = escapeHtml(s);
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  res = res.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return res;
}

// Línea de datos: "**Etiqueta:** valor · **Etiqueta:** valor"
function isDataLine(line) {
  return /^\*\*[^*]+:\*\*/.test(line) && line.includes(' · ') && line.length < 220;
}
function dataLine(line) {
  return '<p class="data-line">' + inline(line).split(' · ').join('<span class="sep"></span>') + '</p>';
}

function mdToHtml(md, blocks = {}) {
  const lines = String(md).replace(/\r/g, '').split('\n');
  let html = '';
  let para = [];
  let list = [];

  const flushPara = () => {
    if (!para.length) return;
    if (para.length === 1 && isDataLine(para[0])) html += dataLine(para[0]);
    else html += '<p>' + para.map(inline).join('<br>') + '</p>';
    para = [];
  };
  const flushList = () => { if (list.length) { html += '<ul class="editorial-list">' + list.map(t => '<li>' + inline(t) + '</li>').join('') + '</ul>'; list = []; } };
  const flush = () => { flushPara(); flushList(); };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { flush(); continue; }
    let m;
    if ((m = line.match(/^\{\{(\w+)\}\}$/))) { flush(); html += blocks[m[1]] || ''; continue; }
    if ((m = line.match(/^### (.*)$/))) { flush(); html += '<h3>' + inline(m[1]) + '</h3>'; continue; }
    if ((m = line.match(/^## (.*)$/)))  { flush(); html += '<h3>' + inline(m[1]) + '</h3>'; continue; }
    if ((m = line.match(/^> (.*)$/)))   { flush(); html += `<blockquote class="closing">${lotusSVG(26)}<p>${inline(m[1])}</p></blockquote>`; continue; }
    if (line === '---') { flush(); html += `<div class="rule">${dividerSVG(120)}</div>`; continue; }
    if ((m = line.match(/^- (.*)$/))) { flushPara(); list.push(m[1]); continue; }
    flushList();
    para.push(line);
  }
  flush();
  return html;
}

// ---------- CARTA SUR DE LA INDIA (D-1 / D-9) ----------

const CELL = {
  11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3],
  10: [1, 0],                       3: [1, 3],
  9:  [2, 0],                       4: [2, 3],
  8:  [3, 0], 7: [3, 1], 6: [3, 2], 5: [3, 3]
};

function renderChartSVG(chart, { varga = 'D1', isEn }) {
  const S = 80, W = S * 4;
  const isD9 = varga === 'D9';
  const idxOf = (p) => (isD9 ? p.navamshaIndex : p.signIndex);
  const ascSign = idxOf(chart.planets.Asc);

  const bySign = {};
  ['Asc', ...PLANET_ORDER].forEach(k => {
    const p = chart.planets[k];
    (bySign[idxOf(p)] = bySign[idxOf(p)] || []).push(k);
  });

  const serif = `font-family="'Source Serif 4', Georgia, serif"`;
  let svg = `<svg viewBox="-2 -2 ${W + 4} ${W + 4}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">`;

  Object.keys(CELL).forEach(key => {
    const sign = +key;
    const [r, c] = CELL[key];
    const x = c * S, y = r * S;
    const isAsc = sign === ascSign;
    svg += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${isAsc ? '#f6ebe7' : C.cell}" stroke="${C.line}" stroke-width="0.9"/>`;
    svg += `<text x="${x + 6}" y="${y + 13}" font-size="8" font-weight="700" letter-spacing="0.7" fill="${C.faint}" ${serif}>${signAbbr(sign, isEn)}</text>`;
    if (isAsc) {
      svg += `<line x1="${x + S - 18}" y1="${y}" x2="${x + S}" y2="${y + 18}" stroke="${C.accent}" stroke-width="1.6"/>`;
    }
    const list = bySign[sign] || [];
    const lh = 12.5;
    const y0 = y + S / 2 + 6 - ((list.length - 1) * lh) / 2;
    list.forEach((k, i) => {
      const p = chart.planets[k];
      const isA = k === 'Asc';
      const label = isA ? 'Asc' : k;
      const retro = p.retrograde && k !== 'Ra' && k !== 'Ke' ? `<tspan font-size="6.5" font-weight="600" fill="${C.accent}" dy="-4">R</tspan><tspan dy="4"></tspan>` : '';
      const deg = isD9 ? '' : `<tspan font-size="8" font-weight="400" fill="${C.muted}" dx="2.5">${Math.floor(p.degreeInSign)}°</tspan>`;
      svg += `<text x="${x + S / 2}" y="${y0 + i * lh}" text-anchor="middle" font-size="11" font-weight="700" fill="${isA ? C.accent : C.ink}" ${serif}>${label}${retro}${deg}</text>`;
    });
  });

  // Cuadro central
  const cx = W / 2, cy = W / 2;
  svg += `<rect x="${S}" y="${S}" width="${S * 2}" height="${S * 2}" fill="${C.paper}" stroke="${C.line}" stroke-width="0.9"/>`;
  svg += `<g fill="none" stroke="${C.ornSoft}" stroke-width="1">
    <circle cx="${cx}" cy="${cy - 22}" r="23"/><circle cx="${cx}" cy="${cy - 22}" r="19" stroke-dasharray="1 2"/>
    <path d="M${cx} ${cy - 37} L${cx + 13} ${cy - 14.5} H${cx - 13} Z"/>
    <path d="M${cx} ${cy - 7} L${cx - 13} ${cy - 29.5} H${cx + 13} Z" stroke="${C.accent}"/>
  </g><circle cx="${cx}" cy="${cy - 22}" r="2" fill="${C.ink}"/>`;
  svg += `<text x="${cx}" y="${cy + 24}" text-anchor="middle" font-size="17" font-style="italic" font-weight="400" fill="${isD9 ? C.cyan : C.ink}" ${serif}>${isD9 ? 'Navāṃśa' : 'Rāśi'}</text>`;
  const sub = isD9 ? (isEn ? 'D-9 · SOUL CHART' : 'D-9 · CARTA DEL ALMA') : (isEn ? 'D-1 · BIRTH CHART' : 'D-1 · CARTA NATAL');
  svg += `<text x="${cx}" y="${cy + 40}" text-anchor="middle" font-size="7" font-weight="600" letter-spacing="1.4" fill="${C.faint}" ${serif}>${sub}</text>`;
  svg += `<rect x="0" y="0" width="${W}" height="${W}" fill="none" stroke="${C.ink}" stroke-width="1.3"/>`;
  svg += `</svg>`;
  return svg;
}

function renderChartsBlock(chart, isEn, labels) {
  const names = PLANET_NAMES[isEn ? 'en' : 'es'];
  const legend = ['Asc', ...PLANET_ORDER].map(k => `<span><b>${k}</b> ${names[k]}</span>`).join('')
    + `<span><b class="r">R</b> ${isEn ? 'retrograde' : 'retrógrado'}</span>`;
  const s = chart.subject;
  const caption = isEn
    ? `Sidereal zodiac · Lahiri ayanamsa (${String(s.ayanamsa).replace(/^Lahiri\s*\(|\)$/g, '')}) · Whole Sign houses`
    : `Zodíaco sidéreo · ayanamsa Lahiri (${String(s.ayanamsa).replace(/^Lahiri\s*\(|\)$/g, '')}) · casas por signo completo`;
  return `<div class="charts">
      <figure>${renderChartSVG(chart, { varga: 'D1', isEn })}</figure>
      <figure>${renderChartSVG(chart, { varga: 'D9', isEn })}</figure>
    </div>
    <p class="legend">${legend}</p>
    <p class="caption">${caption}</p>
    ${renderPlanetsTable(chart, isEn, labels)}`;
}

// ---------- TABLAS ----------

function renderPlanetsTable(chart, isEn, labels) {
  const names = PLANET_NAMES[isEn ? 'en' : 'es'];
  const dig = (p) => (p.dignity ? escapeHtml(labels.dignity[p.dignity]) : '—');
  const rows = ['Asc', ...PLANET_ORDER].map(k => {
    const p = chart.planets[k];
    const house = k === 'Asc' ? '1' : String(p.house);
    return `<tr${k === 'Asc' ? ' class="asc-row"' : ''}>
      <td class="abbr">${k === 'Asc' ? 'Asc' : k}</td>
      <td class="name">${escapeHtml(names[k])}${p.retrograde && k !== 'Ra' && k !== 'Ke' ? '<sup class="r">R</sup>' : ''}</td>
      <td>${escapeHtml(signName(p.signIndex, isEn))}</td>
      <td class="num">${escapeHtml(p.degreeFormatted)}</td>
      <td class="num center">${house}</td>
      <td>${escapeHtml(p.nakshatra)} <span class="pada">${p.pada}</span></td>
      <td class="dig${p.dignity ? ' ' + p.dignity : ''}">${k === 'Asc' ? '' : dig(p)}</td>
      <td class="nav">${escapeHtml(signName(p.navamshaIndex, isEn))}</td>
    </tr>`;
  }).join('');

  return `<table class="astro-table">
    <thead><tr>
      <th></th>
      <th>${isEn ? 'Graha' : 'Graha'}</th>
      <th>${isEn ? 'Sign' : 'Signo'}</th>
      <th>${isEn ? 'Degree' : 'Grado'}</th>
      <th class="center">${isEn ? 'House' : 'Casa'}</th>
      <th>Nakshatra · pada</th>
      <th>${isEn ? 'Dignity' : 'Dignidad'}</th>
      <th>Navāṃśa</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderDashaTable(chart, isEn) {
  const now = new Date();
  const rows = chart.dashas.map(d => {
    const active = d.start <= now && d.end > now;
    const past = d.end <= now;
    const lord = isEn ? d.lord : (DASHA_LORDS_ES[d.lord] || d.lord);
    const status = active ? (isEn ? 'In course' : 'En curso') : past ? (isEn ? 'Completed' : 'Concluido') : (isEn ? 'Upcoming' : 'Próximo');
    const cls = active ? 'active' : past ? 'past' : 'next';
    return `<tr class="${cls}">
      <td class="name">${active ? '<span class="mark"></span>' : ''}${escapeHtml(lord)}</td>
      <td class="num">${d.start.getFullYear()}</td>
      <td class="num">${d.end.getFullYear()}</td>
      <td class="num">${d.years.toFixed(1).replace('.', isEn ? '.' : ',')} ${isEn ? 'yrs' : 'años'}</td>
      <td class="status">${status}</td>
    </tr>`;
  }).join('');
  return `<table class="astro-table dasha-table">
    <thead><tr>
      <th>Mahādaśā</th>
      <th>${isEn ? 'From' : 'Desde'}</th>
      <th>${isEn ? 'To' : 'Hasta'}</th>
      <th>${isEn ? 'Duration' : 'Duración'}</th>
      <th>${isEn ? 'Status' : 'Estado'}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// Las 12 casas: signo, ámbito, regente, dónde está el regente y ocupantes
function renderHousesTable(chart, isEn, labels) {
  const names = PLANET_NAMES[isEn ? 'en' : 'es'];
  const rows = chart.houseTable.map(h => `<tr${h.occupants.length ? '' : ' class="empty"'}>
      <td class="num center hnum">${h.house}</td>
      <td>${escapeHtml(signName(h.signIndex, isEn))}</td>
      <td class="area">${escapeHtml(labels.houseShort[h.house])}</td>
      <td class="name">${escapeHtml(names[h.lord])}</td>
      <td class="num center">${h.lordHouse}</td>
      <td>${h.occupants.length ? h.occupants.map(k => `<span class="occ">${k}</span>`).join(' ') : '<span class="none">—</span>'}</td>
    </tr>`).join('');
  return `<table class="astro-table houses-table">
    <thead><tr>
      <th class="center">${isEn ? 'House' : 'Casa'}</th>
      <th>${isEn ? 'Sign' : 'Signo'}</th>
      <th>${isEn ? 'Domain' : 'Ámbito'}</th>
      <th>${isEn ? 'Lord' : 'Regente'}</th>
      <th class="center">${isEn ? 'Lord in' : 'Regente en'}</th>
      <th>${isEn ? 'Occupants' : 'Ocupantes'}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// Subperiodos del mahadasha en curso, con mes y año
function renderAntardashaTable(chart, isEn) {
  const md = chart.currentDasha;
  const now = new Date();
  const lordName = (lord) => (isEn ? lord : (DASHA_LORDS_ES[lord] || lord));
  const month = (d) => d.toLocaleDateString(isEn ? 'en-GB' : 'es-ES', { month: 'short', year: 'numeric' }).replace('.', '');
  const rows = md.antardashas.map(a => {
    const active = a.start <= now && a.end > now;
    const past = a.end <= now;
    const status = active ? (isEn ? 'In course' : 'En curso') : past ? (isEn ? 'Completed' : 'Concluido') : (isEn ? 'Upcoming' : 'Próximo');
    return `<tr class="${active ? 'active' : past ? 'past' : 'next'}">
      <td class="name">${active ? '<span class="mark"></span>' : ''}${escapeHtml(lordName(md.lord))} · ${escapeHtml(lordName(a.lord))}</td>
      <td class="num">${month(a.start)}</td>
      <td class="num">${month(a.end)}</td>
      <td class="status">${status}</td>
    </tr>`;
  }).join('');
  return `<table class="astro-table dasha-table">
    <thead><tr>
      <th>Antardaśā</th>
      <th>${isEn ? 'From' : 'Desde'}</th>
      <th>${isEn ? 'To' : 'Hasta'}</th>
      <th>${isEn ? 'Status' : 'Estado'}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// Resumen: retícula de 3 × 3 fichas
function renderSummary(report) {
  return `<div class="summary">${report.summary.map(c => `<div class="card">
      <div class="c-label">${escapeHtml(c.label)}</div>
      <div class="c-value">${escapeHtml(c.value)}</div>
      <div class="c-note">${escapeHtml(c.note)}</div>
    </div>`).join('')}</div>`;
}

// Balance elemental: cuatro columnas con escala de puntos (7 grahas visibles)
function renderElements(chart, isEn) {
  const el = chart.elements;
  const items = [
    ['fire', isEn ? 'Fire' : 'Fuego', 'Agni'],
    ['earth', isEn ? 'Earth' : 'Tierra', 'Pṛthvī'],
    ['air', isEn ? 'Air' : 'Aire', 'Vāyu'],
    ['water', isEn ? 'Water' : 'Agua', 'Jala']
  ];
  const max = Math.max(...items.map(i => el[i[0]]));
  return `<div class="elements">${items.map(([k, label, san]) => {
    const n = el[k];
    let dots = '';
    for (let i = 0; i < 7; i++) dots += `<i class="${i < n ? 'on' : ''}"></i>`;
    return `<div class="el${n === max ? ' dom' : ''}">
      <div class="el-name">${label}</div><div class="el-san">${san}</div>
      <div class="dots">${dots}</div><div class="el-n">${n}</div>
    </div>`;
  }).join('')}</div>`;
}

// ---------- PORTADA ----------

function formatBirth(chart, isEn) {
  const s = chart.subject;
  const b = s.birth;
  let date = s.birthDate;
  if (b) {
    const d = new Date(Date.UTC(b.year, b.month - 1, b.day, 12));
    date = d.toLocaleDateString(isEn ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  let coords = s.coords;
  if (b && typeof b.lat === 'number' && typeof b.lon === 'number') {
    const f = (v) => Math.abs(v).toFixed(2).replace('.', isEn ? '.' : ',');
    coords = `${f(b.lat)}° ${b.lat >= 0 ? 'N' : 'S'} · ${f(b.lon)}° ${b.lon >= 0 ? 'E' : (isEn ? 'W' : 'O')}`;
  }
  return { date, time: s.birthTime, place: s.place, coords };
}

function renderCover(report, chart, isEn) {
  const c = report.cover;
  const b = formatBirth(chart, isEn);
  const P = chart.planets;
  const trio = [
    { label: isEn ? 'Ascendant' : 'Ascendente', san: 'Lagna', p: P.Asc },
    { label: isEn ? 'Moon' : 'Luna', san: 'Chandra', p: P.Mo },
    { label: isEn ? 'Sun' : 'Sol', san: 'Sūrya', p: P.Su }
  ].map(t => `<div class="pillar">
      <div class="p-label">${t.label}</div>
      <div class="p-sign">${escapeHtml(signName(t.p.signIndex, isEn))}</div>
      <div class="p-san">${t.san} · ${escapeHtml(t.p.nakshatra)}</div>
    </div>`).join('');

  const line2 = [b.place, b.coords].filter(Boolean).map(escapeHtml).join(' · ');

  return `<section class="cover">
    <div class="cover-top">
      <p class="kicker">Jyotiṣa · ${isEn ? 'Vedic Astrology' : 'Astrología védica'}</p>
    </div>
    <div class="cover-mid">
      <div class="yantra">${yantraSVG(270)}</div>
      <p class="cover-sub">${escapeHtml(c.subtitle)}</p>
      <h1>${escapeHtml(c.name)}</h1>
      ${dividerSVG(170)}
      <p class="birth">${escapeHtml(b.date)} · ${escapeHtml(b.time)} h</p>
      <p class="birth-2">${line2}</p>
    </div>
    <div class="cover-bottom">${trio}</div>
  </section>`;
}

function renderIntro(report, isEn, titles) {
  const c = report.cover;
  const intro = c.intro.map((p, i) => `<p class="${i === 0 ? 'lede first' : 'lede'}">${inline(p)}</p>`).join('');
  const toc = titles.map((t, i) => `<li><span class="toc-n">${ROMAN[i]}</span><span class="toc-t">${escapeHtml(t)}</span></li>`).join('');
  return `<section class="intro">
    <div class="epigraph">
      ${lotusSVG(30)}
      <p>${inline(c.epigraph)}</p>
    </div>
    ${intro}
    <div class="toc">
      <p class="toc-title">${isEn ? 'Contents' : 'Contenido'}</p>
      ${dividerSVG(110)}
      <ol>${toc}</ol>
    </div>
  </section>`;
}

// ---------- COMPOSICIÓN DEL DOCUMENTO ----------

function generateHTML(report, chart, lang = 'es') {
  const isEn = (lang === 'en' || report.lang === 'en');
  const c = report.cover;

  const labels = report.labels;
  const blocks = {
    SUMMARY: renderSummary(report),
    CHARTS: renderChartsBlock(chart, isEn, labels),
    ELEMENTS: renderElements(chart, isEn),
    HOUSES_TABLE: renderHousesTable(chart, isEn, labels),
    DASHA_TABLE: renderDashaTable(chart, isEn),
    ANTARDASHA_TABLE: renderAntardashaTable(chart, isEn)
  };

  const titles = report.sections.map(s => s.title);
  const sectionsHtml = report.sections.map((s, idx) => `<section class="chapter">
      <header class="opener">
        ${lotusSVG(24)}
        <p class="num">${ROMAN[idx]}</p>
        <h2>${escapeHtml(s.title)}</h2>
        ${dividerSVG(130)}
      </header>
      ${mdToHtml(s.body, blocks)}
    </section>`).join('');

  const locale = isEn ? 'en-GB' : 'es-ES';
  const today = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

  const bgPage = svgUrl(pageBackgroundSVG({ watermark: true }));
  const bgCover = svgUrl(pageBackgroundSVG({ watermark: false }));
  const runHead = `${c.name}  ·  Janma Kundali`;
  const bgPos = `-${PAGE.side}mm -${PAGE.top}mm / ${PAGE.w}mm ${PAGE.h}mm no-repeat`;

  return `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'es'}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(c.name)} · ${escapeHtml(c.subtitle)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,300;1,8..60,400&display=swap');

  :root {
    --paper: ${C.paper}; --ink: ${C.ink}; --body: ${C.body}; --muted: ${C.muted};
    --orn: ${C.orn}; --orn-soft: ${C.ornSoft}; --faint: ${C.faint}; --accent: ${C.accent}; --cyan: ${C.cyan}; --line: ${C.line};
    --serif: 'Source Serif 4', Georgia, serif;
    --display: 'Source Serif 4', Georgia, serif;
  }

  @page {
    size: A4;
    margin: ${PAGE.top}mm ${PAGE.side}mm ${PAGE.bottom}mm;
    background: ${C.paper} url('${bgPage}') ${bgPos};
    @top-center {
      content: ${cssString(runHead.toUpperCase())};
      font-family: 'Source Serif 4', Georgia, serif; font-size: 6.5pt; font-weight: 600;
      letter-spacing: .22em; color: ${C.faint};
      vertical-align: bottom; padding-bottom: 6mm;
    }
    @bottom-center {
      content: counter(page);
      font-family: 'Source Serif 4', Georgia, serif; font-size: 8.5pt; font-weight: 400;
      color: ${C.ink}; vertical-align: top; padding-top: 5mm;
    }
  }
  @page :first {
    background: ${C.paper} url('${bgCover}') ${bgPos};
    @top-center { content: none; }
    @bottom-center { content: none; }
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: transparent; }
  body {
    font-family: var(--serif);
    font-size: 10.25pt; line-height: 1.6;
    color: var(--body);
    font-variant-numeric: oldstyle-nums proportional-nums;
    hyphens: auto; -webkit-hyphens: auto;
    orphans: 3; widows: 3;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  svg { display: block; }

  /* ===== Portada ===== */
  .cover {
    height: ${PAGE.h - PAGE.top - PAGE.bottom - 2}mm;
    display: flex; flex-direction: column; justify-content: space-between; align-items: center;
    text-align: center; break-after: page;
  }
  .kicker {
    font-size: 7.5pt; font-weight: 600; letter-spacing: .32em; text-transform: uppercase; color: var(--faint);
  }
  .cover-mid { display: flex; flex-direction: column; align-items: center; }
  .yantra { margin-bottom: 12mm; }
  .cover-sub {
    font-family: var(--display); font-style: italic; font-weight: 400; font-size: 12pt; color: var(--accent);
    margin-bottom: 1mm;
  }
  .cover h1 {
    font-family: var(--display); font-weight: 300; font-size: 34pt; line-height: 1.08;
    color: var(--ink); letter-spacing: -0.01em; margin-bottom: 5mm;
  }
  .cover .divider { margin: 0 auto 5mm; }
  .birth { font-size: 11pt; font-weight: 600; color: var(--ink); letter-spacing: .02em; font-variant-numeric: lining-nums; }
  .birth-2 { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin-top: 1.5mm; font-variant-numeric: lining-nums; }
  .cover-bottom {
    display: flex; width: 100%; border-top: 0.6pt solid var(--orn-soft); border-bottom: 0.6pt solid var(--orn-soft);
    padding: 4mm 0;
  }
  .pillar { flex: 1; padding: 0 3mm; }
  .pillar + .pillar { border-left: 0.6pt solid var(--line); }
  .p-label { font-size: 6.5pt; font-weight: 700; letter-spacing: .24em; text-transform: uppercase; color: var(--faint); }
  .p-sign { font-family: var(--display); font-weight: 400; font-size: 15pt; color: var(--ink); line-height: 1.15; margin: 1mm 0 .5mm; }
  .p-san { font-family: var(--display); font-style: italic; font-size: 8.5pt; color: var(--muted); }

  /* ===== Introducción ===== */
  .intro { break-after: page; padding-top: 6mm; }
  .epigraph { text-align: center; margin: 0 auto 10mm; max-width: 125mm; }
  .epigraph svg { margin: 0 auto 4mm; }
  .epigraph p {
    font-family: var(--display); font-style: italic; font-weight: 300; font-size: 14pt; line-height: 1.45;
    color: var(--ink); hyphens: none;
  }
  .lede { text-align: justify; margin-bottom: 3mm; }
  .lede.first::first-letter {
    font-family: var(--display); font-weight: 700; color: var(--accent);
    float: left; font-size: 38pt; line-height: .8; font-weight: 400; padding: 1.2mm 2mm 0 0;
  }
  .toc { margin: 14mm auto 0; max-width: 110mm; text-align: center; }
  .toc-title { text-align: center; font-family: var(--display); font-weight: 400; font-size: 14pt; color: var(--ink); }
  .toc .divider { margin: 2mm auto 5mm; }
  .toc ol { list-style: none; text-align: left; }
  .toc li {
    display: flex; align-items: baseline; gap: 5mm; padding: 2.1mm 0;
    border-bottom: 0.5pt solid var(--line);
  }
  .toc-n { width: 12mm; text-align: right; font-family: var(--display); font-weight: 400; font-size: 9.5pt; letter-spacing: .1em; color: var(--faint); }
  .toc-t { font-family: var(--display); font-weight: 400; font-size: 11pt; color: var(--ink); }

  /* ===== Capítulos ===== */
  /* Cada capítulo abre en página nueva: evita aperturas huérfanas al pie */
  .chapter { break-before: page; padding-top: 4mm; }
  .opener { text-align: center; margin-bottom: 6mm; break-inside: avoid; break-after: avoid; }
  .opener svg { margin: 0 auto; }
  .opener .num {
    text-align: center;
    font-family: var(--display); font-weight: 400; font-size: 8pt; letter-spacing: .3em;
    color: var(--faint); margin: 2mm 0 0; padding-left: .3em;
  }
  .opener h2 {
    font-family: var(--display); font-weight: 300; font-size: 22pt; line-height: 1.15;
    color: var(--ink); margin: 0.5mm 0 2.5mm; hyphens: none;
  }
  h3 {
    font-family: var(--display); font-weight: 600; font-size: 11.5pt; line-height: 1.25;
    color: var(--ink); margin: 6mm 0 1.2mm; break-after: avoid; hyphens: none;
  }
  p { margin: 0 0 2.6mm; text-align: justify; }
  strong { color: var(--ink); font-weight: 700; }
  em { font-style: italic; }

  .data-line {
    text-align: left; font-size: 8.8pt; color: var(--ink); margin-bottom: 1.8mm;
    font-variant-numeric: lining-nums; break-after: avoid; hyphens: none;
  }
  .data-line strong {
    font-size: 6.6pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
    color: var(--faint); margin-right: .6mm;
  }
  .data-line .sep {
    display: inline-block; width: 3.2pt; height: 3.2pt; background: var(--accent);
    transform: rotate(45deg); margin: 0 2.6mm; vertical-align: 1.5pt;
  }

  ul.editorial-list { list-style: none; margin: 1mm 0 3mm; }
  ul.editorial-list li {
    position: relative; padding-left: 5mm; margin-bottom: 1.6mm; text-align: left;
    line-height: 1.5; break-inside: avoid;
  }
  ul.editorial-list li::before {
    content: ''; position: absolute; left: .6mm; top: 2.2mm; width: 3.4pt; height: 3.4pt;
    background: var(--orn-soft); transform: rotate(45deg);
  }

  .rule { margin: 6mm 0; }
  .rule .divider { margin: 0 auto; }

  /* ===== Cartas ===== */
  .charts { display: flex; justify-content: space-between; gap: 8mm; margin: 2mm 0 3mm; break-inside: avoid; }
  .charts figure { flex: 1; }
  .chart-svg { width: 100%; height: auto; }
  .legend {
    text-align: center; font-size: 7.6pt; color: var(--muted); margin-bottom: .8mm; hyphens: none;
  }
  .legend span { margin: 0 1.6mm; white-space: nowrap; }
  .legend b { color: var(--ink); font-weight: 700; }
  .caption {
    text-align: center; font-family: var(--display); font-style: italic; font-size: 8.5pt; color: var(--muted);
    margin-bottom: 4mm;
  }

  /* ===== Tablas ===== */
  table.astro-table {
    width: 100%; border-collapse: collapse; margin: 2mm 0 5mm;
    font-size: 8.8pt; line-height: 1.35; break-inside: avoid;
    font-variant-numeric: lining-nums tabular-nums;
    border-top: 0.8pt solid var(--ink); border-bottom: 0.8pt solid var(--ink);
  }
  table.astro-table th {
    text-align: left; padding: 2.4mm 1.8mm 2mm; font-weight: 700;
    font-size: 6.4pt; text-transform: uppercase; letter-spacing: .16em; color: var(--faint);
    border-bottom: 0.6pt solid var(--ink);
  }
  table.astro-table td { padding: 1.7mm 1.8mm; border-bottom: 0.4pt solid var(--line); color: var(--body); }
  table.astro-table tr:last-child td { border-bottom: none; }
  table.astro-table .center { text-align: center; }
  table.astro-table .abbr { width: 9mm; font-weight: 700; color: var(--accent); font-size: 8pt; letter-spacing: .04em; }
  table.astro-table .name { font-weight: 700; color: var(--ink); }
  table.astro-table .nav { font-style: italic; color: var(--cyan); }
  table.astro-table .asc-row td { background: rgba(150, 56, 42, .05); }

  /* Las dos tablas de periodos van en la misma sección: filas más compactas */
  table.dasha-table td { padding-top: 1.15mm; padding-bottom: 1.15mm; }
  table.dasha-table tr.past td { color: var(--muted); }
  table.dasha-table tr.past .name { color: var(--muted); font-weight: 600; }
  table.dasha-table .status { font-style: italic; }
  table.dasha-table tr.active td { background: rgba(20, 128, 150, .08); color: var(--ink); font-weight: 700; }
  table.dasha-table tr.active .status { color: var(--accent); font-style: normal; letter-spacing: .04em; }
  table.dasha-table .mark {
    display: inline-block; width: 4pt; height: 4pt; background: var(--accent); transform: rotate(45deg);
    margin: 0 2mm 0 -.4mm; vertical-align: 1.2pt;
  }

  table.astro-table sup.r, .legend b.r { color: var(--accent); font-size: 6pt; font-weight: 700; margin-left: .6mm; }
  table.astro-table .pada { color: var(--muted); font-size: 7.6pt; }
  table.astro-table .dig { font-size: 8pt; color: var(--muted); }
  table.astro-table .dig.exalted, table.astro-table .dig.moolatrikona, table.astro-table .dig.own { color: var(--cyan); font-weight: 600; }
  table.astro-table .dig.debilitated { color: var(--accent); font-weight: 600; }
  table.houses-table .hnum { font-weight: 700; color: var(--ink); width: 10mm; }
  table.houses-table .area { font-style: italic; color: var(--muted); }
  table.houses-table .occ { font-weight: 700; color: var(--ink); margin-right: 1.2mm; }
  table.houses-table .none { color: var(--line); }
  table.houses-table tr.empty td { color: var(--muted); }

  /* ===== Resumen ===== */
  .summary {
    display: grid; grid-template-columns: repeat(3, 1fr); margin: 6mm 0 4mm;
    border-top: 0.8pt solid var(--ink); border-bottom: 0.8pt solid var(--ink); break-inside: avoid;
  }
  .summary .card { padding: 5mm 3.5mm 4.6mm; text-align: center; border-bottom: 0.5pt solid var(--line); }
  .summary .card:nth-child(3n+2), .summary .card:nth-child(3n+3) { border-left: 0.5pt solid var(--line); }
  .summary .card:nth-last-child(-n+3) { border-bottom: none; }
  .c-label { font-size: 6.4pt; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--faint); }
  .c-value { font-family: var(--display); font-weight: 400; font-size: 14pt; line-height: 1.2; color: var(--ink); margin: 1.6mm 0 1mm; }
  .c-note { font-style: italic; font-size: 8pt; line-height: 1.35; color: var(--muted); }

  /* ===== Elementos ===== */
  .elements { display: flex; margin: 2mm 0 4mm; border-top: 0.6pt solid var(--orn-soft); border-bottom: 0.6pt solid var(--orn-soft); break-inside: avoid; }
  .el { flex: 1; text-align: center; padding: 3mm 1mm 2.6mm; }
  .el + .el { border-left: 0.5pt solid var(--line); }
  .el-name { font-family: var(--display); font-weight: 400; font-size: 11pt; color: var(--ink); line-height: 1.1; }
  .el-san { font-family: var(--display); font-style: italic; font-size: 8pt; color: var(--muted); margin-bottom: 1.8mm; }
  .dots { display: flex; justify-content: center; gap: 1.4mm; }
  .dots i { width: 4.4pt; height: 4.4pt; border-radius: 50%; border: 0.7pt solid var(--orn-soft); }
  .dots i.on { background: var(--ink); border-color: var(--ink); }
  .el.dom .dots i.on { background: var(--accent); border-color: var(--accent); }
  .el-n { font-size: 7pt; font-weight: 700; letter-spacing: .14em; color: var(--faint); margin-top: 1.4mm; font-variant-numeric: lining-nums; }

  /* ===== Cierre ===== */
  blockquote.closing { margin: 10mm auto 0; max-width: 125mm; text-align: center; break-inside: avoid; }
  blockquote.closing svg { margin: 0 auto 3mm; }
  blockquote.closing p {
    font-family: var(--display); font-style: italic; font-weight: 300; font-size: 13pt; line-height: 1.45;
    color: var(--ink); text-align: center; hyphens: none;
  }
  .colophon {
    margin: 9mm auto 0; max-width: 130mm; text-align: center; break-inside: avoid;
    font-size: 7.4pt; color: var(--muted); line-height: 1.55; letter-spacing: .02em;
  }
  .colophon .divider { margin: 0 auto 3mm; }
  .colophon p { text-align: center; margin: 0; hyphens: none; }
</style>
</head>
<body>
  ${renderCover(report, chart, isEn)}
  ${renderIntro(report, isEn, titles)}
  ${sectionsHtml}
  <footer class="colophon">
    ${dividerSVG(90)}
    <p>${isEn ? 'Calculated with astronomy-engine · Lahiri ayanamsa · Whole Sign houses · Sidereal zodiac' : 'Calculado con astronomy-engine · ayanamsa Lahiri · casas por signo completo · zodíaco sidéreo'}</p>
    <p>${isEn ? `Prepared on ${today}. Material for self-knowledge; it does not replace professional advice.` : `Preparado el ${today}. Material de autoconocimiento; no reemplaza consejo profesional.`}</p>
  </footer>
</body>
</html>`;
}

async function generatePDF(report, chart, outputPath, lang = 'es') {
  const html = generateHTML(report, chart, lang);
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none']
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: outputPath,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });
    console.log('PDF (web) generado con éxito: ' + outputPath);
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF, generateHTML };
