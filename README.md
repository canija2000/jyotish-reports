# 🕉️ Jyotish Reports - Astrología Védica Automatizada

Plataforma web que genera reportes personalizados de astrología védica (Jyotish) con cálculos astronómicos reales y los entrega en PDF profesional por $1.99 USD.

## ✨ Características

- **Cálculos astronómicos reales** usando `astronomy-engine` (posiciones planetarias precisas)
- **Sistema sideral** con ayanamsa Lahiri
- **Casas Whole Sign** (Signo Completo)
- **27 Nakshatras** (constelaciones lunares)
- **Vimshottari Dasha** (períodos planetarios)
- **Navamsha** (D-9) incluido
- **Reporte PDF profesional** con diseño elegante
- **Integración PayPal** para pagos seguros
- **Interfaz web** responsive y atractiva

## 🚀 Instalación

```bash
# Clonar o navegar al directorio
cd ~/dev/jyotish-reports

# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

El servidor correrá en `http://localhost:3000`

## 📋 Uso

### 1. Acceder a la aplicación
Abre tu navegador en `http://localhost:3000`

### 2. Ingresar datos de nacimiento
- Nombre completo
- Fecha (día, mes, año)
- Hora y minuto de nacimiento
- Zona horaria (UTC offset)
- Lugar de nacimiento
- Coordenadas (latitud, longitud)

### 3. Pagar con PayPal
- El sistema usa PayPal Sandbox por defecto (para testing)
- Para producción, reemplaza `client-id=sb` con tu Client ID real de PayPal

### 4. Descargar reporte
- Después del pago exitoso, se genera automáticamente el PDF
- El usuario puede descargarlo inmediatamente

## 🔧 Configuración para Producción

### PayPal Real
1. Crea una cuenta en [PayPal Developer](https://developer.paypal.com/)
2. Crea una aplicación y obtén tu Client ID
3. Edita `public/index.html` y reemplaza:
   ```html
   <script src="https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID&currency=USD"></script>
   ```

### Variables de Entorno
Crea un archivo `.env` con:
```env
PORT=3000
PAYPAL_CLIENT_ID=tu_client_id_aqui
PAYPAL_SECRET=tu_secret_aqui
```

## 📊 Estructura del Reporte

El PDF incluye:

1. **Portada** con datos del consultante
2. **Datos técnicos** de la carta
3. **Ascendente (Lagna)** con interpretación detallada
4. **Planetas en signos y casas** (7 planetas + Rahu/Ketu)
5. **27 Nakshatras** con significados
6. **Sistema de casas** con análisis de distribución
7. **Vimshottari Dasha** (períodos planetarios)
8. **Síntesis e integración** final

## 🧪 Testing

### Generar reporte de prueba (sin pago)
```bash
curl -X POST http://localhost:3000/api/preview \
  -H "Content-Type: application/json" \
  -d '{
    "birthData": {
      "name": "Test User",
      "year": 1990,
      "month": 5,
      "day": 15,
      "hour": 14,
      "minute": 30,
      "timezone": -3,
      "lat": -33.45,
      "lon": -70.65,
      "place": "Santiago, Chile"
    }
  }'
```

### Generar PDF completo
```bash
curl -X POST http://localhost:3000/api/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "birthData": {
      "name": "Joaquín Bachler",
      "year": 1997,
      "month": 11,
      "day": 4,
      "hour": 13,
      "minute": 0,
      "timezone": -3,
      "lat": -33.45,
      "lon": -70.65,
      "place": "Santiago, Chile"
    },
    "paymentId": "test_123"
  }'
```

## 🌍 Despliegue

### Opción 1: Vercel (Recomendado)
```bash
npm i -g vercel
vercel
```

### Opción 2: Railway
```bash
npm i -g @railway/cli
railway init
railway up
```

### Opción 3: Heroku
```bash
heroku create jyotish-reports
git push heroku main
```

### Opción 4: VPS (DigitalOcean, AWS, etc.)
```bash
# En el servidor
git clone <repo>
cd jyotish-reports
npm install
npm start

# O usar PM2 para producción
npm i -g pm2
pm2 start src/server.js --name jyotish
```

## 💰 Monetización

- **Precio sugerido:** $1.99 USD por reporte
- **Plataforma de pago:** PayPal (fácil integración)
- **Alternativas:** Stripe, Gumroad, Payhip

### Para vender en Gumroad/Payhip:
1. Genera reportes manualmente usando la API
2. Sube los PDFs como productos digitales
3. Usa el formulario web para recopilar datos de clientes
4. Entrega los PDFs por email

## 🎯 Marketing Sugerido

- **Reddit:** r/astrology, r/Jyotish, r/slavelabour (ofertas)
- **Twitter/X:** Contenido educativo sobre Jyotish
- **Instagram:** Posts con insights astrológicos
- **YouTube:** Videos explicando conceptos védicos
- **Hacker News:** Show HN para comunidad tech

## 🔮 Mejoras Futuras

- [ ] Geocodificación automática (buscar ciudad → coordenadas)
- [ ] Más divisional charts (D-9, D-10, D-12)
- [ ] Aspectos planetarios (drishti)
- [ ] Yogas (combinaciones especiales)
- [ ] Tránsitos actuales
- [ ] Comparación de cartas (synastry)
- [ ] Reportes en inglés
- [ ] Múltiples ayanamsas (Krishnamurti, Raman, etc.)

## 📚 Tecnologías

- **Backend:** Node.js + Express
- **Astronomía:** astronomy-engine (cálculos precisos)
- **PDF:** Puppeteer (HTML a PDF)
- **Frontend:** HTML + CSS + JavaScript vanilla
- **Pagos:** PayPal JavaScript SDK

## 📄 Licencia

MIT - Libre para uso comercial y personal

## 🙏 Créditos

- Cálculos astronómicos: [astronomy-engine](https://github.com/cosinekitty/astronomy)
- Sistema Jyotish: Tradición védica milenaria de la India

---

**Om Tat Sat** 🕉️
