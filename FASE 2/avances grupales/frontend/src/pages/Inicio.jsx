import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Contenedor from '../components/Contenedor.jsx'
import Aparecer from '../components/Aparecer.jsx'
import Icono from '../components/Icono.jsx'
import BotonWhatsapp from '../components/BotonWhatsapp.jsx'
import FranjaContacto from '../components/FranjaContacto.jsx'
import { estadisticas, servicios, pasos, imagenes } from '../data/sitio.js'

// Tarjeta de vidrio para consultar un envío (va sobre la foto del hero)
function TarjetaSeguimiento() {
  const [orden, setOrden] = useState('')
  const navigate = useNavigate()

  function consultar(evento) {
    evento.preventDefault() // evita que el navegador recargue la página
    if (!orden.trim()) return
    // Lleva a la página de seguimiento con el número en la URL: /seguimiento?orden=OT-10482
    navigate(`/seguimiento?orden=${encodeURIComponent(orden.trim())}`)
  }

  return (
    <div className="rounded-2xl border border-white/25 bg-white/10 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-verde-claro/90 text-white shadow-lg shadow-verde/40">
          <Icono nombre="package_2" relleno />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Sigue tu envío</h2>
          <p className="text-xs text-celeste">Estado en tiempo real</p>
        </div>
      </div>

      <form onSubmit={consultar} className="space-y-4">
        <div>
          <label htmlFor="orden-inicio" className="mb-2 block text-sm text-celeste">
            Número de orden
          </label>
          <input
            id="orden-inicio"
            type="text"
            placeholder="Ej. OT-10482"
            value={orden}
            onChange={(evento) => setOrden(evento.target.value)}
            className="w-full rounded-xl border border-white/30 bg-white/90 px-4 py-3 text-marino placeholder:text-gray-400 focus:border-verde-claro focus:outline-none focus:ring-4 focus:ring-verde-claro/30"
          />
        </div>
        <button type="submit" className="boton-principal w-full">
          Consultar
          <Icono nombre="arrow_forward" className="text-lg" />
        </button>
      </form>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-marino-oscuro">
      {/* Foto de fondo + degradado azul encima para que el texto se lea */}
      <img src={imagenes.camionRuta} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-linear-to-r from-marino-oscuro via-marino/90 to-marino/40" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-verde/20 blur-3xl" />

      <Contenedor className="relative grid grid-cols-1 items-center gap-12 pb-36 pt-16 lg:grid-cols-12 lg:pb-44 lg:pt-24">
        {/* Texto: entra desde la izquierda */}
        <Aparecer desde="izquierda" className="lg:col-span-7">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-celeste backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-verde-claro" />
            Santiago · Puerto Montt · Osorno · Chiloé
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Carga que llega donde <span className="text-verde-claro">tiene que llegar</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-celeste">
            Transporte, distribución y almacenaje entre la Región Metropolitana y el sur de Chile.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <BotonWhatsapp />
            <Link to="/servicios" className="boton-vidrio">
              Ver servicios
              <Icono nombre="arrow_forward" className="text-lg" />
            </Link>
          </div>
        </Aparecer>

        {/* Tarjeta: entra desde la derecha */}
        <Aparecer desde="derecha" retraso={200} className="lg:col-span-5">
          <TarjetaSeguimiento />
        </Aparecer>
      </Contenedor>
    </section>
  )
}

function Estadisticas() {
  // -mt-24: las tarjetas suben y quedan "flotando" sobre el borde del hero
  return (
    <Contenedor className="relative z-10 -mt-24">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {estadisticas.map((dato, indice) => (
          <Aparecer key={dato.valor} desde="abajo" retraso={indice * 100}>
            <div className="tarjeta tarjeta-hover h-full p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-celeste-suave text-azul">
                <Icono nombre={dato.icono} relleno />
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{dato.valor}</div>
              <div className="mt-1 text-sm text-gris-texto">{dato.detalle}</div>
            </div>
          </Aparecer>
        ))}
      </div>
    </Contenedor>
  )
}

