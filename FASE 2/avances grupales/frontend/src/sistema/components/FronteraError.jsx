/*
  COMPONENTE: frontera de error
  FUNCIONES: si una vista falla, muestra el aviso en vez de dejar la pantalla en blanco
*/
import { Component } from "react";
import { useLocation } from "react-router";

class Frontera extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidUpdate(prev) {
        if (prev.ruta !== this.props.ruta && this.state.error) {
            this.setState({ error: null });
        }
    }

    render() {
        if (!this.state.error) {
            return this.props.children;
        }

        return (
            <main className="mx-contenido flex min-h-screen items-center justify-center p-6">
                <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-700">Fallo de pantalla</p>
                    <h1 className="mt-1 text-2xl font-extrabold text-marino">Esta vista no pudo mostrarse</h1>
                    <p className="mt-3 text-sm text-slate-700">
                        La ruta que falló es <strong>{this.props.ruta}</strong>.
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{this.state.error.message}</p>
                    <button
                        type="button"
                        className="button-primary mt-5"
                        onClick={() => window.location.assign(this.props.ruta || "/")}
                    >
                        Reintentar esta ruta
                    </button>
                </section>
            </main>
        );
    }
}

export default function FronteraError({ children }) {
    const { pathname } = useLocation();
    return <Frontera ruta={pathname}>{children}</Frontera>;
}
