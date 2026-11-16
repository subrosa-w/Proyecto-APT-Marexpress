import { FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa6'

// Relaciona el nombre de la red (como viene en data/sitio.js) con su ícono
const iconos = {
  WhatsApp: FaWhatsapp,
  Facebook: FaFacebookF,
  Instagram: FaInstagram,
  LinkedIn: FaLinkedinIn,
}

function IconoRed({ nombre, className = '' }) {
  const Componente = iconos[nombre]
  return <Componente aria-hidden="true" className={className} />
}

export default IconoRed
