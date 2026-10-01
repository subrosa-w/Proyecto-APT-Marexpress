import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";
import Message from "../../components/Message.jsx";
import {
    bandejaSeguimiento,
    diaChile,
    etiquetaComuna,
    fechaHoyChile,
    formatearFechaHora,
    lineaTiempoOt,
    motivoRechazoOrden,
    ordenAnulada
} from "../../utils.js";

const extraerLista = (datos, clave) => {
    if (Array.isArray(datos)) {
        return datos;
    }
    if (Array.isArray(datos?.[clave])) {
        return datos[clave];
    }
    return [];
};

const destinoOrden = (orden) =>
    etiquetaComuna(orden.comuna_orden_transporte_idComunaDestinoTocomuna)
    || orden.direccionDestino
    || "—";

export default function OperadorInicioPage() {
    const { idSucursal, nombreBodega, ordenDeBodega } = useBodegaTrabajo();
    const [ordenes, setOrdenes] = useState([]);
    const [bultosBodega, setBultosBodega] = useState([]);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        if (!idSucursal) {
            setBultosBodega([]);
            return;
        }
        Promise.all([
            api("/ordenes-transporte").catch((error) => {
                setMensaje(error.message);
                return [];
            }),
            api(`/bultos/bodega?estado=EN_BODEGA&idSucursal=${idSucursal}`).catch(() => ({ bultos: [] }))
        ]).then(([listaOt, inventario]) => {
            setOrdenes(extraerLista(listaOt, "ordenes"));
            setBultosBodega(extraerLista(inventario, "bultos"));
        });
    }, [idSucursal]);

    const hoy = fechaHoyChile();

    const { porEntregar, porRecepcionar, registradasHoy, historial, totalOt } = useMemo(() => {
        const grupos = { porRecepcionar: [], registradasHoy: [] };
        for (const orden of ordenes) {
            if (ordenAnulada(orden) || !ordenDeBodega(orden)) {
                continue;
            }
            const bandeja = bandejaSeguimiento(orden);
            if (bandeja === "rechazadas") {
                grupos.porRecepcionar.push(orden);
            }
            if (diaChile(orden.fechaCreacionChile || orden.fechaCreacion) === hoy) {
                grupos.registradasHoy.push(orden);
            }
        }

        const agrupar = new Map();
        for (const bulto of bultosBodega) {
            if (String(bulto.estado || "").toUpperCase() !== "EN_BODEGA") {
                continue;
            }
            if (Number(bulto.idSucursalActual) !== Number(idSucursal) && Number(bulto.sucursal?.idSucursal) !== Number(idSucursal)) {
                continue;
            }
            const orden = bulto.detalle_carga?.orden_transporte;
            const estadoOt = String(orden?.estado_ot?.nombreEstado || "").toUpperCase();
            if (["ANULADA", "CANCELADA", "EN_TRANSITO", "EN_RUTA", "DESPACHADA"].includes(estadoOt)) {
                continue;
            }
            const bodega = bulto.sucursal?.nombreSucursal
                || bulto.sucursal?.comuna?.nombreComuna
                || "Bodega";
            const clave = `${orden?.idOrden || bulto.idBulto}-${bulto.sucursal?.idSucursal || bodega}`;
            if (!agrupar.has(clave)) {
                agrupar.set(clave, {
                    clave,
                    idOrden: orden?.idOrden || null,
                    numeroOT: orden?.numeroOT || "Sin OT",
                    cliente: orden?.cliente?.razonSocial || "—",
                    destino: orden?.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna
                        || orden?.direccionDestino
                        || "—",
                    bodega,
                    bultos: 0
                });
            }
            agrupar.get(clave).bultos += 1;
        }

        const eventos = ordenes
            .filter((orden) => !ordenAnulada(orden) && ordenDeBodega(orden))
            .flatMap((orden) =>
                lineaTiempoOt(orden).map((item) => ({
                    ...item,
                    numeroOT: orden.numeroOT
                }))
            );
        eventos.sort((a, b) => new Date(b.fechaHora || 0) - new Date(a.fechaHora || 0));

        return {
            porEntregar: [...agrupar.values()].sort((a, b) =>
                a.bodega.localeCompare(b.bodega, "es") || a.numeroOT.localeCompare(b.numeroOT, "es")
            ),
            ...grupos,
            historial: eventos.slice(0, 20),
            totalOt: ordenes.filter((orden) => !ordenAnulada(orden) && ordenDeBodega(orden)).length
        };
    }, [ordenes, bultosBodega, hoy, ordenDeBodega, idSucursal]);

    return (
        <>
            <section className="operador-kpis">
                <article className="operador-kpi">
                    <span>OT registradas</span>
                    <strong>{totalOt}</strong>
                    <small>{nombreBodega ? `De ${nombreBodega}` : "Selecciona una bodega"}</small>
                </article>
                <article className="operador-kpi">
                    <span>Ingresadas hoy</span>
                    <strong>{registradasHoy.length}</strong>
                    <small>Creadas el {hoy}</small>
                </article>
                <article className="operador-kpi">
                    <span>Por entregar</span>
                    <strong>{porEntregar.length}</strong>
                    <small>{nombreBodega ? `En ${nombreBodega}` : "Selecciona una bodega"}</small>
                </article>
                <article className="operador-kpi">
                    <span>Por recepcionar</span>
                    <strong>{porRecepcionar.length}</strong>
                    <small>Rechazadas que vuelven a bodega</small>
                </article>
            </section>

            <section className="operador-card">
                <header className="operador-card-header">
                    <div>
                        <span>JORNADA</span>
                        <h2>Gestión del día</h2>
                    </div>
                    <div className="operador-acciones">
                        <Link to="/operador/recepcion">Recepción</Link>
                        <Link to="/operador/manifiestos">Manifiestos</Link>
                        <Link to="/operador/bodega">Bodega</Link>
                    </div>
                </header>
                <Message texto={mensaje} tipo="error" />
                <p className="mx-note">
                    Despacha lo que está en {nombreBodega || "la bodega de trabajo"}, reingresa rechazos y revisa lo registrado hoy.
                </p>
            </section>

            <section className="operador-card">
                <header className="operador-card-header">
                    <div>
                        <span>BODEGA</span>
                        <h2>Qué entregar</h2>
                    </div>
                    <Link className="button-secondary" to="/operador/bodega">Ver bodega</Link>
                </header>
                <p className="mx-note">
                    Solo carga física en {nombreBodega || "la bodega seleccionada"}. No incluye tránsito ni otras sucursales.
                </p>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Bodega</th>
                                <th>OT</th>
                                <th>Cliente</th>
                                <th>Destino</th>
                                <th>Bultos</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {porEntregar.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="mx-empty">
                                        No hay carga en {nombreBodega || "esta bodega"} para despachar.
                                    </td>
                                </tr>
                            ) : porEntregar.map((item) => (
                                <tr key={item.clave}>
                                    <td>{item.bodega}</td>
                                    <td>{item.numeroOT}</td>
                                    <td>{item.cliente}</td>
                                    <td>{item.destino}</td>
                                    <td>{item.bultos}</td>
                                    <td>
                                        <Link className="button-secondary" to="/operador/manifiestos">
                                            Armar manifiesto
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="operador-card">
                <header className="operador-card-header">
                    <div>
                        <span>RECHAZOS</span>
                        <h2>Qué recepcionar</h2>
                    </div>
                    <Link className="button-secondary" to="/operador/recepcion">Ir a recepción</Link>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>OT</th>
                                <th>Cliente</th>
                                <th>Destino</th>
                                <th>Motivo</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {porRecepcionar.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="mx-empty">No hay OT rechazadas pendientes de reingreso.</td>
                                </tr>
                            ) : porRecepcionar.map((orden) => (
                                <tr key={orden.idOrden}>
                                    <td>{orden.numeroOT}</td>
                                    <td>{orden.cliente?.razonSocial || "—"}</td>
                                    <td>{destinoOrden(orden)}</td>
                                    <td>{motivoRechazoOrden(orden) || "Sin motivo"}</td>
                                    <td>
                                        <Link
                                            className="button-secondary"
                                            to={`/operador/recepcion?ot=${encodeURIComponent(orden.numeroOT)}`}
                                        >
                                            Recepcionar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="operador-card">
                <header className="operador-card-header">
                    <div>
                        <span>HOY</span>
                        <h2>Órdenes registradas hoy</h2>
                    </div>
                    <Link className="button-secondary" to="/operador/ordenes">Nueva OT</Link>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>OT</th>
                                <th>Hora</th>
                                <th>Cliente</th>
                                <th>Destino</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registradasHoy.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="mx-empty">Aún no se registran OT con fecha de hoy.</td>
                                </tr>
                            ) : registradasHoy.map((orden) => (
                                <tr key={orden.idOrden}>
                                    <td>{orden.numeroOT}</td>
                                    <td>{formatearFechaHora(orden.fechaCreacion)}</td>
                                    <td>{orden.cliente?.razonSocial || "—"}</td>
                                    <td>{destinoOrden(orden)}</td>
                                    <td>{orden.estado_ot?.nombreEstado || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="operador-card">
                <header className="operador-card-header">
                    <div>
                        <span>ACTIVIDAD</span>
                        <h2>Últimas operaciones</h2>
                    </div>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>OT</th>
                                <th>Evento</th>
                                <th>Estado</th>
                                <th>Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="mx-empty">Todavía no hay movimientos registrados.</td>
                                </tr>
                            ) : historial.map((item) => (
                                <tr key={`${item.numeroOT}-${item.id}-${item.fechaHora}`}>
                                    <td>{formatearFechaHora(item.fechaHora)}</td>
                                    <td>{item.numeroOT}</td>
                                    <td>{item.descripcion}</td>
                                    <td>{item.estado}</td>
                                    <td>{item.usuario}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
