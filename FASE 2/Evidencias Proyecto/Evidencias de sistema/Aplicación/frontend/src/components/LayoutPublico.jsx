import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import WhatsappFlotante from './WhatsappFlotante.jsx'

// Molde de las páginas públicas: Header arriba, Footer abajo,
// y en <Outlet /> se dibuja la página que corresponde a la URL.
function LayoutPublico() {
  const { pathname } = useLocation()

  // Al cambiar de página, volver al inicio del scroll
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsappFlotante />
    </div>
  )
}

export default LayoutPublico
