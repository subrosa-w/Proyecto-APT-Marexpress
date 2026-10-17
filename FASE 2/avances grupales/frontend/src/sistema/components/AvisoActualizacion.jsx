/*
  COMPONENTE: aviso de datos nuevos
  FUNCIONES: pide recargar cuando el servidor tiene una versión más nueva
*/
import { useEffect, useState } from "react";

export const ACTUALIZACION = {
    id: "2026.10.17-1",
    titulo: "Actualización del sistema",
    fecha: "17 de octubre de 2026",
    puntos: [
        "Al crear un manifiesto se elige reparto o traspaso. El traspaso mueve la carga a otra bodega y no cobra.",
        "Al cerrar el manifiesto se descarga el PDF: órdenes, destino, teléfono, dirección, bultos, kilos, m³, valor y pago.",
        "El peoneta declara el cobro en la entrega. La orden queda por cuadrar, no pagada. En transferencia y tarjeta puede adjuntar el voucher.",
        "En Caja y retiro, el operador o el administrador abre la orden y ve si está impaga, pagada, por cuadrar o en cuenta corriente antes de soltar la caja. Si está impaga, cobra en efectivo, tarjeta o transferencia.",
        "El administrador recepciona el reparto en ruta, orden por orden, con el detalle del manifiesto. En cada una elige el método y la da de baja.",
        "Al terminar ese cuadre se descarga otro PDF, con el total por método de pago.",
        "La planilla del mes, solo del administrador, se descarga en Excel: cliente, orden, fecha, estado, método, flete, retiro, recargo, neto, IVA y total.",
        "Manifiestos queda en tres pasos: el listado de la bodega, crear un viaje nuevo y recepcionar el que ya está en ruta."
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
