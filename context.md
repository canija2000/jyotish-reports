# context.md — Jyotish Reports

## Motivación

El proyecto nació como un experimento de monetización: ¿se puede construir un producto digital vendible en una sesión, partiendo de cero, usando datos reales? La astrología védica (Jyotish) era un buen candidato porque combina cálculos astronómicos verificables con narrativa interpretativa que la gente valora y paga. La idea central: un informe PDF personalizado con datos astronómicos reales (no inventados), vendido a precio impulso ($1.99 USD) con entrega inmediata tras pago PayPal. El usuario (jabac) lo planteó como un desafío creativo con restricciones concretas: datos reales, producto funcional, y un diseño que no pareciera generado por IA.

## Qué es

Plataforma web que genera informes personalizados de astrología védica (Jyotish) con cálculos astronómicos reales y los vende en PDF a **$1.99 USD** vía PayPal.

## Estructura de archivos

```
~/dev/jyotish-reports/
├── src/
│   ├── calculator.js   # Motor astronómico: astronomy-engine → posiciones sidéreas, casas, dashas
│   ├── report.js       # Genera { cover, sections } con interpretaciones en español (markdown)
│   ├── pdf.js          # Composición editorial: generaHTML() + generatePDF() vía Puppeteer
│   └── server.js       # Express: /, /api/preview, /api/generate-report, /downloads/
├── public/
│   ├── index.html      # Landing v2: estilo editorial sobrio (papel, serif, acento óxido)
│   ├── sample-chart.js # Datos de la carta de muestra (generado por build-sample.js)
│   └── yantra-pattern.svg # Patrón vectorial de Yantra/Mandala para el fondo
├── scripts/
│   └── build-sample.js # Calcula la carta de muestra de Paul Erdős y genera public/sample-chart.js
├── reports/            # PDFs generados (servidos por /downloads/)
├── archive/
│   └── index-v1.html   # Front v1 archivado (era slop: gradientes, glassmorphism, emojis)
├── .env                # PORT=3000, PAYPAL_CLIENT_ID, PAYPAL_SECRET
├── package.json        # main=src/server.js, deps: astronomy-engine, puppeteer, express, cors, dotenv
└── README.md
```

## Arquitectura

```
Usuario → index.html (formulario + PayPal SDK)
  → POST /api/generate-report { birthData, paymentId }
    → calculator.js: calculateChart(birthData) → chart
    → report.js: generateReport(chart) → { cover, sections }
    → pdf.js: generatePDF(report, chart, path) → archivo .pdf
  ← { success, downloadUrl, chart }
  → GET /downloads/:file → descarga PDF
```

## Decisiones técnicas

| Decisión | Detalle |
|---|---|
| Motor astronómico | `astronomy-engine` npm — posiciones reales, no fake data |
| Ayanamsa | Lahiri: `base 23.856° + 50.29"/año × añosDesdeJ2000`. `astroTime.ut` es días desde J2000, no JD |
| Longitud eclíptica | `new Astronomy.Ecliptic(Astronomy.GeoVector(body, astroTime, true)).elon` |
| Oblicuidad | `Astronomy.e_tilt(astroTime).tobl` (no `.et`) |
| Casas | Whole Sign (signo completo): cada casa = 1 signo entero, Casa 1 = signo del Ascendente |
| Nakshatras | 27 divisiones de 13°20', con pada (cuartos) |
| Dasha | Vimshottari: 9 planetas, 120 años totales, arranca desde nakshatra lunar |
| Navamsha | D-9: calculado en calculator.js, disponible en datos pero no impreso en informe |
| Zona horaria | Se maneja como float (horas) para soportar fraccionarias (India UTC+5:30). Conversión via minutos totales |
| Hora desconocida en muestra | Paul Erdős nació sin hora documentada; se usa mediodía local (UTC+1) como convención estándar y se declara honestamente en letra chica |
| Muestra en landing en pestaña | Dos pestañas sobrias ("Pedir tu informe" y "Ejemplo · Paul Erdős"): mantiene el formulario y el botón de compra arriba sin enterrarlo |
| PDF | Puppeteer headless, A4, márgenes 18/16/16/16 mm, displayHeaderFooter para paginación |
| Pago | PayPal JS SDK (client-id=sb en sandbox). Monto: 1.99 USD |
| Front | Vanilla HTML/CSS/JS, sin framework |

