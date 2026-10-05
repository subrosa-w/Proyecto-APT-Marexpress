import { Link } from "react-router";
import Logo from "../../components/Logo.jsx";
import { imagenes } from "../../data/sitio.js";

// Mitad izquierda del inicio de sesión y del registro: foto de la flota con los textos de la marca
export default function PanelMarca({ eyebrow, titulo, texto, pie }) {
    return (
        <section className="relative flex min-h-[340px] w-full select-none flex-col justify-between overflow-hidden bg-marino p-8 lg:min-h-screen lg:w-1/2 lg:p-14">
            <img src={imagenes.camiones} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-marino-oscuro via-marino/85 to-azul/60" />
            <div className="pointer-events-none absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-verde/25 blur-3xl" />

            <Link to="/" className="relative" aria-label="Volver al sitio de Marexpress">
                <Logo claro />
            </Link>

            <div className="relative my-10 max-w-xl lg:my-0">
                <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-celeste backdrop-blur">
                    {eyebrow}
                </p>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">{titulo}</h1>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/80">{texto}</p>
            </div>

            <p className="relative border-t border-white/15 pt-6 text-sm text-white/70">{pie}</p>
        </section>
    );
}
