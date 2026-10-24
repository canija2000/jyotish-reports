/**
 * Renderizador de PDF para Reportes Jyotish (Bilingüe ES / EN)
 *
 * Sistema visual "manuscrito védico":
 *  - Papel marfil a sangre con marco tipo bhupura (cuadrado ritual con puertas cardinales)
 *    y un mandala de agua muy tenue, dibujados en el fondo de @page en cada hoja.
 *  - Tipografía: Cormorant Garamond (display, títulos) + Source Serif 4 (texto, tablas).
 *  - Paleta reducida: índigo profundo, sindoor (bermellón) como acento y oro viejo para ornamentos.
 *  - Portada propia, página de introducción con índice, aperturas de sección con loto,
 *    cartas Rāśi (D-1) y Navāmśa (D-9) en estilo sur de la India.
 * Sin emojis ni glifos Unicode astrológicos: todos los símbolos son SVG.
 */
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
const C = {
  paper: '#faf6ec',
  cell: '#fffdf6',
  ink: '#1c2140',
  body: '#2b2f45',
  muted: '#62657a',
  gold: '#a8823a',
  goldDark: '#86672a',
  accent: '#a23b26',
  line: '#d8ccb2'
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
    <circle cx="50" cy="50" r="9" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/><circle cx="50" cy="50" r="3" fill="${C.ink}"/></svg>`;
}

// Separador: filete — punto — rombo — punto — filete
function dividerSVG(width = 150) {
  const m = width / 2;
  return `<svg class="divider" xmlns="http://www.w3.org/2000/svg" width="${width}" height="12" viewBox="0 0 ${width} 12">
    <line x1="0" y1="6" x2="${m - 16}" y2="6" stroke="${C.gold}" stroke-width="0.9"/>
    <line x1="${m + 16}" y1="6" x2="${width}" y2="6" stroke="${C.gold}" stroke-width="0.9"/>
    <circle cx="${m - 11}" cy="6" r="1.4" fill="${C.gold}"/><circle cx="${m + 11}" cy="6" r="1.4" fill="${C.gold}"/>
    <path d="M${m} 0.8 L${m + 5.2} 6 L${m} 11.2 L${m - 5.2} 6 Z" fill="${C.accent}"/>
  </svg>`;
}

// Yantra de portada, en filigrana: trazos finos sin rellenos sólidos. Bhupura con puertas escalonadas,
// loto de 16 y de 8 pétalos, triángulos entrelazados y bindu. El color se reserva para el centro.
function yantraSVG(size) {
  const ink = C.ink, acc = C.accent, gold = C.gold;
  let outer = '', inner = '';
  for (let i = 0; i < 16; i++) outer += `<path d="M100 22 Q 107.5 34 100 46 Q 92.5 34 100 22 Z" transform="rotate(${i * 22.5} 100 100)"/>`;
  for (let i = 0; i < 8; i++) inner += `<path d="M100 52 Q 107 63 100 74 Q 93 63 100 52 Z" transform="rotate(${i * 45 + 22.5} 100 100)"/>`;
  const gate = (r) => `<path d="M80 12 V6 H120 V12 M88 6 V2 H112 V6" transform="rotate(${r} 100 100)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-2 -2 204 204">
    <g fill="none" stroke="${gold}" stroke-width="0.7">
      <path d="M12 12 H80 M120 12 H188 V80 M188 120 V188 H120 M80 188 H12 V120 M12 80 V12"/>
      ${gate(0)}${gate(90)}${gate(180)}${gate(270)}
      <rect x="18" y="18" width="164" height="164" stroke-width="0.45" stroke-dasharray="2 2.5"/>
      <circle cx="100" cy="100" r="82" stroke-width="0.45" stroke-dasharray="1 2"/>
    </g>
    <g fill="none" stroke="${ink}" stroke-opacity="0.75" stroke-width="0.75" stroke-linejoin="round">
      <circle cx="100" cy="100" r="78"/>
      <g stroke-width="0.6">${outer}</g>
      <circle cx="100" cy="100" r="50"/>
      <circle cx="100" cy="100" r="26"/>
      <path d="M100 77 L119.9 111.5 H80.1 Z"/>
    </g>
    <g fill="${acc}" fill-opacity="0.07" stroke="${acc}" stroke-width="0.7" stroke-linejoin="round">${inner}</g>
    <path d="M100 123 L80.1 88.5 H119.9 Z" fill="none" stroke="${acc}" stroke-width="0.75" stroke-linejoin="round"/>
    <circle cx="100" cy="100" r="2.4" fill="${acc}"/>
  </svg>`;
}

// Mandala tenue (marca de agua) en unidades mm, para el fondo de página
function watermarkMandala(cx, cy, r, opacity) {
  let petals = '';
  for (let i = 0; i < 16; i++) petals += `<path d="M${cx} ${cy - r * 0.98} Q ${cx + r * 0.1} ${cy - r * 0.84} ${cx} ${cy - r * 0.7} Q ${cx - r * 0.1} ${cy - r * 0.84} ${cx} ${cy - r * 0.98} Z" transform="rotate(${i * 22.5} ${cx} ${cy})"/>`;
  for (let i = 0; i < 8; i++) petals += `<path d="M${cx} ${cy - r * 0.62} Q ${cx + r * 0.1} ${cy - r * 0.48} ${cx} ${cy - r * 0.34} Q ${cx - r * 0.1} ${cy - r * 0.48} ${cx} ${cy - r * 0.62} Z" transform="rotate(${i * 45 + 22.5} ${cx} ${cy})"/>`;
  const t = r * 0.3;
  return `<g fill="none" stroke="${C.goldDark}" stroke-opacity="${opacity}" stroke-width="0.3">
    <circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.66}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.32}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.06}" stroke-dasharray="0.6 1.2"/>
    ${petals}
    <path d="M${cx} ${cy - t} L${cx + t * 0.866} ${cy + t / 2} H${cx - t * 0.866} Z"/>
    <path d="M${cx} ${cy + t} L${cx - t * 0.866} ${cy - t / 2} H${cx + t * 0.866} Z"/>
  </g>`;
}

// Fondo de página completo: marco bhupura + esquinas + mandala de agua
function pageBackgroundSVG({ watermark }) {
  const { w, h } = PAGE;
  const o = 9, i2 = 10.6;
  // Marco en oro viejo y trazo fino: arquitectura presente pero sin peso
  const gate = (x1, y1, x2, y2, dx, dy) => `<path d="M${x1} ${y1} L${x1 + dx} ${y1 + dy} L${x2 + dx} ${y2 + dy} L${x2} ${y2}" fill="${C.paper}" stroke="${C.gold}" stroke-width="0.3"/>`;
  const gw = 14; // semiancho de la puerta
  const corner = (x, y) => `<path d="M${x} ${y - 1.1} L${x + 1.1} ${y} L${x} ${y + 1.1} L${x - 1.1} ${y} Z" fill="${C.accent}" fill-opacity="0.75"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">
    ${watermark ? watermarkMandala(w / 2, h / 2 + 4, 68, 0.16) : ''}
    <rect x="${o}" y="${o}" width="${w - 2 * o}" height="${h - 2 * o}" fill="none" stroke="${C.gold}" stroke-width="0.3"/>
    ${gate(w / 2 - gw, o, w / 2 + gw, o, 0, -3.2)}
    ${gate(w / 2 - gw, h - o, w / 2 + gw, h - o, 0, 3.2)}
    ${gate(o, h / 2 - gw, o, h / 2 + gw, -3.2, 0)}
    ${gate(w - o, h / 2 - gw, w - o, h / 2 + gw, 3.2, 0)}
    <rect x="${i2}" y="${i2}" width="${w - 2 * i2}" height="${h - 2 * i2}" fill="none" stroke="${C.gold}" stroke-opacity="0.6" stroke-width="0.15"/>
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
    svg += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${isAsc ? '#f5e6dc' : C.cell}" stroke="${C.ink}" stroke-width="0.9"/>`;
    svg += `<text x="${x + 6}" y="${y + 13}" font-size="8" font-weight="700" letter-spacing="0.7" fill="${C.goldDark}" ${serif}>${signAbbr(sign, isEn)}</text>`;
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
      const deg = isD9 ? '' : `<tspan font-size="8" font-weight="400" fill="${C.muted}" dx="2.5">${Math.floor(p.degreeInSign)}°</tspan>`;
      svg += `<text x="${x + S / 2}" y="${y0 + i * lh}" text-anchor="middle" font-size="11" font-weight="700" fill="${isA ? C.accent : C.ink}" ${serif}>${label}${deg}</text>`;
    });
  });

  // Cuadro central
  const cx = W / 2, cy = W / 2;
  svg += `<rect x="${S}" y="${S}" width="${S * 2}" height="${S * 2}" fill="${C.paper}" stroke="${C.ink}" stroke-width="0.9"/>`;
  svg += `<g fill="none" stroke="${C.gold}" stroke-width="1">
    <circle cx="${cx}" cy="${cy - 22}" r="23"/><circle cx="${cx}" cy="${cy - 22}" r="19" stroke-dasharray="1 2"/>
    <path d="M${cx} ${cy - 37} L${cx + 13} ${cy - 14.5} H${cx - 13} Z"/>
    <path d="M${cx} ${cy - 7} L${cx - 13} ${cy - 29.5} H${cx + 13} Z" stroke="${C.accent}"/>
  </g><circle cx="${cx}" cy="${cy - 22}" r="2" fill="${C.ink}"/>`;
  svg += `<text x="${cx}" y="${cy + 24}" text-anchor="middle" font-size="21" font-style="italic" font-weight="600" fill="${C.ink}" font-family="'Cormorant Garamond', Georgia, serif">${isD9 ? 'Navāṃśa' : 'Rāśi'}</text>`;
  const sub = isD9 ? (isEn ? 'D-9 · SOUL CHART' : 'D-9 · CARTA DEL ALMA') : (isEn ? 'D-1 · BIRTH CHART' : 'D-1 · CARTA NATAL');
  svg += `<text x="${cx}" y="${cy + 40}" text-anchor="middle" font-size="7" font-weight="600" letter-spacing="1.4" fill="${C.goldDark}" ${serif}>${sub}</text>`;
  svg += `<rect x="0" y="0" width="${W}" height="${W}" fill="none" stroke="${C.ink}" stroke-width="2.4"/>`;
  svg += `</svg>`;
  return svg;
}

