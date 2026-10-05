import Contenedor from '../components/Contenedor.jsx'
import Aparecer from '../components/Aparecer.jsx'
import Icono from '../components/Icono.jsx'
import EncabezadoPagina from '../components/EncabezadoPagina.jsx'
import FranjaContacto from '../components/FranjaContacto.jsx'
import { servicios } from '../data/sitio.js'

// Un bloque imagen + texto. Si "invertido" es true, la imagen va a la derecha.
// La imagen y el texto entran desde lados opuestos.
function BloqueServicio({ servicio, invertido }) {
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Aparecer desde={invertido ? 'derecha' : 'izquierda'} className={`relative ${invertido ? 'lg:order-2' : ''}`}>
        <div className={`absolute -bottom-4 h-full w-full rounded-3xl bg-linear-to-br from-azul/30 to-verde-claro/30 ${invertido ? '-left-4' : '-right-4'}`} />
        <img
          src={servicio.imagen}
          alt={servicio.titulo}
          className="relative h-[300px] w-full rounded-3xl object-cover shadow-2xl md:h-[400px]"
        />
      </Aparecer>

      <Aparecer desde={invertido ? 'izquierda' : 'derecha'} retraso={150}>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-azul to-marino text-white shadow-lg shadow-azul/30">
          <Icono nombre={servicio.icono} className="text-3xl" relleno />
        </div>
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight">{servicio.tituloLargo ?? servicio.titulo}</h2>
        <p className="mb-8 text-lg leading-relaxed text-gris-texto">{servicio.descripcion}</p>
        <ul className="space-y-3">
          {servicio.puntos.map((punto) => (
            <li key={punto} className="tarjeta flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verde text-white">
                <Icono nombre="check" className="text-sm" />
              </span>
              <span>{punto}</span>
            </li>
          ))}
        </ul>
      </Aparecer>
    </div>
  )
}

function Servicios() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Servicios"
        titulo="Nuestros servicios"
        bajada="Soluciones de transporte, distribución y almacenaje entre Santiago y el sur de Chile."
      />

      <section className="overflow-hidden py-20 md:py-28">
        <Contenedor className="space-y-24 md:space-y-32">
          {servicios.map((servicio, indice) => (
            <BloqueServicio key={servicio.titulo} servicio={servicio} invertido={indice % 2 === 1} />
          ))}
        </Contenedor>
      </section>

      <FranjaContacto />
    </>
  )
}

export default Servicios
