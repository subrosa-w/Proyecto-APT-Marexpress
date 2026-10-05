import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { api } from "../../api.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";
import { useAuth } from "../../auth.jsx";
import Message from "../../components/Message.jsx";
import {
    bandejaSeguimiento,
    etiquetaComuna,
    formatearFechaHora,
    motivoRechazoOrden,
    ordenAnulada,
    resumirDetallesCarga,
    textoResumenTipos,
    formatearKg,
    formatearM3,
    formatearCLP,
    lineaTiempoOt
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

const columnas = [
    { id: "enCurso", titulo: "En curso", texto: "OT en tránsito o con manifiesto en ruta." },
    { id: "entregadas", titulo: "Entregadas", texto: "Órdenes ya cerradas en destino." },
    { id: "bodega", titulo: "En bodega", texto: "Carga recibida que aún no sale a ruta." },
    { id: "rechazadas", titulo: "Rechazadas", texto: "Entregas rechazadas, con motivo y datos de la OT." }
];

const entregaDeOrden = (orden) => {
    const directas = orden?.entrega_ot || [];
    const deManifiesto = (orden?.manifiesto_ot || []).map((item) => item.entrega_ot).filter(Boolean);
    return [...directas, ...deManifiesto][0] || null;
};

export default function SeguimientoPage() {
    const { ordenDeBodega, nombreBodega } = useBodegaTrabajo();
    const { usuario } = useAuth();
    const [ordenes, setOrdenes] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [pestana, setPestana] = useState("enCurso");
    const [detalle, setDetalle] = useState(null);

    useEffect(() => {
        api("/ordenes-transporte")
            .then((lista) => setOrdenes(extraerLista(lista, "ordenes")))
            .catch((error) => setMensaje(error.message));
    }, []);

    const grupos = useMemo(() => {
        const base = { enCurso: [], entregadas: [], bodega: [], rechazadas: [] };
        for (const orden of ordenes) {
            if (!ordenDeBodega(orden) || ordenAnulada(orden)) {
                continue;
            }
            const bandeja = bandejaSeguimiento(orden);
            if (base[bandeja]) {
                base[bandeja].push(orden);
            }
        }
        return base;
    }, [ordenes, ordenDeBodega]);

    const visibles = grupos[pestana] || [];
    const esRechazo = pestana === "rechazadas";
    const carga = detalle ? resumirDetallesCarga(detalle.detalle_carga) : null;

    return (
        <section className="admin-card operador-card">
            <header className="admin-card-header">
                <div>
                    <span>OPERACIÓN</span>
                    <h2>Seguimiento</h2>
                </div>
            </header>
            <Message texto={mensaje} tipo="error" />
            <div className="mx-ciudad-info">
                <p><span>En curso</span><strong>{grupos.enCurso.length}</strong></p>
                <p><span>Entregadas</span><strong>{grupos.entregadas.length}</strong></p>
                <p><span>En bodega</span><strong>{grupos.bodega.length}</strong></p>
                <p><span>Rechazadas</span><strong>{grupos.rechazadas.length}</strong></p>
            </div>
            <div className="ot-pasos" style={{ margin: "16px 0" }}>
                {columnas.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`ot-paso ${pestana === item.id ? "activo" : ""}`}
                        onClick={() => {
                            setPestana(item.id);
                            setDetalle(null);
                        }}
                    >
                        {item.titulo} ({grupos[item.id].length})
                    </button>
                ))}
            </div>
            <p className="mx-note">{columnas.find((item) => item.id === pestana)?.texto}</p>
            <div className="mx-table-wrap">
                <table className="mx-table">
                    <thead>
                        <tr>
                            <th>OT</th>
                            <th>Cliente</th>
                            <th>Destino</th>
                            <th>Estado</th>
                            {esRechazo ? <th>Motivo</th> : <th>Manifiesto</th>}
                            <th>{esRechazo ? "Fecha rechazo" : "Creación"}</th>
                            {esRechazo ? <th></th> : <th></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="mx-empty">No hay órdenes en esta bandeja.</td>
                            </tr>
                        ) : visibles.map((orden) => {
                            const rechazo = entregaDeOrden(orden);
                            return (
                                <tr key={orden.idOrden}>
                                    <td>{orden.numeroOT}</td>
                                    <td>{orden.cliente?.razonSocial || "—"}</td>
                                    <td>{etiquetaComuna(orden.comuna_orden_transporte_idComunaDestinoTocomuna) || "—"}</td>
                                    <td>{orden.estado_ot?.nombreEstado || rechazo?.resultadoEntrega || "—"}</td>
                                    {esRechazo ? (
                                        <td>{motivoRechazoOrden(orden) || "Sin motivo registrado"}</td>
                                    ) : (
                                        <td>
                                            {(orden.manifiesto_ot || [])
                                                .map((item) => item.manifiesto?.numeroManifiesto)
                                                .filter(Boolean)
                                                .join(", ") || "—"}
                                        </td>
                                    )}
                                    <td>
                                        {formatearFechaHora(esRechazo ? (rechazo?.fechaEntrega || orden.fechaCreacion) : orden.fechaCreacion)}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="button-secondary"
                                            onClick={async () => {
                                                try {
                                                    const completa = await api(`/ordenes-transporte/${orden.idOrden}`);
                                                    setDetalle(completa);
                                                } catch {
                                                    setDetalle(orden);
                                                }
                                            }}
                                        >
                                            Ver historial
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {detalle ? (
                <div className="mx-ciudad-info" style={{ marginTop: 18 }}>
                    <p><span>OT</span><strong>{detalle.numeroOT}</strong></p>
                    <p><span>Estado</span><strong>{detalle.estado_ot?.nombreEstado || "—"}</strong></p>
                    {esRechazo || motivoRechazoOrden(detalle) ? (
                        <p><span>Motivo rechazo</span><strong>{motivoRechazoOrden(detalle) || "—"}</strong></p>
                    ) : null}
                    <p><span>Valor</span><strong>{formatearCLP(detalle.valorTotal)}</strong></p>
                    <p><span>Cliente</span><strong>{detalle.cliente?.razonSocial || "—"} · {detalle.cliente?.rut || ""}</strong></p>
                    <p><span>Destinatario</span><strong>{detalle.destinatario?.nombreRazonSocial || detalle.contactoDestino || "—"}</strong></p>
                    <p><span>Origen</span><strong>{detalle.direccionOrigen || "—"} · {etiquetaComuna(detalle.comuna_orden_transporte_idComunaOrigenTocomuna) || ""}</strong></p>
                    <p><span>Destino</span><strong>{detalle.direccionDestino || "—"} · {etiquetaComuna(detalle.comuna_orden_transporte_idComunaDestinoTocomuna) || ""}</strong></p>
                    <p><span>Carga</span><strong>{carga ? `${textoResumenTipos(carga.porTipo)} · ${formatearKg(carga.peso)} · ${formatearM3(carga.volumen)}` : "—"}</strong></p>
                    <p><span>Manifiesto</span><strong>{(detalle.manifiesto_ot || []).map((item) => item.manifiesto?.numeroManifiesto).filter(Boolean).join(", ") || "—"}</strong></p>
                    {esRechazo ? (
                        <p>
                            <span>Reingreso</span>
                            <strong>
                                <Link
                                    className="button-primary"
                                    to={
                                        usuario?.rol === "ADMINISTRADOR"
                                            ? "/administrador/bodega"
                                            : `/operador/recepcion?ot=${encodeURIComponent(detalle.numeroOT)}`
                                    }
                                >
                                    Escanear e ingresar a bodega
                                </Link>
                            </strong>
                        </p>
                    ) : null}
                </div>
            ) : null}
            {detalle ? (
                <div className="mx-table-wrap" style={{ marginTop: 16 }}>
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Evento</th>
                                <th>Ubicación</th>
                                <th>Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineaTiempoOt(detalle).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="mx-empty">Sin eventos de seguimiento.</td>
                                </tr>
                            ) : lineaTiempoOt(detalle).map((item) => (
                                <tr key={item.id}>
                                    <td>{formatearFechaHora(item.fechaHora)}</td>
                                    <td>{item.estado}</td>
                                    <td>{item.descripcion}</td>
                                    <td>{item.ubicacion || "—"}</td>
                                    <td>{item.usuario}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </section>
    );
}
