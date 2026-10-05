import Contenedor from './Contenedor.jsx'
import Aparecer from './Aparecer.jsx'
import BotonWhatsapp from './BotonWhatsapp.jsx'
import { contacto } from '../data/sitio.js'

// Franja "¿Necesitas cotizar un despacho?" que aparece al final de las páginas públicas
function FranjaContacto() {
  return (
    <section className="relative w-full overflow-hidden bg-linear-to-br from-marino via-marino to-azul py-20">
      {/* Círculos de luz decorativos */}
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-verde/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-azul/40 blur-3xl" />

      <Contenedor className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <Aparecer desde="izquierda">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">¿Necesitas cotizar un despacho?</h2>
          <p className="mt-2 text-lg text-celeste">Respondemos al {contacto.telefono}</p>
        </Aparecer>
        <Aparecer desde="derecha">
          <BotonWhatsapp variante="vidrio" className="px-8 py-4 text-base" />
        </Aparecer>
      </Contenedor>
    </section>
  )
}

export default FranjaContacto
