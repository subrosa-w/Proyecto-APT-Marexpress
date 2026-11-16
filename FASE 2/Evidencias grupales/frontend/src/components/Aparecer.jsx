import { useEffect, useRef, useState } from 'react'

// Envuelve cualquier contenido para que se deslice al entrar en pantalla.
// Uso: <Aparecer desde="izquierda">...</Aparecer>   (izquierda | derecha | abajo)
// "retraso" en milisegundos sirve para que varios elementos aparezcan en cascada.
function Aparecer({ children, desde = 'abajo', retraso = 0, className = '' }) {
  const ref = useRef(null) // referencia al <div> real del navegador
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // IntersectionObserver avisa cuando el elemento entra en la pantalla
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true)
          observador.disconnect() // basta con animar una vez
        }
      },
      { threshold: 0.15 },
    )
    observador.observe(ref.current)
    return () => observador.disconnect() // limpieza al salir de la página
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${retraso}ms` }}
      className={`aparecer desde-${desde} ${visible ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export default Aparecer
