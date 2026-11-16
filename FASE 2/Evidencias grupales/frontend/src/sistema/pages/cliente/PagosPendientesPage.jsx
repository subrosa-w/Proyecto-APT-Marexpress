import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import Message from "../../components/Message.jsx";
import { formatearCLP } from "../../utils.js";
import { useCliente } from "./clienteContexto.jsx";
import { obtenerPendientesPago, pagarOrdenes } from "./clienteDatos.js";

// Mensaje según cómo volvió el cliente desde Webpay (?estado=ok|rechazado|anulado|error)
const mensajeRetorno = (estado, cantidad) => {
    if (estado === "ok") {
        const texto = Number(cantidad) === 1 ? "La OT quedó pagada" : `Las ${cantidad || ""} OT quedaron pagadas`;
        return { texto: `Pago autorizado por Webpay. ${texto} y se descontó de tu cuenta corriente.`, tipo: "success" };
    }
    if (estado === "rechazado") {
        return { texto: "Webpay rechazó el pago. Tus OT siguen pendientes; puedes intentarlo de nuevo.", tipo: "error" };
    }
    if (estado === "anulado") {
        return { texto: "Cancelaste el pago en Webpay. Tus OT siguen pendientes.", tipo: "info" };
    }
    if (estado === "error") {
        return { texto: "No se pudo confirmar el pago con Webpay. Revisa tus pendientes e inténtalo de nuevo.", tipo: "error" };
    }
    return null;
};

// Mismo envío a Webpay que usa el operador en PagosOtPage
const irAWebpay = (url, token) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    const campo = document.createElement("input");
    campo.type = "hidden";
    campo.name = "token_ws";
    campo.value = token;
    form.appendChild(campo);
    document.body.appendChild(form);
    form.submit();
};

// Solo la fecha (sin hora), en formato chileno
const fecha = (valor) =>
    valor ? new Intl.DateTimeFormat("es-CL", { dateStyle: "short" }).format(new Date(valor)) : "—";

