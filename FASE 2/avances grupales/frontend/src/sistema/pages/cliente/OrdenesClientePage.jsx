import { useEffect, useState } from "react";
import Message from "../../components/Message.jsx";
import {
    etiquetaComuna,
    etiquetaMedidas,
    etiquetaTipoCarga,
    formatearCLP,
    formatearFechaHora,
    formatearKg,
    formatearM3,
    lineaTiempoOt,
    resumirDetallesCarga,
    textoResumenTipos
} from "../../utils.js";
import { useCliente } from "./clienteContexto.jsx";
import { obtenerOrden, obtenerOrdenes, pedirDevolucion } from "./clienteDatos.js";
import { esHistorial, estadoPagoDe, textoEstadoOt } from "./clienteEstados.js";
import InsigniaOt from "./InsigniaOt.jsx";

/*
  Órdenes de transporte del cliente.
  vista="curso"     → cliente normal, "Mis órdenes": OT que aún no terminan
  vista="historial" → cliente normal, "Historial": OT entregadas o anuladas
  vista="todas"     → cliente con cuenta corriente: pestañas En curso / Historial / Todas
*/

const DIA = 24 * 60 * 60 * 1000;
const periodos = [
    { valor: "30", texto: "Últimos 30 días" },
    { valor: "90", texto: "Últimos 90 días" },
    { valor: "todo", texto: "Todo el historial" }
];

const origenDe = (orden) => orden.comuna_orden_transporte_idComunaOrigenTocomuna?.nombreComuna || "—";
const destinoDe = (orden) => orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna || "—";

