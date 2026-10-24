/**
 * Servidor Express para Jyotish Reports
 * Maneja formularios, pagos PayPal y generación de PDFs
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { calculateChart } = require('./calculator');
const { generateReport } = require('./report');
const { generatePDF } = require('./pdf');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Directorio para PDFs generados
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// ========== VERIFICACIÓN DE PAGO PAYPAL ==========

async function verifyPayPalPayment(orderId) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;

  // Si estamos en sandbox o sin credenciales reales configuradas, se aprueba en modo prueba
  if (!clientId || clientId === 'sb' || !clientSecret || clientSecret.includes('sandbox_secret')) {
    return { verified: true, testMode: true };
  }

  const isProd = process.env.PAYPAL_ENV === 'production' || process.env.NODE_ENV === 'production';
  const apiBase = isProd ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!tokenRes.ok) {
    throw new Error('Error al autenticar con PayPal API');
  }

  const { access_token } = await tokenRes.json();
  const orderRes = await fetch(`${apiBase}/v2/checkout/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });

  if (!orderRes.ok) {
    return { verified: false, reason: 'Orden no encontrada en PayPal' };
  }

  const order = await orderRes.json();
  const isPaid = order.status === 'COMPLETED' || order.status === 'APPROVED';
  return { verified: isPaid, order };
}

// ========== RUTAS ==========

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Generar reporte (después del pago)
app.post('/api/generate-report', async (req, res) => {
  try {
    const { birthData, paymentId } = req.body;
    
    // Validar datos
    if (!birthData || !birthData.name || !birthData.year || !birthData.month || !birthData.day) {
      return res.status(400).json({ error: 'Datos de nacimiento incompletos' });
    }

    if (!paymentId) {
      return res.status(400).json({ error: 'Falta el identificador de pago' });
    }

    // Verificar con PayPal
    const paymentCheck = await verifyPayPalPayment(paymentId);
    if (!paymentCheck.verified) {
      return res.status(402).json({ error: 'El pago no ha sido verificado en PayPal' });
    }
    
    // Calcular carta
    const chart = calculateChart(birthData);
    
    // Generar reporte
    const report = generateReport(chart);
    
    // Generar PDF
    const filename = `reporte_${Date.now()}_${birthData.name.replace(/\s+/g, '_')}.pdf`;
    const outputPath = path.join(reportsDir, filename);
    
    await generatePDF(report, chart, outputPath);
    
    // Enviar URL de descarga
    res.json({
      success: true,
      downloadUrl: `/downloads/${filename}`,
      chart: {
        ascendant: chart.ascendant,
        sunSign: chart.planets.Su.sign,
        moonSign: chart.planets.Mo.sign,
        currentDasha: chart.currentDasha.lord
      }
    });
    
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ error: 'Error generando el reporte' });
  }
});

// Servir PDFs descargados
app.use('/downloads', express.static(reportsDir));

// Preview del reporte (sin pago, para testing)
app.post('/api/preview', async (req, res) => {
  try {
    const { birthData } = req.body;
    const chart = calculateChart(birthData);
    const report = generateReport(chart);
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🕉️  JYOTISH REPORTS SERVER  🕉️                          ║
║                                                           ║
║   Servidor corriendo en: http://localhost:${PORT}             ║
║                                                           ║
║   Rutas:                                                  ║
║   • GET  /                    → Landing page              ║
║   • POST /api/generate-report → Generar PDF (con pago)   ║
║   • POST /api/preview         → Preview (sin pago)       ║
║   • GET  /downloads/:file     → Descargar PDF            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
