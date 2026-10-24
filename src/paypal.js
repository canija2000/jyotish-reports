/**
 * Pagos con PayPal (Orders API v2), del lado del servidor.
 *
 * - La orden se crea aquí con el precio fijo: el navegador no puede cambiar el monto.
 * - La captura también se hace aquí, y se verifica estado, monto y moneda.
 * - Modo prueba solo fuera de producción y sin credenciales: nunca aprueba pagos
 *   en producción por falta de configuración.
 */
const crypto = require('crypto');

const PRICE = { value: '1.99', currency: 'USD' };
const DESCRIPTION = 'Informe de astrología védica (jyotish)';

const IS_PROD = process.env.NODE_ENV === 'production';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const SECRET = process.env.PAYPAL_SECRET || '';
const PAYPAL_LIVE = process.env.PAYPAL_ENV === 'production';
const API_BASE = PAYPAL_LIVE ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

const hasCredentials = Boolean(CLIENT_ID && SECRET && CLIENT_ID !== 'sb' && !SECRET.includes('sandbox_secret'));
const TEST_MODE = !IS_PROD && !hasCredentials;

class PaymentError extends Error {
  constructor(message, status = 402, code = 'PAYMENT_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// En producción, arrancar sin credenciales reales es un error de configuración: mejor no arrancar
function assertConfigured() {
  if (IS_PROD && !hasCredentials) {
    throw new Error('PAYPAL_CLIENT_ID y PAYPAL_SECRET son obligatorios con NODE_ENV=production');
  }
  if (IS_PROD && !PAYPAL_LIVE) {
    console.warn('Aviso: NODE_ENV=production con PayPal en sandbox (PAYPAL_ENV distinto de "production").');
  }
}

let cachedToken = null;
async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.value;
  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error(`PayPal OAuth ${res.status}`);
  const json = await res.json();
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

// requestId: clave de idempotencia; con la misma clave, PayPal devuelve el resultado anterior
async function paypalRequest(method, urlPath, body, requestId = crypto.randomUUID()) {
  const res = await fetch(`${API_BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function createOrder() {
  if (TEST_MODE) return { id: `TEST-${crypto.randomBytes(8).toString('hex')}` };
  const { ok, status, json } = await paypalRequest('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      description: DESCRIPTION,
      amount: { currency_code: PRICE.currency, value: PRICE.value }
    }]
  });
  if (!ok) throw new Error(`PayPal create order ${status}: ${json.name || ''}`);
  return { id: json.id };
}

/**
 * Captura la orden y comprueba que el dinero entró por el monto correcto.
 * Devuelve { captureId, amount }. Lanza PaymentError si algo no cuadra.
 */
async function captureOrder(orderId) {
  if (!/^[A-Za-z0-9-]{6,40}$/.test(String(orderId))) {
    throw new PaymentError('Identificador de pago no válido', 400, 'INVALID_ORDER');
  }
  if (TEST_MODE) {
    if (!orderId.startsWith('TEST-')) throw new PaymentError('Orden de prueba no válida', 400, 'INVALID_ORDER');
    return { captureId: orderId, amount: { ...PRICE }, test: true };
  }
  if (orderId.startsWith('TEST-')) throw new PaymentError('Identificador de pago no válido', 400, 'INVALID_ORDER');

  // Clave fija por orden: si la respuesta se pierde y se reintenta, no se cobra dos veces
  const { ok, status, json } = await paypalRequest('POST', `/v2/checkout/orders/${orderId}/capture`, undefined, `capture-${orderId}`);
  if (!ok) {
    const issue = json.details && json.details[0] && json.details[0].issue;
    if (issue === 'ORDER_ALREADY_CAPTURED') {
      throw new PaymentError('Este pago ya fue utilizado. Si no recibiste tu informe, escríbenos con el comprobante de PayPal.', 409, 'ALREADY_CAPTURED');
    }
    if (status === 404) throw new PaymentError('Orden no encontrada en PayPal', 404, 'NOT_FOUND');
    if (issue === 'ORDER_NOT_APPROVED') throw new PaymentError('El pago no fue aprobado en PayPal', 402, 'NOT_APPROVED');
    throw new PaymentError('PayPal no pudo completar el cobro', 402, issue || 'CAPTURE_FAILED');
  }

  const capture = json.purchase_units && json.purchase_units[0] &&
    json.purchase_units[0].payments && json.purchase_units[0].payments.captures &&
    json.purchase_units[0].payments.captures[0];
  if (json.status !== 'COMPLETED' || !capture || capture.status !== 'COMPLETED') {
    throw new PaymentError('El pago quedó pendiente en PayPal; tu informe se enviará cuando se confirme. Escríbenos si tienes dudas.', 402, 'NOT_COMPLETED');
  }
  // Con la clave de idempotencia, PayPal repite la respuesta de una captura antigua en vez de
  // rechazarla. Una captura de hace más de 30 min sin registro local es una orden reutilizada.
  if (capture.create_time && Date.now() - Date.parse(capture.create_time) > 30 * 60000) {
    throw new PaymentError('Este pago ya fue utilizado. Si no recibiste tu informe, escríbenos con el comprobante de PayPal.', 409, 'ALREADY_CAPTURED');
  }
  if (capture.amount.currency_code !== PRICE.currency || capture.amount.value !== PRICE.value) {
    throw new PaymentError('El monto pagado no corresponde al precio del informe', 402, 'WRONG_AMOUNT');
  }
  return { captureId: capture.id, amount: { value: capture.amount.value, currency: capture.amount.currency_code } };
}

module.exports = {
  PRICE, TEST_MODE, IS_PROD, CLIENT_ID,
  PaymentError, assertConfigured, createOrder, captureOrder
};
