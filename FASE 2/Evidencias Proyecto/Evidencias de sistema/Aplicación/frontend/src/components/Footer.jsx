import { NavLink } from 'react-router'
import Contenedor from './Contenedor.jsx'
import Logo from './Logo.jsx'
import IconoRed from './IconoRed.jsx'
import { menu, zonas, contacto, redes } from '../data/sitio.js'

function TituloColumna({ children }) {
  return <p className="mb-5 text-xs font-bold uppercase tracking-wider text-celeste/70">{children}</p>
}

function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-marino-oscuro pb-12 pt-16 text-white">
      {/* Brillo decorativo de fondo para que no se vea plano */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-azul/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-verde/10 blur-3xl" />

      <Contenedor className="relative">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo claro />

          {/* Redes sociales: cada círculo toma el color de su marca al pasar el mouse */}
          <ul className="flex gap-3">
            {redes.map((red) => (
              <li key={red.nombre}>
                <a
                  href={red.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={red.nombre}
                  title={red.nombre}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-lg ${red.color}`}
                >
                  <IconoRed nombre={red.nombre} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-12 border-b border-white/10 pb-16 sm:grid-cols-3">
          <div>
            <TituloColumna>Navegación</TituloColumna>
            <ul className="space-y-3 text-sm">
              {menu.map((item) => (
                <li key={item.ruta}>
                  <NavLink
                    to={item.ruta}
                    end
                    className="text-gray-300 transition-colors hover:text-white [&.active]:font-medium [&.active]:text-verde-claro"
                  >
                    {item.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <TituloColumna>Cobertura</TituloColumna>
            <ul className="space-y-3 text-sm text-gray-400">
              {zonas.map((zona) => (
                <li key={zona.nombre}>{zona.nombre}</li>
              ))}
            </ul>
          </div>

          <div>
            <TituloColumna>Contacto</TituloColumna>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <a href={contacto.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-[#25D366]">
                  <IconoRed nombre="WhatsApp" /> {contacto.telefono}
                </a>
              </li>
              <li>
                <a href={`https://${contacto.web}`} className="transition-colors hover:text-white">
                  {contacto.web}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="pt-8 text-xs text-gray-500">© 2026 Transportes Marexpress. Todos los derechos reservados.</p>
      </Contenedor>
    </footer>
  )
}

export default Footer
