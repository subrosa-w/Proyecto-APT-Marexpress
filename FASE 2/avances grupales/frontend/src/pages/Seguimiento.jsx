import { useState } from 'react'
import { useSearchParams } from 'react-router'
import Contenedor from '../components/Contenedor.jsx'
import Aparecer from '../components/Aparecer.jsx'
import Icono from '../components/Icono.jsx'
import EncabezadoPagina from '../components/EncabezadoPagina.jsx'
import BotonWhatsapp from '../components/BotonWhatsapp.jsx'
import { buscarEnvio, ETAPAS } from '../data/envios.js'

// Línea de progreso: En oficina → En tránsito → En reparto → Entregado
function LineaProgreso({ etapaActual }) {
  // Cada etapa ocupa 1/4 del ancho; la barra azul llega hasta el punto de la etapa actual.
  // El ancho es dinámico, por eso va en "style" y no en una clase de Tailwind.
  const avance = `${(etapaActual / ETAPAS.length) * 100}%`

  return (
    <div className="relative">
      <div className="absolute left-3 top-3 h-0.5 w-3/4 bg-gray-200" />
      <div className="absolute left-3 top-3 h-0.5 bg-marino" style={{ width: avance }} />

      <ol className="relative grid grid-cols-4">
        {ETAPAS.map((etapa, indice) => {
          const completada = indice < etapaActual
          const actual = indice === etapaActual
          const pendiente = indice > etapaActual

          return (
            <li key={etapa} className="flex flex-col items-start pr-2">
              <div
                className={`mb-3 flex h-6 w-6 items-center justify-center rounded-full ${
                  pendiente ? 'border-2 border-gray-300 bg-white' : 'bg-marino ring-4 ring-white'
                }`}
              >
                <span
                  className={`rounded-full ${
                    actual ? 'h-2.5 w-2.5 bg-verde' : completada ? 'h-2 w-2 bg-white' : 'h-2 w-2 bg-gray-300'
                  }`}
                />
              </div>
              <span className={`text-sm ${pendiente ? 'font-medium text-gray-400' : 'font-semibold'}`}>
                {etapa}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function DatosEnvio({ envio }) {
  const filas = [
    ['Destino', envio.destino],
    ['Bultos', envio.bultos],
    ['Kilos', envio.kilos],
    ['Fecha estimada', envio.fechaEstimada],
  ]

  return (
    <div className="tarjeta p-6 sm:p-8">
      <h2 className="mb-6 border-b border-gray-200 pb-2 text-lg font-bold tracking-tight">
        Datos del envío
      </h2>
      <dl className="divide-y divide-gray-100">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex items-baseline justify-between py-3.5">
            <dt className="text-sm text-gray-500">{etiqueta}</dt>
            <dd className="font-semibold">{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Historial({ movimientos }) {
  return (
    <div className="tarjeta p-6 sm:p-8">
      <h2 className="mb-6 border-b border-gray-200 pb-2 text-lg font-bold tracking-tight">
        Historial de movimientos
      </h2>
      <ol className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-gray-200">
        {movimientos.map((mov, indice) => (
          <li key={mov.fecha} className="relative">
            <span
              className={`absolute -left-[19px] top-1.5 h-2 w-2 rounded-full ${
                indice === 0 ? 'bg-verde' : 'bg-marino'
              }`}
            />
            <div className="font-mono text-xs font-semibold text-gray-500">{mov.fecha}</div>
            <div className="mt-0.5 text-sm font-bold">{mov.lugar}</div>
            <p className="mt-0.5 text-sm text-gray-600">{mov.detalle}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Seguimiento() {
  // El número consultado vive en la URL (?orden=...), así se puede compartir el link
  const [parametros, setParametros] = useSearchParams()
  const ordenConsultada = parametros.get('orden') ?? ''

  // Lo que el usuario está escribiendo (todavía no consultado)
  const [texto, setTexto] = useState(ordenConsultada)

  const envio = ordenConsultada ? buscarEnvio(ordenConsultada) : null

  function consultar(evento) {
    evento.preventDefault()
    if (texto.trim()) setParametros({ orden: texto.trim().toUpperCase() })
  }

  return (
    <>
      <EncabezadoPagina
        etiqueta="Seguimiento"
        titulo="Seguimiento de envío"
        bajada="Ingresa el número de orden que aparece en tu comprobante de despacho."
      />

      <Contenedor className="overflow-x-clip pb-20">
        {/* El formulario sube y "flota" sobre el borde de la banda azul */}
        <Aparecer desde="abajo" className="relative z-10 -mt-10">
          <form onSubmit={consultar} className="tarjeta flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <label htmlFor="orden" className="sr-only">
              Número de orden
            </label>
            <div className="relative flex-1">
              <Icono nombre="package_2" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
              <input
                id="orden"
                type="text"
                placeholder="Ej. OT-10482"
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                className="w-full rounded-xl border border-borde py-3 pl-12 pr-4 text-lg font-medium focus:border-verde focus:outline-none focus:ring-4 focus:ring-verde/15"
              />
            </div>
            <button type="submit" className="boton-principal">
              Consultar
              <Icono nombre="search" className="text-lg" />
            </button>
          </form>
        </Aparecer>

        {/* Tres casos posibles: aún no consulta, no se encontró, o sí se encontró */}
        {!ordenConsultada && (
          <p className="mt-10 text-sm text-gray-500">
            Prueba con <span className="font-mono font-semibold">OT-10482</span> o{' '}
            <span className="font-mono font-semibold">OT-74921</span> (datos de ejemplo).
          </p>
        )}

        {ordenConsultada && !envio && (
          <div className="mt-10 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <Icono nombre="search_off" className="text-2xl text-amber-600" />
            <div>
              <p className="font-semibold">No encontramos la orden {ordenConsultada}.</p>
              <p className="mt-1 text-sm text-gray-600">Revisa que el número esté igual que en tu comprobante, por ejemplo OT-10482.</p>
            </div>
          </div>
        )}

        {envio && (
          <>
            <Aparecer desde="abajo" className="tarjeta mt-10 px-6 pb-6 pt-8 sm:px-8">
              <LineaProgreso etapaActual={envio.etapa} />
            </Aparecer>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Aparecer desde="izquierda">
                <DatosEnvio envio={envio} />
              </Aparecer>
              <Aparecer desde="derecha" retraso={150}>
                <Historial movimientos={envio.historial} />
              </Aparecer>
            </div>
          </>
        )}

        <div className="relative mt-16 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-linear-to-br from-marino to-azul px-8 py-8 shadow-xl sm:flex-row sm:items-center">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-verde/30 blur-2xl" />
          <p className="relative text-xl font-semibold text-white">¿No encuentras tu envío?</p>
          <BotonWhatsapp variante="vidrio" className="relative text-sm" />
        </div>
      </Contenedor>
    </>
  )
}

export default Seguimiento
