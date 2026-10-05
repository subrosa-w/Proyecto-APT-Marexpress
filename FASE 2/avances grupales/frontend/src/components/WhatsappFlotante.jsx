import IconoRed from './IconoRed.jsx'
import { contacto } from '../data/sitio.js'

// Botón redondo fijo abajo a la derecha, con anillos que "palpitan" a su alrededor
function WhatsappFlotante() {
  return (
    <a
      href={contacto.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center sm:bottom-8 sm:right-8 sm:h-16 sm:w-16"
    >
      {/* Dos anillos que se agrandan y desvanecen, desfasados para que el latido sea continuo */}
      <span className="absolute inset-0 animate-latido rounded-full bg-[#25D366]" />
      <span className="absolute inset-0 animate-latido rounded-full bg-[#25D366] [animation-delay:1s]" />

      <span className="relative flex h-full w-full items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/25 transition-transform duration-300 group-hover:scale-110">
        <IconoRed nombre="WhatsApp" className="text-3xl sm:text-4xl" />
      </span>

      {/* Etiqueta que aparece al pasar el mouse (solo en pantallas grandes) */}
      <span className="pointer-events-none absolute right-full mr-3 hidden translate-x-2 whitespace-nowrap rounded-lg bg-marino px-3 py-2 text-sm font-semibold text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
        ¿Cotizamos tu despacho?
      </span>
    </a>
  )
}

export default WhatsappFlotante
