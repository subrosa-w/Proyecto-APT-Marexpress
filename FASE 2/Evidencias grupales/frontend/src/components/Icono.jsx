// Ícono de Google Material Symbols. Lista de nombres: https://fonts.google.com/icons
// Uso: <Icono nombre="local_shipping" className="text-xl" relleno />
function Icono({ nombre, className = '', relleno = false }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${relleno ? 'relleno' : ''} ${className}`}
    >
      {nombre}
    </span>
  )
}

export default Icono
