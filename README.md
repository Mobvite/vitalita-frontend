# Vitalita Frontend

Aplicación para registrar el cuidado diario de adultos mayores y compartir información con sus familiares. El frontend utiliza Vue 3, Vite, PrimeVue, Pinia, Vue Router, vue-i18n y Axios. Durante esta entrega, `json-server` simula la API mediante `server/db.json`.

## Ejecutar localmente

Instala las dependencias:

```bash
npm ci
```

Inicia la API de prueba en una terminal:

```bash
npm run server
```

En otra terminal, inicia el frontend:

```bash
npm run dev
```

Abre la dirección que muestre Vite (normalmente `http://localhost:5173`). La configuración de desarrollo en `.env.development` apunta a la API local en `http://localhost:3000/api/v1`. Mantén ambos procesos activos para ver los datos de ejemplo.

## Verificar la compilación

```bash
npm run build
```

## Alcance de la demo

El repositorio incluye perfiles de cuidadora y familiar, seguimiento de salud, evidencias, dashboard, calendario, recordatorios y planes de suscripción. Los datos y pagos simulados se guardan en `server/db.json`; no constituyen cargos reales. Una integración de pagos real necesita confirmación segura en el backend y nunca debe exponer claves secretas en el frontend.
