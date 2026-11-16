import logoMarexpress from '../assets/logo-marexpress.png'

export function FlechasLogo({ className = 'h-10 w-auto' }) {
  return (
    <img src={logoMarexpress} alt="" className={`${className} object-contain`} />
  )
}

function Logo() {
  return (
    <span className="inline-flex select-none">
      <img src={logoMarexpress} alt="Marexpress, logística y distribución" className="h-14 w-auto" />
    </span>
  )
}

export default Logo
