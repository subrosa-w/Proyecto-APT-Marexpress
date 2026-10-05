import { Link } from 'react-router'

function NoEncontrada() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm font-bold text-verde">404</p>
      <h1 className="text-3xl font-bold">Esta página no existe</h1>
      <Link to="/" className="rounded-md bg-verde px-5 py-2.5 font-semibold text-white hover:bg-verde-oscuro">
        Volver al inicio
      </Link>
    </main>
  )
}

export default NoEncontrada