function DetalleOrden({ idOrden, cerrar, alCambiar }) {
    const [orden, setOrden] = useState(null);
    const [error, setError] = useState("");
    const [motivo, setMotivo] = useState("");
    const [avisos, setAvisos] = useState("");
    const [pidiendo, setPidiendo] = useState(false);

    useEffect(() => {
        let vigente = true;
        obtenerOrden(idOrden)
            .then((datos) => vigente && setOrden(datos))
            .catch((e) => vigente && setError(e.message));
        return () => {
            vigente = false;
        };
    }, [idOrden]);

    const eventos = orden ? lineaTiempoOt(orden) : [];
    const estado = String(orden?.estado_ot?.nombreEstado || "").toUpperCase();
    const puedePedir = orden && ![
        "ENTREGADA",
        "ENTREGADO",
        "ENTREGA_PARCIAL",
        "ANULADA",
        "CANCELADA",
        "DEVUELTA",
        "DEVOLUCION_SOLICITADA"
    ].includes(estado);

    const pedir = async (evento) => {
        evento.preventDefault();
        setPidiendo(true);
        setError("");
        try {
            const resultado = await pedirDevolucion(idOrden, motivo);
            const fresca = await obtenerOrden(idOrden);
            setOrden(fresca);
            setAvisos(resultado.mensaje || "Pediste la devolución.");
            setMotivo("");
            alCambiar?.();
        } catch (e) {
            setError(e.message);
        } finally {
            setPidiendo(false);
        }
    };

    return (
        <div className="mx-modal-fondo" onClick={cerrar} role="presentation">
            <div className="mx-modal" role="dialog" aria-modal="true" aria-label="Detalle de la orden" onClick={(e) => e.stopPropagation()}>
                <header className="admin-card-header m-0! rounded-xl!">
                    <div>
                        <span>ORDEN DE TRANSPORTE</span>
                        <h2>{orden?.numeroOT || "Cargando..."}</h2>
                    </div>
                    <button type="button" className="button-secondary" onClick={cerrar}>Cerrar</button>
                </header>

                <Message texto={error} tipo="error" />
                <Message texto={avisos} tipo="success" />

                {orden ? (
                    <>
                        <div className="mx-ciudad-info">
                            <p><span>Estado</span><strong>{textoEstadoOt(orden.estado_ot?.nombreEstado)}</strong></p>
                            <p><span>Creada</span><strong>{formatearFechaHora(orden.fechaCreacion)}</strong></p>
                            <p><span>Origen</span><strong>{etiquetaComuna(orden.comuna_orden_transporte_idComunaOrigenTocomuna)}</strong></p>
                            <p><span>Destino</span><strong>{etiquetaComuna(orden.comuna_orden_transporte_idComunaDestinoTocomuna)}</strong></p>
                            <p><span>Dirección de entrega</span><strong>{orden.direccionDestino || "—"}</strong></p>
                            <p><span>Recibe</span><strong>{orden.contactoDestino || "—"} {orden.telefonoDestino ? `· ${orden.telefonoDestino}` : ""}</strong></p>
                            <p><span>Servicio</span><strong>{orden.tipoServicio === "EXPRESS" ? "Express" : "Normal"}</strong></p>
                            <p><span>Valor</span><strong>{formatearCLP(orden.valorTotal)}</strong></p>
                        </div>
                        {puedePedir ? (
                            <form className="admin-grid-2" onSubmit={pedir}>
                                <p className="mx-note" style={{ gridColumn: "1 / -1" }}>
                                    Si ya no quieres enviar esta carga, pide la devolución. Si salió a ruta, vuelve a la oficina y ahí te la entregan.
                                </p>
                                <div className="field" style={{ gridColumn: "1 / -1" }}>
                                    <label>Motivo de la devolución *</label>
                                    <input
                                        value={motivo}
                                        onChange={(evento) => setMotivo(evento.target.value)}
                                        placeholder="Ya no quiero enviar esta carga"
                                        required
                                        minLength={3}
                                    />
                                </div>
                                <div className="mx-form-actions">
                                    <button className="button-primary" type="submit" disabled={pidiendo}>
                                        {pidiendo ? "Enviando..." : "Pedir devolución"}
                                    </button>
                                </div>
                            </form>
                        ) : null}
                        {estado === "DEVOLUCION_SOLICITADA" ? (
                            <p className="mx-note">Pediste la devolución. Si la carga ya salió, vuelve a la oficina y ahí te la entregan.</p>
                        ) : null}
                        {estado === "DEVUELTA" ? (
                            <p className="mx-note">Tu carga fue devuelta.</p>
                        ) : null}

                        <h3>Carga</h3>
                        <div className="mx-table-wrap">
                            <table className="mx-table">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Descripción</th>
                                        <th>Cant.</th>
                                        <th>Medidas</th>
                                        <th>Peso</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(orden.detalle_carga || []).map((item) => (
                                        <tr key={item.idDetalleCarga}>
                                            <td>{etiquetaTipoCarga(item.tipo_bulto?.nombreTipo)}</td>
                                            <td>{item.descripcion}</td>
                                            <td>{item.cantidad}</td>
                                            <td>{etiquetaMedidas(item)}</td>
                                            <td>{formatearKg(item.pesoTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <h3>Seguimiento</h3>
                        {eventos.length === 0 ? (
                            <p className="mx-note">Sin eventos de seguimiento.</p>
                        ) : (
                            <ol className="relative space-y-4 border-l-2 border-celeste pl-5">
                                {eventos.map((item, indice) => (
                                    <li key={item.id || indice} className="relative">
                                        <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${indice === 0 ? "bg-verde" : "bg-azul"}`} />
                                        <p className="text-xs font-semibold text-texto-suave">{formatearFechaHora(item.fechaHora)}</p>
                                        <p className="text-sm font-bold text-marino">{textoEstadoOt(item.estado)}{item.ubicacion ? ` · ${item.ubicacion}` : ""}</p>
                                        <p className="text-sm text-slate-600">{item.descripcion}</p>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function OrdenesClientePage({ vista: vistaPedida }) {
    const { tieneCuentaCorriente } = useCliente();
    // "Mis órdenes" sin vista indicada: el cliente con cuenta corriente ve las pestañas
    const vista = vistaPedida || (tieneCuentaCorriente ? "todas" : "curso");
    const [ordenes, setOrdenes] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [pestana, setPestana] = useState("curso");
    const [busqueda, setBusqueda] = useState("");
    // "desde" se calcula al elegir el período (no en cada render)
    const [periodo, setPeriodo] = useState({ valor: "todo", desde: 0 });
    const cambiarPeriodo = (valor) =>
        setPeriodo({ valor, desde: valor === "todo" ? 0 : Date.now() - Number(valor) * DIA });
    const [abierta, setAbierta] = useState(null);

    useEffect(() => {
        let vigente = true;
        obtenerOrdenes()
            .then((datos) => vigente && setOrdenes(datos))
            .catch((error) => vigente && setMensaje(error.message));
        return () => {
            vigente = false;
        };
    }, []);

    const lista = ordenes || [];
    const conPestanas = vista === "todas";
    const grupo = conPestanas ? pestana : vista;
    const grupos = {
        curso: lista.filter((orden) => !esHistorial(orden)),
        historial: lista.filter(esHistorial),
        todas: lista
    };

    const texto = busqueda.trim().toLowerCase();
    const visibles = grupos[grupo].filter((orden) => {
        const coincide = !texto || [orden.numeroOT, origenDe(orden), destinoDe(orden)].some((v) => v.toLowerCase().includes(texto));
        const enPeriodo = grupo === "curso" || new Date(orden.fechaCreacion).getTime() >= periodo.desde;
        return coincide && enPeriodo;
    });

    return (
        <section className="cliente-card">
            <header className="admin-card-header">
                <div>
                    <span>{grupo === "historial" ? "HISTORIAL" : "ENVÍOS"}</span>
                    <h2>{grupo === "historial" ? "Órdenes terminadas" : grupo === "todas" ? "Todas mis órdenes" : "Órdenes en curso"}</h2>
                </div>
            </header>

            <Message texto={mensaje} tipo="error" />

            {conPestanas ? (
                <div className="ot-pasos">
                    {[
                        ["curso", "En curso"],
                        ["historial", "Historial"],
                        ["todas", "Todas"]
                    ].map(([valor, nombre]) => (
                        <button key={valor} type="button" className={`ot-paso${pestana === valor ? " activo" : ""}`} onClick={() => setPestana(valor)}>
                            {nombre} ({grupos[valor].length})
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="mx-toolbar">
                <input
                    type="search"
                    placeholder="Buscar por número de OT o comuna"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    aria-label="Buscar orden"
                />
                {grupo !== "curso" ? (
                    <select value={periodo.valor} onChange={(e) => cambiarPeriodo(e.target.value)} aria-label="Período">
                        {periodos.map((p) => (
                            <option key={p.valor} value={p.valor}>{p.texto}</option>
                        ))}
                    </select>
                ) : null}
            </div>

            <div className="mx-table-wrap">
                <table className="mx-table">
                    <thead>
                        <tr>
                            <th>N° OT</th>
                            <th>Fecha</th>
                            <th>Origen → Destino</th>
                            <th>Carga</th>
                            <th>Kg / m³</th>
                            <th>Estado</th>
                            <th>Total</th>
                            {tieneCuentaCorriente ? <th>Pago</th> : null}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordenes === null && !mensaje ? (
                            <tr><td colSpan={9} className="mx-empty">Cargando órdenes...</td></tr>
                        ) : visibles.length === 0 ? (
                            <tr><td colSpan={9} className="mx-empty">No hay órdenes en esta lista.</td></tr>
                        ) : visibles.map((orden) => {
                            const resumen = resumirDetallesCarga(orden.detalle_carga);
                            const pago = estadoPagoDe(orden);
                            return (
                                <tr key={orden.idOrden}>
                                    <td><strong className="font-mono text-marino">{orden.numeroOT}</strong></td>
                                    <td>{formatearFechaHora(orden.fechaCreacion)}</td>
                                    <td>{origenDe(orden)} → {destinoDe(orden)}</td>
                                    <td>{textoResumenTipos(resumen.porTipo)}</td>
                                    <td>{formatearKg(resumen.peso)} · {formatearM3(resumen.volumen)}</td>
                                    <td><InsigniaOt orden={orden} /></td>
                                    <td>{formatearCLP(orden.valorTotal)}</td>
                                    {tieneCuentaCorriente ? (
                                        <td className={pago === "PAGADO" ? "text-green-700" : pago ? "font-semibold text-amber-700" : "text-slate-400"}>
                                            {pago === "PAGADO" ? "Pagada" : pago === "POR_CUADRAR" ? "Por cuadrar" : pago === "PENDIENTE" ? "Impaga" : pago ? pago : "—"}
                                        </td>
                                    ) : null}
                                    <td>
                                        <button type="button" className="button-secondary" onClick={() => setAbierta(orden.idOrden)}>
                                            Ver detalle
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {abierta ? <DetalleOrden idOrden={abierta} cerrar={() => setAbierta(null)} alCambiar={() => obtenerOrdenes().then(setOrdenes).catch(() => {})} /> : null}
        </section>
    );
}