## Datos verificados

Carta de referencia (Joaquín Bachler):
- 4 nov 1997, 13:00, Santiago Chile (UTC-3), lat -33.45, lon -70.65
- Asc Aries 8°23′36″, Sol Libra 18°26′50″, Luna Sagitario
- Ayanamsa ~23.83°
- Estos valores se validaron contra datos conocidos — son correctos

## Sistema de diseño (v2, vigente)

El usuario rechazó explícitamente el estilo v1 ("parece demasiado AI-coded, deberia ser más sobrio y natural"). Llamó "slop" a lo que tiene gradientes, glassmorphism, emojis como iconos, glow, copia de infomercial.

**Simbología:** se usa glifos tipográficos astronómicos/astrológicos (☉ ☽ ♂ ☿ ♃ ♀ ♄ ☊ ☋, ♈–♓) forzando presentación de texto con U+FE0E para evitar que aparezcan como emojis de color. No se usan emojis decorativos. El diagrama de carta en la landing sigue el formato del sur de la India: grilla 4×4 con signos fijos y marca de lagna en el ascendente.

**Landing (index.html):**
- Variables: `--paper: #f8fafc`, `--ink: #0d1b2a` (azul marino profundo), `--body: #1f3044` (azul pizarra oscuro), `--muted: #415a77` (azul noche intermedio), `--faint: #6e849f` (azul acero), `--line: #d8e2ed`, `--accent: #96382a` (óxido cálido), `--cyan: #148096` (celeste/cyan védico para la carta y Navamsha), `--cyan-muted: #1b6878`.
- Fondo: patrón sutil de Yantra/Mandala en SVG (`yantra-pattern.svg`: Bhupura con 4 puertas cardinales, lotos de 16 y 8 pétalos, y triángulos entrelazados Shatkona) con opacidad ~0.055, simulando una filigrana sobre papel fino sin interferir con la lectura.
- Tipografía: `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`
- Layout: columna única, alineación izquierda, filetes finos (1px solid var(--line))
- Marca tipográfica: ॐ en acento óxido
- Sin gradientes, sin backdrop-filter, sin emojis como iconos, sin centrado generalizado

**PDF (pdf.js):**
- Variables: mismo sistema pero `--paper: #ffffff` (blanco para impresión)
- Tipografía: `EB Garamond` (Google Fonts import en el HTML del PDF)
- Portada: kicker uppercase en acento, h1 nombre, dl meta con hairlines, epigraph con borde lateral
- Secciones: h2 con filete inferior, h3 sub-encabezados, listas con guion largo (—)
- Colofón: método + fecha + disclaimer
- Sin emojis, sin púrpura, sin gradientes

## Preview de muestra

Para que el informe de ejemplo no entierre el formulario de compra ni perjudique la conversión, la landing organiza el contenido en **dos pestañas sobrias**:
- **"Pedir tu informe" (activa por defecto):** muestra el formulario de datos (`#birthForm`), el botón de PayPal a $1.99 USD, y a continuación las secciones "Qué incluye" y "Método". El input de compra queda visible de inmediato (a ~600px del tope).
- **"Ejemplo · Paul Erdős":** muestra la carta de muestra del matemático húngaro (26 mar 1913, Budapest), con:
  - **Diagrama de carta estilo sur de la India:** grilla 4×4 con signos fijos, glifos zodiacales en celeste/cyan (`--cyan`), abreviaturas de planetas, y doble trazo diagonal en acento para marcar el ascendente (Lagna).
  - **Listado de posiciones:** glifos planetarios, signo, grado, casa, nakshatra y Navamsha (D-9) destacado en celeste/cyan con alta visibilidad.
  - **Extracto del informe:** 3 párrafos conectando la carta con su vida (colaboración, ausencia de tierra, nakshatra Anuradha).
  - **Línea de periodos Vimshottari** con la secuencia completa.
  - **CTA al final:** enlace para volver a la pestaña de pedido y enfocar el formulario.
  - **Letra chica:** declara el uso de mediodía local (UTC+1) y la transición lunar de madrugada.

Soporta enlaces directos vía hash (`#ejemplo` abre la pestaña de muestra directamente).

El archivo `scripts/build-sample.js` regenera `public/sample-chart.js` usando `src/calculator.js`; debe ejecutarse cuando cambie el motor de cálculo o los datos de la muestra.

## Formato del reporte