function renderChartsBlock(chart, isEn) {
  const names = PLANET_NAMES[isEn ? 'en' : 'es'];
  const legend = ['Asc', ...PLANET_ORDER].map(k => `<span><b>${k}</b> ${names[k]}</span>`).join('');
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
    ${renderPlanetsTable(chart, isEn)}`;
}

// ---------- TABLAS ----------

function renderPlanetsTable(chart, isEn) {
  const names = PLANET_NAMES[isEn ? 'en' : 'es'];
  const rows = ['Asc', ...PLANET_ORDER].map(k => {
    const p = chart.planets[k];
    const house = k === 'Asc' ? '1' : String(p.house);
    return `<tr${k === 'Asc' ? ' class="asc-row"' : ''}>
      <td class="abbr">${k === 'Asc' ? 'Asc' : k}</td>
      <td class="name">${escapeHtml(names[k])}</td>
      <td>${escapeHtml(signName(p.signIndex, isEn))}</td>
      <td class="num">${escapeHtml(p.degreeFormatted)}</td>
      <td class="num center">${house}</td>
      <td>${escapeHtml(p.nakshatra)}</td>
      <td class="num center">${p.pada}</td>
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
      <th>Nakshatra</th>
      <th class="center">Pada</th>
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

  const blocks = {
    CHARTS: renderChartsBlock(chart, isEn),
    ELEMENTS: renderElements(chart, isEn),
    DASHA_TABLE: renderDashaTable(chart, isEn)
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
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap');

  :root {
    --paper: ${C.paper}; --ink: ${C.ink}; --body: ${C.body}; --muted: ${C.muted};
    --gold: ${C.gold}; --gold-dark: ${C.goldDark}; --accent: ${C.accent}; --line: ${C.line};
    --serif: 'Source Serif 4', Georgia, serif;
    --display: 'Cormorant Garamond', 'Cormorant', Georgia, serif;
  }

  @page {
    size: A4;
    margin: ${PAGE.top}mm ${PAGE.side}mm ${PAGE.bottom}mm;
    background: ${C.paper} url('${bgPage}') ${bgPos};
    @top-center {
      content: ${cssString(runHead.toUpperCase())};
      font-family: 'Source Serif 4', Georgia, serif; font-size: 6.5pt; font-weight: 600;
      letter-spacing: .22em; color: ${C.goldDark};
      vertical-align: bottom; padding-bottom: 6mm;
    }
    @bottom-center {
      content: counter(page);
      font-family: 'Cormorant Garamond', Georgia, serif; font-size: 11pt; font-weight: 700;
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
    font-size: 7.5pt; font-weight: 600; letter-spacing: .32em; text-transform: uppercase; color: var(--gold-dark);
  }
  .cover-mid { display: flex; flex-direction: column; align-items: center; }
  .yantra { margin-bottom: 12mm; }
  .cover-sub {
    font-family: var(--display); font-style: italic; font-weight: 500; font-size: 15pt; color: var(--accent);
    margin-bottom: 1mm;
  }
  .cover h1 {
    font-family: var(--display); font-weight: 700; font-size: 42pt; line-height: 1.02;
    color: var(--ink); letter-spacing: -0.005em; margin-bottom: 5mm;
  }
  .cover .divider { margin: 0 auto 5mm; }
  .birth { font-size: 11pt; font-weight: 600; color: var(--ink); letter-spacing: .02em; font-variant-numeric: lining-nums; }
  .birth-2 { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin-top: 1.5mm; font-variant-numeric: lining-nums; }
  .cover-bottom {
    display: flex; width: 100%; border-top: 0.6pt solid var(--gold); border-bottom: 0.6pt solid var(--gold);
    padding: 4mm 0;
  }
  .pillar { flex: 1; padding: 0 3mm; }
  .pillar + .pillar { border-left: 0.6pt solid var(--line); }
  .p-label { font-size: 6.5pt; font-weight: 700; letter-spacing: .24em; text-transform: uppercase; color: var(--gold-dark); }
  .p-sign { font-family: var(--display); font-weight: 700; font-size: 19pt; color: var(--ink); line-height: 1.15; margin: 1mm 0 .5mm; }
  .p-san { font-family: var(--display); font-style: italic; font-size: 10.5pt; color: var(--muted); }

  /* ===== Introducción ===== */
  .intro { break-after: page; padding-top: 6mm; }
  .epigraph { text-align: center; margin: 0 auto 10mm; max-width: 125mm; }
  .epigraph svg { margin: 0 auto 4mm; }
  .epigraph p {
    font-family: var(--display); font-style: italic; font-weight: 500; font-size: 17pt; line-height: 1.35;
    color: var(--ink); hyphens: none;
  }
  .lede { text-align: justify; margin-bottom: 3mm; }
  .lede.first::first-letter {
    font-family: var(--display); font-weight: 700; color: var(--accent);
    float: left; font-size: 46pt; line-height: .8; padding: 1.2mm 2mm 0 0;
  }
  .toc { margin: 14mm auto 0; max-width: 110mm; text-align: center; }
  .toc-title { text-align: center; font-family: var(--display); font-weight: 700; font-size: 17pt; color: var(--ink); }
  .toc .divider { margin: 2mm auto 5mm; }
  .toc ol { list-style: none; text-align: left; }
  .toc li {
    display: flex; align-items: baseline; gap: 5mm; padding: 2.1mm 0;
    border-bottom: 0.5pt solid var(--line);
  }
  .toc-n { width: 12mm; text-align: right; font-family: var(--display); font-weight: 700; font-size: 12pt; color: var(--gold-dark); }
  .toc-t { font-family: var(--display); font-weight: 600; font-size: 13.5pt; color: var(--ink); }

  /* ===== Capítulos ===== */
  /* Cada capítulo abre en página nueva: evita aperturas huérfanas al pie */
  .chapter { break-before: page; padding-top: 4mm; }
  .opener { text-align: center; margin-bottom: 6mm; break-inside: avoid; break-after: avoid; }
  .opener svg { margin: 0 auto; }
  .opener .num {
    text-align: center;
    font-family: var(--display); font-weight: 700; font-size: 9.5pt; letter-spacing: .3em;
    color: var(--gold-dark); margin: 2mm 0 0; padding-left: .3em;
  }
  .opener h2 {
    font-family: var(--display); font-weight: 700; font-size: 25pt; line-height: 1.1;
    color: var(--ink); margin: 0.5mm 0 2.5mm; hyphens: none;
  }
  h3 {
    font-family: var(--display); font-weight: 700; font-size: 14.5pt; line-height: 1.2;
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
    color: var(--gold-dark); margin-right: .6mm;
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
    background: var(--gold); transform: rotate(45deg);
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
    text-align: center; font-family: var(--display); font-style: italic; font-size: 10.5pt; color: var(--muted);
    margin-bottom: 4mm;
  }

  /* ===== Tablas ===== */
  table.astro-table {
    width: 100%; border-collapse: collapse; margin: 2mm 0 5mm;
    font-size: 8.8pt; line-height: 1.35; break-inside: avoid;
    font-variant-numeric: lining-nums tabular-nums;
    border-top: 1.4pt solid var(--ink); border-bottom: 1.4pt solid var(--ink);
  }
  table.astro-table th {
    text-align: left; padding: 2.4mm 1.8mm 2mm; font-weight: 700;
    font-size: 6.4pt; text-transform: uppercase; letter-spacing: .16em; color: var(--gold-dark);
    border-bottom: 0.6pt solid var(--ink);
  }
  table.astro-table td { padding: 1.7mm 1.8mm; border-bottom: 0.4pt solid var(--line); color: var(--body); }
  table.astro-table tr:last-child td { border-bottom: none; }
  table.astro-table .center { text-align: center; }
  table.astro-table .abbr { width: 9mm; font-weight: 700; color: var(--accent); font-size: 8pt; letter-spacing: .04em; }
  table.astro-table .name { font-weight: 700; color: var(--ink); }
  table.astro-table .nav { font-style: italic; color: var(--ink); }
  table.astro-table .asc-row td { background: rgba(162, 59, 38, .06); }

  table.dasha-table tr.past td { color: var(--muted); }
  table.dasha-table tr.past .name { color: var(--muted); font-weight: 600; }
  table.dasha-table .status { font-style: italic; }
  table.dasha-table tr.active td { background: rgba(168, 130, 58, .16); color: var(--ink); font-weight: 700; }
  table.dasha-table tr.active .status { color: var(--accent); font-style: normal; letter-spacing: .04em; }
  table.dasha-table .mark {
    display: inline-block; width: 4pt; height: 4pt; background: var(--accent); transform: rotate(45deg);
    margin: 0 2mm 0 -.4mm; vertical-align: 1.2pt;
  }

  /* ===== Elementos ===== */
  .elements { display: flex; margin: 2mm 0 4mm; border-top: 0.6pt solid var(--gold); border-bottom: 0.6pt solid var(--gold); break-inside: avoid; }
  .el { flex: 1; text-align: center; padding: 3mm 1mm 2.6mm; }
  .el + .el { border-left: 0.5pt solid var(--line); }
  .el-name { font-family: var(--display); font-weight: 700; font-size: 13pt; color: var(--ink); line-height: 1.1; }
  .el-san { font-family: var(--display); font-style: italic; font-size: 9.5pt; color: var(--muted); margin-bottom: 1.8mm; }
  .dots { display: flex; justify-content: center; gap: 1.4mm; }
  .dots i { width: 4.4pt; height: 4.4pt; border-radius: 50%; border: 0.7pt solid var(--gold); }
  .dots i.on { background: var(--ink); border-color: var(--ink); }
  .el.dom .dots i.on { background: var(--accent); border-color: var(--accent); }
  .el-n { font-size: 7pt; font-weight: 700; letter-spacing: .14em; color: var(--gold-dark); margin-top: 1.4mm; font-variant-numeric: lining-nums; }

  /* ===== Cierre ===== */
  blockquote.closing { margin: 10mm auto 0; max-width: 125mm; text-align: center; break-inside: avoid; }
  blockquote.closing svg { margin: 0 auto 3mm; }
  blockquote.closing p {
    font-family: var(--display); font-style: italic; font-weight: 600; font-size: 15pt; line-height: 1.35;
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
    console.log('PDF generado con éxito: ' + outputPath);
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF, generateHTML };
