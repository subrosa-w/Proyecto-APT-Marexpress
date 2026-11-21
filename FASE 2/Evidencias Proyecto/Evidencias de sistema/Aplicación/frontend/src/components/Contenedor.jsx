// Centra el contenido y le da el mismo ancho máximo y márgenes en todas las páginas.
// "children" es lo que se escribe entre <Contenedor> y </Contenedor>.
function Contenedor({ children, className = '' }) {
  return <div className={`mx-auto max-w-6xl px-6 ${className}`}>{children}</div>
}

export default Contenedor
