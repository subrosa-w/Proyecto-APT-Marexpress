/*
  COMPONENTE: campana de alertas
  API: /api/alertas
  FUNCIONES: muestra los avisos pendientes del usuario
*/
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { formatearFechaHora } from "../utils.js";
import Icono from "../../components/Icono.jsx";

const rutaOrden = (rol) =>
    rol === "ADMINISTRADOR" ? "/administrador/ordenes" : "/operador/ordenes-listado";

export default function AlertasCampana() {
    const { usuario } = useAuth();
    const { pathname } = useLocation();
    const [alertas, setAlertas] = useState([]);
    const [abierto, setAbierto] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const cargar = useCallback(async () => {
        if (!["OPERADOR", "ADMINISTRADOR"].includes(usuario?.rol)) {
            return;
        }
        try {
            const datos = await api("/alertas");
            setAlertas(Array.isArray(datos?.alertas) ? datos.alertas : []);
            setMensaje("");
        } catch (error) {
            setMensaje(error.message);
        }
    }, [usuario?.rol]);

    useEffect(() => {
        cargar();
    }, [cargar, pathname]);

    useEffect(() => {
        const alCrear = () => cargar();
        const alVolver = () => {
            if (document.visibilityState === "visible") {
                cargar();
            }
        };
        window.addEventListener("marexpress-alertas", alCrear);
        document.addEventListener("visibilitychange", alVolver);
        return () => {
            window.removeEventListener("marexpress-alertas", alCrear);
            document.removeEventListener("visibilitychange", alVolver);
        };
    }, [cargar]);

    if (!["OPERADOR", "ADMINISTRADOR"].includes(usuario?.rol)) {
        return null;
    }

    const marcar = async (idAlerta) => {
        try {
            await api(`/alertas/${idAlerta}/leida`, { method: "PATCH" });
            setAlertas((prev) => prev.filter((item) => item.idAlerta !== idAlerta));
        } catch (error) {
            setMensaje(error.message);
        }
    };

    const marcarTodas = async () => {
        try {
            await api("/alertas/leidas", { method: "PATCH" });
            setAlertas([]);
        } catch (error) {
            setMensaje(error.message);
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-borde bg-white text-marino hover:bg-celeste-suave"
                aria-expanded={abierto}
                aria-label={alertas.length ? `${alertas.length} alertas sin leer` : "Alertas"}
                onClick={() => {
                    setAbierto((valor) => !valor);
                    if (!abierto) {
                        cargar();
                    }
                }}
            >
                <Icono nombre="notifications" className="text-[22px]" />
                {alertas.length > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {alertas.length > 9 ? "9+" : alertas.length}
                    </span>
                ) : null}
            </button>
            {abierto ? (
                <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-borde bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <strong className="text-sm text-marino">Alertas</strong>
                        {alertas.length > 0 ? (
                            <button type="button" className="text-xs font-semibold text-azul" onClick={marcarTodas}>
                                Marcar leídas
                            </button>
                        ) : null}
                    </div>
                    {mensaje ? <p className="mb-2 text-xs text-red-700">{mensaje}</p> : null}
                    {alertas.length === 0 ? (
                        <p className="text-sm text-texto-suave">No hay alertas pendientes.</p>
                    ) : (
                        <ul className="max-h-80 space-y-2 overflow-y-auto">
                            {alertas.map((alerta) => (
                                <li key={alerta.idAlerta} className="rounded-lg border border-borde bg-slate-50 p-2.5">
                                    <p className="text-sm font-semibold text-marino">{alerta.titulo}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">{alerta.mensaje}</p>
                                    <p className="mt-1 text-[11px] text-texto-suave">{formatearFechaHora(alerta.fechaCreacion)}</p>
                                    <div className="mt-2 flex gap-2">
                                        {alerta.orden_transporte?.numeroOT ? (
                                            <Link
                                                className="text-xs font-semibold text-azul"
                                                to={rutaOrden(usuario.rol)}
                                                onClick={() => setAbierto(false)}
                                            >
                                                Ver órdenes
                                            </Link>
                                        ) : null}
                                        <button
                                            type="button"
                                            className="text-xs font-semibold text-slate-500"
                                            onClick={() => marcar(alerta.idAlerta)}
                                        >
                                            Leída
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </div>
    );
}
