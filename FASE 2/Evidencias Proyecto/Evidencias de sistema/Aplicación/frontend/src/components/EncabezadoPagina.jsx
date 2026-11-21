import Contenedor from './Contenedor.jsx'
import Aparecer from './Aparecer.jsx'

// Banda azul con el título de cada página interna (Servicios, Cobertura, Seguimiento)
function EncabezadoPagina({ etiqueta, titulo, bajada }) {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-marino-oscuro via-marino to-azul py-16 md:py-20">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-verde/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-96 rounded-full bg-azul/40 blur-3xl" />
      <Contenedor className="relative">
        <Aparecer desde="izquierda">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-verde-claro">{etiqueta}</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">{titulo}</h1>
          <p className="mt-4 max-w-2xl text-lg text-celeste">{bajada}</p>
        </Aparecer>
      </Contenedor>
    </section>
  )
}

export default EncabezadoPagina
