/*
  VISTA: seguimiento público
  RUTA: /seguimiento
  CSS: index.css
  API: GET /api/ordenes-transporte/seguimiento/:codigo
  FUNCIONES: el visitante ve el estado real de una orden de transporte
*/
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import Contenedor from '../components/Contenedor.jsx'
import Aparecer from '../components/Aparecer.jsx'
import Icono from '../components/Icono.jsx'
import EncabezadoPagina from '../components/EncabezadoPagina.jsx'
import BotonWhatsapp from '../components/BotonWhatsapp.jsx'
import { ETAPAS } from '../data/envios.js'
import { PREFIJO_OT, codigoConPrefijo } from '../sistema/entrada.jsx'

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

// Ficha del envío encontrado: destino, bultos, kilos y fecha estimada.
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

// Movimientos de más nuevo a más antiguo. El primero va en verde porque es el estado actual.
function Historial({ movimientos }) {
  return (
    <div className="tarjeta p-6 sm:p-8">
      <h2 className="mb-6 border-b border-gray-200 pb-2 text-lg font-bold tracking-tight">
        Historial de movimientos
      </h2>
      <ol className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-gray-200">
        {movimientos.map((mov, indice) => (
          <li key={`${mov.fecha}-${indice}`} className="relative">
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
  const [texto, setTexto] = useState(ordenConsultada || PREFIJO_OT)
  const [envio, setEnvio] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [fallo, setFallo] = useState(false)

  // Cada número de la URL se consulta en las órdenes reales, no en datos de ejemplo.
  useEffect(() => {
    if (!ordenConsultada || ordenConsultada === PREFIJO_OT) {
      setEnvio(null)
      setFallo(false)
      setBuscando(false)
      return
    }

    let vigente = true
    setEnvio(null)
    setBuscando(true)
    setFallo(false)
    fetch(`/api/ordenes-transporte/seguimiento/${encodeURIComponent(ordenConsultada)}`)
      .then(async (respuesta) => {
        if (respuesta.status === 404) {
          return null
        }
        if (!respuesta.ok) {
          throw new Error('No se pudo consultar')
        }
        return respuesta.json()
      })
      .then((datos) => {
        if (vigente) {
          setEnvio(datos)
        }
      })
      .catch(() => {
        if (vigente) {
          setEnvio(null)
          setFallo(true)
        }
      })
      .finally(() => {
        if (vigente) {
          setBuscando(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [ordenConsultada])

  // Escribe el número en la URL para poder compartir el seguimiento sin perderlo al recargar.
  function consultar(evento) {
    evento.preventDefault()
    if (texto.trim() && texto.trim() !== PREFIJO_OT) setParametros({ orden: texto.trim().toUpperCase() })
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
                placeholder="Ej. OT-000066"
                value={texto}
                onFocus={(evento) => evento.target.select()}
                onChange={(evento) => setTexto(codigoConPrefijo(evento.target.value, PREFIJO_OT))}
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
            Escribe el número de la orden, por ejemplo <span className="font-mono font-semibold">OT-000066</span>.
          </p>
        )}

        {buscando && <p className="mt-10 text-sm text-gray-500">Consultando la orden...</p>}

        {fallo && (
          <div className="mt-10 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <Icono nombre="search_off" className="text-2xl text-amber-600" />
            <p className="font-semibold">No pudimos consultar el seguimiento. Inténtalo de nuevo.</p>
          </div>
        )}

        {ordenConsultada && !buscando && !fallo && !envio && (
          <div className="mt-10 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <Icono nombre="search_off" className="text-2xl text-amber-600" />
            <div>
              <p className="font-semibold">No encontramos la orden {ordenConsultada}.</p>
              <p className="mt-1 text-sm text-gray-600">Revisa que el número esté igual que en tu comprobante, por ejemplo OT-000066.</p>
            </div>
          </div>
        )}

        {envio && (
          <>
            <Aparecer desde="abajo" className="tarjeta mt-10 px-6 pb-6 pt-8 sm:px-8">
              <p className="mb-6 font-mono text-sm font-bold text-marino">{envio.numeroOT}</p>
              {envio.aviso ? <p className="mb-6 text-sm font-semibold text-amber-700">{envio.aviso}</p> : null}
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
