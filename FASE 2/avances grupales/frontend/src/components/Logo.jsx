// Logo de Marexpress: dos flechas (verde y azul) + "MAR" azul y "EXPRESS" verde.
// "claro" = versión para fondos oscuros (el azul pasa a blanco).
export function FlechasLogo({ className = 'h-9 w-9', claro = false }) {
  return (
    <svg viewBox="0 0 48 40" className={className} aria-hidden="true">
      {/* Flecha superior verde, apunta a la derecha */}
      <path d="M4 8h26V2l14 10-14 10v-6H4z" className="fill-verde-claro" />
      {/* Flecha inferior azul, apunta a la izquierda */}
      <path d="M44 24H18v-6L4 28l14 10v-6h26z" className={claro ? 'fill-white' : 'fill-marino'} />
    </svg>
  )
}

function Logo({ claro = false, subtitulo = true }) {
  return (
    <span className="flex select-none items-center gap-2.5">
      <FlechasLogo claro={claro} />
      <span className="flex flex-col">
        <span className="text-2xl font-extrabold italic leading-none tracking-tight">
          <span className={claro ? 'text-white' : 'text-marino'}>MAR</span>
          <span className="text-verde-claro">EXPRESS</span>
        </span>
        {subtitulo && (
          <span className={`mt-1 text-[10px] font-semibold uppercase tracking-widest ${claro ? 'text-celeste' : 'text-gray-500'}`}>
            Logística y Distribución
          </span>
        )}
      </span>
    </span>
  )
}

export default Logo
