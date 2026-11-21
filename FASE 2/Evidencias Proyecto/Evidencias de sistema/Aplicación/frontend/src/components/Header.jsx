import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import Contenedor from './Contenedor.jsx'
import Icono from './Icono.jsx'
import Logo from './Logo.jsx'
import { menu } from '../data/sitio.js'

// NavLink agrega sola la clase "active" a la página actual.
// .link-barra (en index.css) dibuja la barrita verde que crece al pasar el mouse;
// [&.active]:... aplica estilos solo cuando el link tiene la clase "active".
const claseLink =
  'link-barra text-gray-600 hover:text-marino [&.active]:font-semibold [&.active]:text-marino'

function Header() {
  // Estado: ¿está abierto el menú en celular?
  const [menuAbierto, setMenuAbierto] = useState(false)
  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-borde/60 bg-white/80 backdrop-blur-lg">
      <Contenedor className="flex h-20 items-center justify-between">
        <Link to="/" aria-label="Marexpress, ir al inicio">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
          {menu.map((item) => (
            <NavLink key={item.ruta} to={item.ruta} end className={claseLink}>
              {item.texto}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            to="/acceso"
            className="link-barra hidden whitespace-nowrap text-sm font-medium text-gray-600 hover:text-marino sm:inline-block"
          >
            Acceso al sistema
          </Link>
          <Link to="/seguimiento" className="boton-principal hidden whitespace-nowrap px-4 py-2 text-sm sm:inline-flex">
            <Icono nombre="package_2" className="text-lg" />
            Rastrear envío
          </Link>

          {/* Botón hamburguesa: solo visible en pantallas chicas */}
          <button
            type="button"
            className="text-marino lg:hidden"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <Icono nombre={menuAbierto ? 'close' : 'menu'} className="text-3xl" />
          </button>
        </div>
      </Contenedor>

      {/* Menú desplegable en celular: solo se dibuja si menuAbierto es true */}
      {menuAbierto && (
        <nav className="border-t border-borde bg-white lg:hidden">
          <Contenedor className="flex flex-col items-start gap-4 py-6 text-base font-medium">
            {menu.map((item) => (
              <NavLink key={item.ruta} to={item.ruta} end className={claseLink} onClick={cerrarMenu}>
                {item.texto}
              </NavLink>
            ))}
            <Link to="/acceso" className="link-barra text-gray-600" onClick={cerrarMenu}>
              Acceso al sistema
            </Link>
            <Link to="/seguimiento" className="boton-principal w-full" onClick={cerrarMenu}>
              <Icono nombre="package_2" className="text-lg" />
              Rastrear envío
            </Link>
          </Contenedor>
        </nav>
      )}
    </header>
  )
}

export default Header
