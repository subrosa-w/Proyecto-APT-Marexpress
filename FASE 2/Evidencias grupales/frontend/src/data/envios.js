// DATOS DE PRUEBA. Cuando exista el backend, buscarEnvio() debe
// reemplazarse por una llamada a la API (fetch) y el resto de la página no cambia.

export const ETAPAS = ['En oficina', 'En tránsito', 'En reparto', 'Entregado']

const envios = {
  'OT-10482': {
    etapa: 2, // índice dentro de ETAPAS → "En reparto"
    destino: 'Puerto Varas',
    bultos: 3,
    kilos: '50,5',
    fechaEstimada: '18/09/2026',
    historial: [
      { fecha: '18/09/2026 · 08:30 hrs', lugar: 'Puerto Montt', detalle: 'En reparto hacia Puerto Varas' },
      { fecha: '17/09/2026 · 21:15 hrs', lugar: 'Terminal Puerto Montt', detalle: 'Recepción y clasificación' },
      { fecha: '16/09/2026 · 18:00 hrs', lugar: 'En tránsito Ruta 5 Sur', detalle: 'Salida desde Santiago' },
      { fecha: '15/09/2026 · 11:30 hrs', lugar: 'Santiago', detalle: 'Recepción en depósito' },
    ],
  },
  'OT-74921': {
    etapa: 1,
    destino: 'Puerto Montt',
    bultos: 2,
    kilos: '1.450',
    fechaEstimada: '20/09/2026',
    historial: [
      { fecha: '19/09/2026 · 06:10 hrs', lugar: 'En tránsito Ruta 5 Sur', detalle: 'Salida desde Santiago' },
      { fecha: '18/09/2026 · 16:45 hrs', lugar: 'Santiago', detalle: 'Recepción en depósito' },
    ],
  },
}

export function buscarEnvio(numeroOrden) {
  const clave = numeroOrden.trim().toUpperCase()
  return envios[clave] ?? null
}
