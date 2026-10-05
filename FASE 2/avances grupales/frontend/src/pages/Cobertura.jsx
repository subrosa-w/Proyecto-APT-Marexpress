import Contenedor from '../components/Contenedor.jsx'
import Aparecer from '../components/Aparecer.jsx'
import Icono from '../components/Icono.jsx'
import EncabezadoPagina from '../components/EncabezadoPagina.jsx'
import FranjaContacto from '../components/FranjaContacto.jsx'
import { zonas, imagenes } from '../data/sitio.js'

function Cobertura() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Cobertura"
        titulo="Dónde llegamos"
        bajada="Conexión directa entre la Región Metropolitana y el sur de Chile."
      />

      <section className="overflow-hidden py-20 md:py-24">
        <Contenedor className="grid grid-cols-1 items-start gap-14 lg:grid-cols-12">
          {/* Zonas como una ruta vertical: cada tarjeta entra desde la izquierda, en cascada */}
          <div className="relative space-y-5 lg:col-span-7">
            <div className="absolute bottom-8 left-[27px] top-8 w-0.5 bg-linear-to-b from-azul via-verde-claro to-verde" />
            {zonas.map((zona, indice) => (
              <Aparecer key={zona.nombre} desde="izquierda" retraso={indice * 120}>
                <div className="tarjeta tarjeta-hover relative flex items-start gap-5 p-5 pl-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-white bg-linear-to-br from-azul to-marino text-white shadow-md">
                    <Icono nombre="location_on" className="text-xl" relleno />
                  </span>
                  <div>
                    <h2 className="mb-1 text-xl font-bold tracking-tight">{zona.nombre}</h2>
                    <p className="leading-relaxed text-gray-600">{zona.detalle}</p>
                  </div>
                </div>
              </Aparecer>
            ))}
          </div>

          {/* Foto: entra desde la derecha */}
          <Aparecer desde="derecha" retraso={200} className="relative lg:col-span-5">
            <div className="absolute -bottom-4 -right-4 h-full w-full rounded-3xl bg-linear-to-br from-verde-claro to-azul opacity-70" />
            <img
              src={imagenes.carretera}
              alt="Carretera Ruta 5 Sur en el sur de Chile"
              className="relative h-[380px] w-full rounded-3xl object-cover shadow-2xl lg:h-[540px]"
            />
          </Aparecer>
        </Contenedor>
      </section>

      <FranjaContacto />
    </>
  )
}

export default Cobertura
