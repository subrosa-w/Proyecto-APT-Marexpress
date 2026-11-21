import IconoRed from './IconoRed.jsx'
import { contacto } from '../data/sitio.js'

// Abre WhatsApp directo con el mensaje ya escrito.
// variante="vidrio" para fondos oscuros, "principal" (verde) para fondos claros.
function BotonWhatsapp({ variante = 'principal', className = '' }) {
  return (
    <a
      href={contacto.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${variante === 'vidrio' ? 'boton-vidrio' : 'boton-principal'} text-center sm:whitespace-nowrap ${className}`}
    >
      <IconoRed nombre="WhatsApp" className="text-xl" />
      Escríbenos por WhatsApp
    </a>
  )
}

export default BotonWhatsapp
