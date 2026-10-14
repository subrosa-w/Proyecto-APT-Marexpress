import { useEffect, useState } from "react";
import { Link } from "react-router";
import Message from "../../components/Message.jsx";
import { etiquetaComuna, formatearCLP, formatearFechaHora } from "../../utils.js";
import { useCliente } from "./clienteContexto.jsx";
import { obtenerOrdenes, obtenerPendientesPago } from "./clienteDatos.js";
import { esHistorial, estadoDe } from "./clienteEstados.js";
import InsigniaOt from "./InsigniaOt.jsx";

export default function ClienteInicioPage() {
    const { perfil, cuentaCorriente, tieneCuentaCorriente } = useCliente();
    const [ordenes, setOrdenes] = useState([]);
    const [pendientes, setPendientes] = useState([]);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        let vigente = true;
        Promise.all([
            obtenerOrdenes(),
            tieneCuentaCorriente ? obtenerPendientesPago(cuentaCorriente?.diasCredito || 30) : Promise.resolve({ datos: [] })
        ])
            .then(([listaOrdenes, listaPendientes]) => {
                if (!vigente) return;
                setOrdenes(listaOrdenes.datos);
                setPendientes(listaPendientes.datos);
            })
            .catch((error) => vigente && setMensaje(error.message));
        return () => {
            vigente = false;
        };
    }, [tieneCuentaCorriente, cuentaCorriente?.diasCredito]);

    const enCurso = ordenes.filter((orden) => !esHistorial(orden));
    const entregadas = ordenes.filter((orden) => ["ENTREGADA", "ENTREGADO"].includes(estadoDe(orden)));
    const atrasadas = pendientes.filter((item) => item.atrasada);
    const montoPendiente = pendientes.reduce((s, item) => s + Number(item.monto || 0), 0);
    const disponible = Number(cuentaCorriente?.limiteCredito || 0) - Number(cuentaCorriente?.saldoActual || 0);
    const empresa = perfil?.cliente;
    const ultimas = [...ordenes].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)).slice(0, 5);

    return (
        <>
            <section className="cliente-card">
                <header className="admin-card-header">
                    <div>
                        <span>TU EMPRESA</span>
                        <h2>{empresa?.nombreFantasia || empresa?.razonSocial || "Mi empresa"}</h2>
                    </div>
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${tieneCuentaCorriente ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                        {tieneCuentaCorriente ? "Cliente con cuenta corriente" : "Cliente"}
                    </span>
                </header>
                <div className="mx-ciudad-info">
                    <p><span>Razón social</span><strong>{empresa?.razonSocial || "—"}</strong></p>
                    <p><span>RUT</span><strong>{empresa?.rut || "—"}</strong></p>
                    <p><span>Dirección</span><strong>{empresa?.direccion || "—"}</strong></p>
                    <p><span>Comuna</span><strong>{etiquetaComuna(empresa?.comuna) || "—"}</strong></p>
                </div>
            </section>

            <Message texto={mensaje} tipo="error" />

            {tieneCuentaCorriente ? (
                <section className="admin-kpis">
                    <article className="admin-kpi">
                        <span>OT en curso</span>
                        <strong>{enCurso.length}</strong>
                        <small>Órdenes que aún no se entregan</small>
                    </article>
                    <article className="admin-kpi">
                        <span>Pendiente de pago</span>
                        <strong>{formatearCLP(montoPendiente)}</strong>
                        <small>{pendientes.length} OT por pagar</small>
                    </article>
                    <article className="admin-kpi">
                        <span>OT atrasadas</span>
                        <strong className={atrasadas.length ? "text-red-600" : ""}>{atrasadas.length}</strong>
                        <small>Con el plazo de pago vencido</small>
                    </article>
                    <article className="admin-kpi">
                        <span>Crédito disponible</span>
                        <strong>{formatearCLP(disponible)}</strong>
                        <small>Límite {formatearCLP(cuentaCorriente?.limiteCredito)}</small>
                    </article>
                </section>
            ) : (
                <section className="admin-kpis">
                    <article className="admin-kpi">
                        <span>OT en curso</span>
                        <strong>{enCurso.length}</strong>
                        <small>Órdenes que aún no se entregan</small>
                    </article>
                    <article className="admin-kpi">
                        <span>Entregadas</span>
                        <strong>{entregadas.length}</strong>
                        <small>Envíos completados</small>
                    </article>
                    <article className="admin-kpi">
                        <span>Total de órdenes</span>
                        <strong>{ordenes.length}</strong>
                        <small>Desde que eres cliente</small>
                    </article>
                </section>
            )}

            <section className="cliente-card">
                <header className="admin-card-header">
                    <div>
                        <span>ENVÍOS</span>
                        <h2>Últimas órdenes</h2>
                    </div>
                    <div className="operador-acciones">
                        <Link to="/cliente/ordenes">Mis órdenes</Link>
                        {tieneCuentaCorriente ? (
                            <>
                                <Link to="/cliente/pagos">Pendientes de pago</Link>
                                <Link to="/cliente/cotizar">Cotizar OT</Link>
                            </>
                        ) : (
                            <Link to="/cliente/historial">Historial</Link>
                        )}
                    </div>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>N° OT</th>
                                <th>Fecha</th>
                                <th>Destino</th>
                                <th>Estado</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ultimas.length === 0 ? (
                                <tr><td colSpan={5} className="mx-empty">Todavía no tienes órdenes de transporte.</td></tr>
                            ) : ultimas.map((orden) => (
                                <tr key={orden.idOrden}>
                                    <td><strong className="font-mono text-marino">{orden.numeroOT}</strong></td>
                                    <td>{formatearFechaHora(orden.fechaCreacion)}</td>
                                    <td>{orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna || "—"}</td>
                                    <td><InsigniaOt orden={orden} /></td>
                                    <td>{formatearCLP(orden.valorTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