export default function PagosPendientesPage() {
    const { cuentaCorriente, recargarPerfil } = useCliente();
    const [params, setParams] = useSearchParams();
    // Si viene de vuelta desde Webpay, el mensaje se arma una sola vez al entrar
    const [retorno] = useState(() => mensajeRetorno(params.get("estado"), params.get("cantidad")));
    const [pendientes, setPendientes] = useState(null);
    const [seleccion, setSeleccion] = useState([]);
    const [porPagar, setPorPagar] = useState(null); // OT esperando confirmación
    const [pagando, setPagando] = useState(false);
    const [mensaje, setMensaje] = useState(retorno?.texto || "");
    const [tipo, setTipo] = useState(retorno?.tipo || "info");

    // Tras volver de Webpay se limpia la URL y se recarga el crédito disponible
    useEffect(() => {
        if (retorno) {
            setParams({}, { replace: true });
            recargarPerfil();
        }
    }, [retorno, setParams, recargarPerfil]);

    useEffect(() => {
        let vigente = true;
        obtenerPendientesPago()
            .then((datos) => {
                if (!vigente) return;
                // Las atrasadas primero, y entre ellas las con más días de atraso
                setPendientes([...datos].sort((a, b) => Number(b.atrasada) - Number(a.atrasada) || b.diasAtraso - a.diasAtraso));
                setSeleccion([]);
            })
            .catch((error) => {
                if (!vigente) return;
                setMensaje(error.message);
                setTipo("error");
            });
        return () => {
            vigente = false;
        };
    }, []);

    const lista = pendientes || [];
    const atrasadas = lista.filter((item) => item.atrasada);
    const suma = (items) => items.reduce((total, item) => total + Number(item.monto || 0), 0);
    const seleccionadas = lista.filter((item) => seleccion.includes(item.idOrden));
    const disponible = Number(cuentaCorriente?.disponible || 0);

    const alternar = (idOrden) =>
        setSeleccion((prev) => (prev.includes(idOrden) ? prev.filter((id) => id !== idOrden) : [...prev, idOrden]));

    const confirmarPago = async () => {
        setPagando(true);
        setMensaje("");
        try {
            const datos = await pagarOrdenes(porPagar.map((item) => item.idOrden));
            if (!datos?.url || !datos?.token) {
                throw new Error("Webpay no devolvió la URL de pago");
            }
            // La página se va a Webpay: "pagando" queda activo hasta salir
            irAWebpay(datos.url, datos.token);
        } catch (error) {
            setMensaje(error.message);
            setTipo("error");
            setPagando(false);
        }
    };

    return (
        <>
            <section className="admin-kpis">
                <article className="admin-kpi">
                    <span>Pendiente de pago</span>
                    <strong>{formatearCLP(suma(lista))}</strong>
                    <small>{lista.length} OT por pagar</small>
                </article>
                <article className="admin-kpi">
                    <span>Atrasadas</span>
                    <strong className={atrasadas.length ? "text-red-600!" : ""}>{formatearCLP(suma(atrasadas))}</strong>
                    <small>{atrasadas.length} OT con el plazo vencido</small>
                </article>
                <article className="admin-kpi">
                    <span>Crédito disponible</span>
                    <strong>{formatearCLP(disponible)}</strong>
                    <small>De un límite de {formatearCLP(cuentaCorriente?.limiteCredito)}</small>
                </article>
            </section>

            <section className="cliente-card">
                <header className="admin-card-header">
                    <div>
                        <span>CUENTA CORRIENTE</span>
                        <h2>Órdenes pendientes de pago</h2>
                    </div>
                    <div className="mx-acciones">
                        <button type="button" className="button-secondary" disabled={!atrasadas.length || pagando} onClick={() => setPorPagar(atrasadas)}>
                            Pagar atrasadas ({atrasadas.length})
                        </button>
                        <button type="button" className="button-primary" disabled={!seleccionadas.length || pagando} onClick={() => setPorPagar(seleccionadas)}>
                            Pagar seleccionadas ({seleccionadas.length})
                        </button>
                    </div>
                </header>

                <Message texto={mensaje} tipo={tipo} />
                <p className="mx-note">
                    Cada OT se paga dentro de {cuentaCorriente?.diasCredito || 30} días desde su emisión. Las atrasadas aparecen primero.
                </p>

                {porPagar ? (
                    <div className="ot-alta">
                        <h3>Confirmar pago</h3>
                        <p className="text-sm text-slate-700">
                            Vas a pagar {porPagar.length} OT ({porPagar.map((item) => item.numeroOT).join(", ")}) por un total de{" "}
                            <strong className="text-marino">{formatearCLP(suma(porPagar))}</strong> con Webpay.
                        </p>
                        <div className="mx-form-actions">
                            <button type="button" className="button-primary" onClick={confirmarPago} disabled={pagando}>
                                {pagando ? "Procesando..." : "Confirmar y pagar"}
                            </button>
                            <button type="button" className="button-secondary" onClick={() => setPorPagar(null)} disabled={pagando}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th><span className="sr-only">Seleccionar</span></th>
                                <th>N° OT</th>
                                <th>Destino</th>
                                <th>Emitida</th>
                                <th>Vence</th>
                                <th>Estado</th>
                                <th>Monto</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendientes === null && tipo !== "error" ? (
                                <tr><td colSpan={8} className="mx-empty">Cargando pendientes...</td></tr>
                            ) : lista.length === 0 ? (
                                <tr><td colSpan={8} className="mx-empty">No tienes órdenes pendientes de pago.</td></tr>
                            ) : lista.map((item) => (
                                <tr key={item.idOrden}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={seleccion.includes(item.idOrden)}
                                            onChange={() => alternar(item.idOrden)}
                                            aria-label={`Seleccionar ${item.numeroOT}`}
                                        />
                                    </td>
                                    <td><strong className="font-mono text-marino">{item.numeroOT}</strong></td>
                                    <td>{item.destino || "—"}</td>
                                    <td>{fecha(item.fechaEmision)}</td>
                                    <td>{fecha(item.fechaVencimiento)}</td>
                                    <td>
                                        {item.atrasada ? (
                                            <span className="inline-flex rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                                                Atrasada {item.diasAtraso} {item.diasAtraso === 1 ? "día" : "días"}
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                                                Al día
                                            </span>
                                        )}
                                    </td>
                                    <td><strong>{formatearCLP(item.monto)}</strong></td>
                                    <td>
                                        <button type="button" className="button-secondary" disabled={pagando} onClick={() => setPorPagar([item])}>
                                            Pagar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
