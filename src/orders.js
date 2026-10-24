/**
 * Registro de órdenes pagadas: una orden produce un solo informe.
 *
 * Estados: "captured" (cobrado, informe aún no entregado) y "delivered" (PDF generado).
 * Se guarda en un JSON (ORDERS_FILE o data/orders.json). En la nube, montar un
 * volumen persistente en esa ruta para no perder el registro entre despliegues;
 * aun sin él, PayPal rechaza capturar dos veces la misma orden.
 */
const fs = require('fs');
const path = require('path');

const FILE = process.env.ORDERS_FILE || path.join(__dirname, '../data/orders.json');

let orders = {};
try {
  orders = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch (e) {
  if (e.code !== 'ENOENT') console.error('No se pudo leer el registro de órdenes:', e.message);
}

function persist() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(orders, null, 2));
  fs.renameSync(tmp, FILE); // escritura atómica
}

function get(orderId) {
  return orders[orderId] || null;
}

function save(orderId, data) {
  orders[orderId] = { ...(orders[orderId] || {}), ...data, updatedAt: new Date().toISOString() };
  persist();
  return orders[orderId];
}

// Serializa el trabajo por orden: dos peticiones simultáneas con la misma orden no generan dos informes
const locks = new Map();
async function withLock(orderId, fn) {
  const prev = locks.get(orderId) || Promise.resolve();
  let release;
  const current = new Promise(r => { release = r; });
  const chained = prev.then(() => current);
  locks.set(orderId, chained);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(orderId) === chained) locks.delete(orderId);
  }
}

module.exports = { get, save, withLock, FILE };