function QueHacemos() {
  return (
    <section className="py-24">
      <Contenedor>
        <Aparecer desde="abajo" className="mb-14 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-verde">Qué hacemos</p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Un solo operador para toda tu carga</h2>
        </Aparecer>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {servicios.map((servicio, indice) => (
            <Aparecer key={servicio.titulo} desde="abajo" retraso={indice * 150}>
              <Link to="/servicios" className="tarjeta tarjeta-hover group flex h-full flex-col p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-azul to-marino text-white shadow-lg shadow-azul/30 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Icono nombre={servicio.icono} className="text-3xl" relleno />
                </div>
                <h3 className="mb-3 text-xl font-bold">{servicio.titulo}</h3>
                <p className="flex-1 text-[15px] leading-relaxed text-gris-texto">{servicio.resumen}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-verde">
                  Ver más
                  <Icono nombre="arrow_forward" className="text-base transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Aparecer>
          ))}
        </div>
      </Contenedor>
    </section>
  )
}

// Sección dividida: texto desde la izquierda, foto real de la flota desde la derecha
function NuestraFlota() {
  const puntos = ['Depósitos propios en Santiago y Puerto Montt', '90% de la flota con montacargas', 'Entrega a domicilio sin costo en Puerto Montt y Chiloé']

  return (
    <section className="overflow-hidden bg-celeste-suave py-24">
      <Contenedor className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
        <Aparecer desde="izquierda">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-verde">Nuestra flota</p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Camiones propios, de Santiago a Chiloé</h2>
          <p className="mt-5 text-lg leading-relaxed text-gris-texto">
            Controlamos cada etapa del despacho con equipo propio, para que tu carga no cambie de manos en el camino.
          </p>
          <ul className="mt-8 space-y-4">
            {puntos.map((punto) => (
              <li key={punto} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde text-white">
                  <Icono nombre="check" className="text-base" />
                </span>
                <span className="font-medium">{punto}</span>
              </li>
            ))}
          </ul>
          <Link to="/nosotros" className="boton-principal mt-10">
            Conoce la empresa
            <Icono nombre="arrow_forward" className="text-lg" />
          </Link>
        </Aparecer>

        <Aparecer desde="derecha" retraso={150} className="relative">
          {/* Marco decorativo desplazado detrás de la foto */}
          <div className="absolute -bottom-4 -right-4 h-full w-full rounded-3xl bg-linear-to-br from-verde-claro to-azul opacity-80" />
          <img
            src={imagenes.camiones}
            alt="Camiones de Transportes Marexpress"
            className="relative h-[300px] w-full rounded-3xl object-cover shadow-2xl sm:h-[400px]"
          />
          <div className="absolute -left-4 bottom-6 animate-flotar rounded-2xl bg-white px-5 py-4 shadow-xl sm:-left-8">
            <div className="text-2xl font-extrabold text-verde">4 zonas</div>
            <div className="text-xs font-medium text-gris-texto">de cobertura directa</div>
          </div>
        </Aparecer>
      </Contenedor>
    </section>
  )
}

function ComoFunciona() {
  return (
    <section className="py-24">
      <Contenedor>
        <Aparecer desde="abajo" className="mb-14 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-verde">Cómo funciona</p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Tu despacho en 4 pasos</h2>
        </Aparecer>

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {/* Línea que une los pasos (solo en pantallas grandes) */}
          <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-0.5 bg-linear-to-r from-azul via-verde-claro to-azul md:block" />
          {pasos.map((paso, indice) => (
            <Aparecer key={paso} desde="abajo" retraso={indice * 150} className="relative text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-linear-to-br from-azul to-marino text-2xl font-extrabold text-white shadow-lg shadow-azul/30">
                {indice + 1}
              </div>
              <h3 className="font-semibold">{paso}</h3>
            </Aparecer>
          ))}
        </div>
      </Contenedor>
    </section>
  )
}

function Inicio() {
  return (
    <>
      <Hero />
      <Estadisticas />
      <QueHacemos />
      <NuestraFlota />
      <ComoFunciona />
      <FranjaContacto />
    </>
  )
}

export default Inicio
