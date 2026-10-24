/**
 * Validación de los datos de nacimiento que llegan del formulario.
 * Devuelve { value } con los datos limpios o { error } con un mensaje para el usuario.
 */
function int(v) { return typeof v === 'number' ? v : Number(String(v).trim()); }

function validateBirthData(input) {
  if (!input || typeof input !== 'object') return { error: 'Faltan los datos de nacimiento' };

  const name = typeof input.name === 'string' ? input.name.replace(/\s+/g, ' ').trim() : '';
  if (!name || name.length > 80) return { error: 'Escribe un nombre de hasta 80 caracteres' };

  const place = typeof input.place === 'string' ? input.place.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  const year = int(input.year), month = int(input.month), day = int(input.day);
  const hour = int(input.hour), minute = int(input.minute);
  const timezone = Number(input.timezone), lat = Number(input.lat), lon = Number(input.lon);

  if (![year, month, day, hour, minute].every(Number.isInteger)) return { error: 'Fecha u hora incompletas' };
  if (year < 1800 || year > 2100) return { error: 'El año debe estar entre 1800 y 2100' };
  const d = new Date(Date.UTC(year, month - 1, day));
  if (month < 1 || month > 12 || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return { error: 'La fecha no existe' };
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return { error: 'La hora no es válida' };
  if (!Number.isFinite(timezone) || timezone < -12 || timezone > 14) return { error: 'La zona horaria no es válida' };
  // ±90 exactos rompen el cálculo del ascendente (tan de la latitud)
  if (!Number.isFinite(lat) || Math.abs(lat) >= 89.9) return { error: 'La latitud no es válida' };
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return { error: 'La longitud no es válida' };

  return {
    value: { name, place, year, month, day, hour, minute, timezone, lat, lon, lang: input.lang === 'en' ? 'en' : 'es' }
  };
}

module.exports = { validateBirthData };
