# Proyecto APT Marexpress

Sistema Integral de Gestión y Seguimiento Logístico para Transportes Marexpress. Proyecto de título de Ingeniería en Informática, Duoc UC sede Puerto Montt, asignatura PTY4614 Capstone (2026).

- **Integrantes:** Raúl José Roa Astudillo y Benjamín Alonso Sandoval Vergara
- **Docente:** Aníbal Faúndez del Río

## Qué hace el sistema

Aplicación web que sigue cada orden de transporte desde su creación hasta su entrega y su cobro: cálculo de tarifa, recepción en bodega con código por bulto, manifiestos de reparto y de traspaso, entrega desde el teléfono del peoneta, cobro en caja y con Webpay (ambiente de integración), cuadre, alertas, reportes, seguimiento público y portal del cliente. Tiene cuatro roles: administrador, operador, peoneta y cliente.

## Estructura del repositorio

```
FASE 1/
├─ Evidencias Individuales/   Autoevaluaciones y diario de reflexión de cada integrante
└─ Evidencias Grupales/       Definición del proyecto, presentación, requisitos, Gantt, RACI y modelo de datos
FASE 2/
├─ Evidencias Individuales/   Diario de reflexión de cada integrante
├─ Evidencias Grupales/       Informe de avance (2.4), informe final de la fase (2.6) y Gantt
└─ Evidencias Proyecto/
   ├─ Evidencias de documentación/   Informes de código, pruebas y roles
   └─ Evidencias de sistema/
      ├─ Aplicación/          Código fuente: backend/ y frontend/
      └─ Base de datos/       Modelo de datos
FASE 3/
├─ Evidencias Individuales/   Diario de reflexión de cada integrante
└─ Evidencias Grupales/       Informe Final APT, presentación final y Gantt
```

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express 5 (API REST con 15 módulos) |
| Datos | MySQL 8, Prisma 7 (43 tablas) |
| Seguridad | JWT, bcrypt, código de un uso por correo |
| Integraciones | Webpay Plus de Transbank (integración), SMTP |
| Pruebas | Postman |

## Cómo ejecutar

El código está en `FASE 2/Evidencias Proyecto/Evidencias de sistema/Aplicación/`.

**Backend**

```bash
cd backend
npm install
cp .env.example .env        # completar con los datos de la base MySQL, JWT y correo
npx prisma generate --config prisma7.config.ts
npm run dev                 # http://localhost:3000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

La colección de Postman y sus instrucciones están en `backend/postman/`. Los cambios de la última entrega están descritos en `CAMBIOS.md`.
