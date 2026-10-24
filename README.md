# ॐ Jyotish Reports

Generador de informes personalizados de astrología védica (Jyotish) en PDF, calculados con efemérides astronómicas reales (zodíaco sidéreo, ayanamsa Lahiri, casas Whole Sign) y compuestos con diseño tipográfico editorial sobrio.

**Aplicación en vivo:** [https://mineral-solaris-curriculum-gathered.trycloudflare.com/](https://mineral-solaris-curriculum-gathered.trycloudflare.com/)  
**Informe de ejemplo completo (PDF de 8 páginas):** [Descargar muestra de Paul Erdős](https://mineral-solaris-curriculum-gathered.trycloudflare.com/muestra_erdos.pdf)

---

## Qué es

A diferencia de las aplicaciones astrológicas genéricas que utilizan fórmulas prefabricadas o posiciones solares tropicales (occidentales), Jyotish Reports calcula el mapa celeste sidéreo exacto en el momento del nacimiento utilizando `astronomy-engine`.

Cada informe genera un PDF editorial de unas ocho páginas compuesto en tipografía **EB Garamond**, con tablas de posiciones sidéreas, nakshatras con pada, división Navamsha (D-9), balance elemental, secuencia de periodos Vimshottari Dasha y una síntesis kármica integrada.

Se entrega de forma inmediata por **$1.99 USD** procesado vía PayPal.

---

## Características

- **Motor astronómico sidéreo:** Longitudes eclípticas calculadas con `astronomy-engine` y convertidas mediante el ayanamsa Lahiri oficial.
- **División Navamsha (D-9):** Cálculo armónico tradicional de la novena división para evaluar la fuerza interior y el propósito del alma.
- **27 Nakshatras:** Determinación de constelaciones lunares y pada (cuartos).
- **Vimshottari Dasha:** Secuencia completa de los periodos planetarios a lo largo de 120 años, identificando el regente actual y sus fechas clave.
- **Geocodificación integrada:** Autocompletado instantáneo de coordenadas y zonas horarias para las principales ciudades de Iberoamérica y búsqueda global automática con OpenStreetMap.
- **Diseño editorial:** Inspirado en la tradición tipográfica de libros clásicos: fondo papel marfil, tipos serif, acentos óxido y cyan védico, y filigranas de Yantras tradicionales. Sin emojis, sin gradientes ni estéticas artificiales.

---

## Estructura del proyecto

```
├── src/
│   ├── calculator.js   # Efemérides astronómicas, Lahiri ayanamsa, casas y dashas
│   ├── report.js       # Generador de estructura semántica { cover, sections }
│   ├── pdf.js          # Composición y renderizado de PDF en A4 con Puppeteer
│   └── server.js       # Servidor Express y verificación de pagos PayPal v2
├── public/
│   ├── index.html      # Landing editorial v2 con navegación en pestañas
│   ├── sample-chart.js # Datos de la carta de muestra de Paul Erdős
│   ├── yantra-pattern.svg # Filigrana vectorial de Yantra védico
│   └── muestra_erdos.pdf  # PDF de muestra pre-generado para descarga inmediata
├── Dockerfile          # Contenedor con Node 22 y Chromium headless para despliegue en la nube
├── render.yaml         # Configuración de despliegue continuo en Render / Railway
└── DISTRIBUCION.md     # Textos y estrategia para hilos en redes y foros
```

---

## Despliegue local

```bash
npm install
node scripts/build-sample.js
npm start
```

Visitar `http://localhost:3000`.

---

## Licencia

ISC
