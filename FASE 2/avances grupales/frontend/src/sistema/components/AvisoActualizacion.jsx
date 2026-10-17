/*
  COMPONENTE: aviso de datos nuevos
  FUNCIONES: pide recargar cuando el servidor tiene una versión más nueva
*/
import { useEffect, useState } from "react";

export const ACTUALIZACION = {
    id: "2026.10.16-1",
    titulo: "Actualización del sistema",
    fecha: "16 de octubre de 2026",
    puntos: [
        "En informes, el campo de la izquierda cambia según el filtro: día, semana, mes o año.",
        "El informe de camiones se puede hacer de un camión o del total, y el Excel trae vueltas, manifiestos, órdenes, kilos, m³ y el peoneta de cada manifiesto.",
        "En ese informe solo entran manifiestos cerrados: cada orden entregada o con su rechazo. No entran los que están en creación ni pendientes.",
        "En el tarifario el retiro se ve como S, M y L. El precio base de un tramo es opcional y queda visible el historial de precios.",
        "Cuenta corriente muestra clientes con deuda, al día, frecuentes y posibles dadas de baja.",
        "Se quitó Facturación. El administrador puede crear órdenes de transporte desde su menú.",
        "El inicio y los informes muestran el mes completo, con gráficos y el movimiento de cada día."
    ]
};

const clave = "marexpress_actualizacion";

export default function AvisoActualizacion() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(localStorage.getItem(clave) !== ACTUALIZACION.id);
    }, []);

    if (!visible) {
        return null;
    }

    const cerrar = () => {
        localStorage.setItem(clave, ACTUALIZACION.id);
        setVisible(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-marino-oscuro/70 p-4">
            <section
                className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
                role="dialog"
                aria-modal="true"
                aria-labelledby="aviso-actualizacion"
            >
                <p className="text-xs font-bold uppercase tracking-wider text-verde">Novedades</p>
                <h2 id="aviso-actualizacion" className="mt-1 text-2xl font-extrabold text-marino">
                    {ACTUALIZACION.titulo}
                </h2>
                <p className="mt-1 text-sm text-texto-suave">{ACTUALIZACION.fecha}</p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                    {ACTUALIZACION.puntos.map((punto) => (
                        <li key={punto} className="rounded-lg bg-slate-50 px-3 py-2">{punto}</li>
                    ))}
                </ul>
                <button type="button" className="button-primary mt-6 w-full" onClick={cerrar}>
                    Entendido, entrar al sistema
                </button>
            </section>
        </div>
    );
}
