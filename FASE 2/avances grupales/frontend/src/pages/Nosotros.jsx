import Contenedor from '../components/Contenedor.jsx'
import Aparecer from '../components/Aparecer.jsx'
import Icono from '../components/Icono.jsx'
import FranjaContacto from '../components/FranjaContacto.jsx'
import { imagenes } from '../data/sitio.js'

const valores = [
  { icono: 'warehouse', titulo: 'Depósitos propios', texto: 'En Santiago y Puerto Montt, para controlar cada etapa del despacho.' },
  { icono: 'route', titulo: 'Ruta directa', texto: 'Conexión continua entre la Región Metropolitana y el sur de Chile.' },
  { icono: 'home_pin', titulo: 'Hasta tu puerta', texto: 'Entrega a domicilio sin costo en Puerto Montt y Chiloé.' },
]

function Nosotros() {
  return (
    <>
      {/* Foto real de los camiones a todo el ancho, con el título encima */}
      <section className="relative h-[420px] w-full overflow-hidden bg-marino-oscuro md:h-[520px]">
        <img src={imagenes.camiones} alt="Camiones de Transportes Marexpress" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-end bg-linear-to-t from-marino-oscuro via-marino/50 to-transparent">
          <Contenedor className="w-full pb-14 md:pb-20">
            <Aparecer desde="izquierda">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-verde-claro">Nosotros</p>
              <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">Transportes Marexpress</h1>
            </Aparecer>
          </Contenedor>
        </div>
      </section>

      {/* Quiénes somos: texto a la izquierda, tarjetas de valores a la derecha */}
      <section className="overflow-hidden py-24">
        <Contenedor className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <Aparecer desde="izquierda">
            <h2 className="mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Quiénes somos</h2>
            <p className="text-lg leading-relaxed text-gray-700">
              Somos una empresa chilena especializada en transporte terrestre y distribución de carga consolidada y
              paletizada, conectando de manera directa y continua la Región Metropolitana con las principales ciudades y
              localidades del sur de Chile.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Nuestra estructura está diseñada para brindar cobertura confiable en Santiago, Puerto Montt, Osorno y la Isla
              de Chiloé, con entrega directa a domicilio sin costos adicionales en el territorio austral.
            </p>
          </Aparecer>

          <div className="space-y-5">
            {valores.map((valor, indice) => (
              <Aparecer key={valor.titulo} desde="derecha" retraso={indice * 150}>
                <div className="tarjeta tarjeta-hover flex items-start gap-5 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-verde-claro to-verde text-white shadow-lg shadow-verde/30">
                    <Icono nombre={valor.icono} relleno />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{valor.titulo}</h3>
                    <p className="mt-1 text-gris-texto">{valor.texto}</p>
                  </div>
                </div>
              </Aparecer>
            ))}
          </div>
        </Contenedor>
      </section>

      {/* El dato de la flota */}
      <section className="relative overflow-hidden bg-celeste-suave py-24">
        <Contenedor className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Aparecer desde="izquierda" className="relative">
            <div className="absolute -bottom-4 -left-4 h-full w-full rounded-3xl bg-linear-to-br from-azul to-verde-claro opacity-70" />
            <img src={imagenes.almacenaje} alt="Carga paletizada en bodega" className="relative h-[320px] w-full rounded-3xl object-cover shadow-2xl" />
          </Aparecer>
          <Aparecer desde="derecha" retraso={150}>
            <span className="bg-linear-to-r from-azul to-verde bg-clip-text text-8xl font-black leading-none tracking-tight text-transparent">
              90%
            </span>
            <p className="mt-4 text-2xl font-bold leading-snug md:text-3xl">de nuestra flota cuenta con montacargas</p>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Esto permite realizar faenas de carga y descarga autónomas en cualquier punto de entrega o recepción, sin
              depender de equipos ni personal adicional provistos por el cliente.
            </p>
          </Aparecer>
        </Contenedor>
      </section>

      <FranjaContacto />
    </>
  )
}

export default Nosotros