`generateReport(chart)` devuelve un objeto, no un string:

```js
{
  cover: {
    name, subtitle, meta: [{ label, value }],
    epigraph, intro: [p1, p2]
  },
  sections: [
    { title: 'Datos de la carta',           body: '…markdown…' },
    { title: 'Ascendente: Aries',            body: '…markdown…' },
    { title: 'Planetas en signos y casas',   body: '…markdown…' },
    { title: 'Nakshatras',                   body: '…markdown…' },
    { title: 'Casas',                        body: '…markdown…' },
    { title: 'Periodos · Vimshottari Dasha', body: '…markdown…' },
    { title: 'Síntesis',                     body: '…markdown…' }
  ]
}
```

El `body` de cada sección usa markdown mínimo: `**bold**`, `*italic*`, `### subhead`, `- list item`, `---` hr, líneas consecutivas → `<br>`.

## API

| Ruta | Método | Descripción |
|---|---|---|
| `/` | GET | Landing page |
| `/api/preview` | POST `{ birthData }` | Preview sin pago: devuelve chart + reportPreview |
| `/api/generate-report` | POST `{ birthData, paymentId }` | Genera PDF y devuelve `{ success, downloadUrl, chart }` |
| `/downloads/:file` | GET | Sirve PDFs generados |

`birthData` = `{ name, year, month, day, hour, minute, timezone, place, lat, lon }`

## Errores conocidos y fixes

| Bug | Causa | Fix |
|---|---|---|
| Ayanamsa -69° | `astroTime.ut` es días desde J2000, no JD | Dividir ut/365.25 para años desde J2000 |
| `e_tilt().et` undefined | astronomy-engine usa `.tobl` | Cambiar a `.tobl` |
| `parseInt(timezone)` perdía 30 min | India UTC+5:30 → 5 | `parseFloat` |
| `Math.floor(utcHour)` truncaba minutos | Zonas fraccionarias | Aritmética en minutos totales |
| PDF `<h3>$3</h3>` | Regex replacement `$3` literal | Cambiar a `$1` |
| UTC−5 duplicado en select | Dos opciones iguales | Eliminar duplicado |
| Front v1 = slop | Gradientes, glassmorphism, emojis, glow | Rediseño completo a editorial v2 |
| report.js devolvía string | `generateReport()` devolvía markdown plano | Refactor a `{ cover, sections }` |
| Emojis en informe PDF | 🕉️🔥🌍💨💧📊 etc. en secciones | Eliminados, copy sobrio |

## Estado actual

- Calculadora: **funcional, verificada**
- Reporte: **refactorizado a estructura, sin emojis, copy sobrio**
- PDF: **rediseñado estilo editorial (EB Garamond, óxido, filetes)**
- Landing: **v2 editorial, precio 1.99 USD, con preview de muestra (Paul Erdős)**
- Geocodificación: **automática (presets de ciudades de Iberoamérica + fallback OSM Nominatim)**
- Servidor: **funcional en localhost:3000 y expuesto públicamente vía Cloudflare Tunnel**
- Repositorio: **versionado en Git y sincronizado en GitHub (`https://github.com/canija2000/jyotish-reports`)**
- Verificación PayPal: **backend valida status 'COMPLETED' con API REST v2 de PayPal**
- PayPal: **sandbox (`client-id=sb`), pendiente reemplazar por Client ID de producción de joaquin.bachler@gmail.com**

## URLs activas
- **Pública (HTTPS):** `https://mineral-solaris-curriculum-gathered.trycloudflare.com/`
- **GitHub:** `https://github.com/canija2000/jyotish-reports`

## Pendiente / mejoras futuras

- [ ] Geocodificación automática (ciudad → coordenadas)
- [ ] Aspectos planetarios (drishti)
- [ ] Yogas (combinaciones especiales)
- [ ] Tránsitos actuales
- [ ] Más divisional charts (D-10, D-12)
- [ ] Comparación de cartas (synastry)
- [ ] Reporte en inglés
- [ ] PayPal producción (reemplazar `sb` por client-id real)
- [ ] Deploy (Vercel/Railway)

## Credenciales

- `.env` contiene `PAYPAL_CLIENT_ID` y `PAYPAL_SECRET` — **no compartir ni exponer**
- PayPal sandbox: `client-id=sb` en el front
- Email PayPal producción: `joaquin.bachler@gmail.com`
