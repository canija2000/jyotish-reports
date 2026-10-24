/**
 * Servidor Express para Jyotish Reports
 * Maneja formularios, pagos PayPal y generación de PDFs
 *
 * Flujo de pago:
 *   1. POST /api/orders           valida los datos y crea la orden en PayPal con el precio fijo
 *   2. (el cliente aprueba el pago en la ventana de PayPal)
 *   3. POST /api/generate-report  captura la orden aquí, verifica el monto y genera el PDF
 * Cada orden produce un solo informe; repetir la petición devuelve el mismo PDF.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { calculateChart } = require('./calculator');
const { generateReport } = require('./report');
const { generatePDF } = require('./pdf-web');
const paypal = require('./paypal');
const orders = require('./orders');
const { validateBirthData } = require('./validate');

paypal.assertConfigured();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Directorio para PDFs generados
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// ========== RUTAS ==========

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Configuración pública para el botón de PayPal (el client id no es secreto)
app.get('/api/config', (req, res) => {
  res.json({
    paypalClientId: paypal.TEST_MODE ? null : paypal.CLIENT_ID,
    price: paypal.PRICE,
    testMode: paypal.TEST_MODE
  });
});

// 1. Crear la orden: el monto lo fija el servidor
app.post('/api/orders', async (req, res) => {
  const { error } = validateBirthData(req.body && req.body.birthData);
  if (error) return res.status(400).json({ error });
  try {
    const order = await paypal.createOrder();
    res.json({ id: order.id });
  } catch (err) {
    console.error('Error creando orden PayPal:', err.message);
    res.status(502).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo en unos minutos.' });
  }
});

// Nombre de archivo para el cliente: solo letras, números y guiones
function downloadName(name, lang) {
  const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'informe';
  return `${lang === 'en' ? 'jyotish_report' : 'informe_jyotish'}_${slug}.pdf`;
}

// 3. Capturar el pago y generar el informe (una sola vez por orden)
app.post('/api/generate-report', async (req, res) => {
  const { birthData: rawBirth, orderId } = req.body || {};
  const { value: birthData, error } = validateBirthData(rawBirth);
  if (error) return res.status(400).json({ error });
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Falta el identificador de pago' });
  }

  try {
    const result = await orders.withLock(orderId, async () => {
      let rec = orders.get(orderId);

      // Ya entregado: se devuelve el mismo PDF, no se genera otro
      if (rec && rec.status === 'delivered' && fs.existsSync(path.join(reportsDir, rec.file))) {
        return rec;
      }

      if (!rec) {
        const capture = await paypal.captureOrder(orderId);
        // Los datos quedan ligados a la orden: un reintento no puede pedir la carta de otra persona
        rec = orders.save(orderId, {
          status: 'captured',
          captureId: capture.captureId,
          amount: capture.amount,
          test: Boolean(capture.test),
          birthData,
          capturedAt: new Date().toISOString()
        });
      }

      // Cobrado pero sin PDF (fallo previo o archivo perdido): se genera con los datos de la orden
      const data = rec.birthData;
      const chart = calculateChart(data);
      const report = generateReport(chart, data.lang);
      const file = `${crypto.randomBytes(16).toString('hex')}.pdf`; // nombre impredecible
      await generatePDF(report, chart, path.join(reportsDir, file), data.lang);

      return orders.save(orderId, {
        status: 'delivered',
        file,
        downloadName: downloadName(data.name, data.lang),
        chart: {
          ascendant: { sign: chart.ascendant.sign, degreeFormatted: chart.ascendant.degreeFormatted },
          sunSign: chart.planets.Su.sign,
          moonSign: chart.planets.Mo.sign,
          currentDasha: chart.currentDasha.lord
        },
        deliveredAt: new Date().toISOString()
      });
    });

    res.json({
      success: true,
      downloadUrl: `/downloads/${result.file}`,
      downloadName: result.downloadName,
      chart: result.chart
    });
  } catch (err) {
    if (err instanceof paypal.PaymentError) {
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    console.error('Error generando reporte:', err);
    // Si el cobro ya se hizo, el registro queda "captured" y el mismo orderId puede reintentar
    res.status(500).json({ error: 'Tu pago está registrado, pero el informe no se pudo generar. Pulsa reintentar.', retry: true });
  }
});

// Servir PDFs: solo nombres generados por el servidor (32 hex + .pdf)
app.get('/downloads/:file', (req, res) => {
  const { file } = req.params;
  if (!/^[a-f0-9]{32}\.pdf$/.test(file)) return res.status(404).end();
  const full = path.join(reportsDir, file);
  if (!fs.existsSync(full)) return res.status(404).send('Informe no encontrado');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.sendFile(full);
});

// Preview del reporte (sin pago): solo para desarrollo
if (!paypal.IS_PROD) {
  app.post('/api/preview', async (req, res) => {
    try {
      const { value: birthData, error } = validateBirthData(req.body && req.body.birthData);
      if (error) return res.status(400).json({ error });
      const chart = calculateChart(birthData);
      const report = generateReport(chart, birthData.lang);
      const previewText = report.cover.intro.join(' ') + ' ' +
        report.sections.map(s => s.title + '. ' + s.body).join(' ');

      res.json({
        chart: {
          ascendant: chart.ascendant,
          planets: chart.planets,
          elements: chart.elements,
          currentDasha: chart.currentDasha
        },
        reportPreview: previewText.replace(/[*#]/g, '').substring(0, 1200) + '…'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🕉️  JYOTISH REPORTS SERVER  🕉️                          ║
║                                                           ║
║   Servidor corriendo en: http://localhost:${PORT}             ║
║   Pagos: ${paypal.TEST_MODE ? 'MODO PRUEBA (sin cobro real)      ' : 'PayPal                            '}               ║
║                                                           ║
║   Rutas:                                                  ║
║   • GET  /                    → Landing page              ║
║   • GET  /api/config          → Config del botón de pago  ║
║   • POST /api/orders          → Crear orden PayPal        ║
║   • POST /api/generate-report → Cobrar y generar PDF      ║
║   • GET  /downloads/:file     → Descargar PDF             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
