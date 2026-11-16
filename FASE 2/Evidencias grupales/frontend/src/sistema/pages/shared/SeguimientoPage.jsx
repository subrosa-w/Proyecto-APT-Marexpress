/*
  VISTA: seguimiento interno
  RUTAS: /administrador/seguimiento y /operador/seguimiento
  CSS: admin-card
  API: GET /api/ordenes-transporte (seguimiento)
  FUNCIONES: línea de tiempo de una OT
*/
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

// Deja la respuesta del API como arreglo.
const extraerLista = (datos, clave) => {
    if (Array.isArray(datos)) {
        return datos;
    }
    if (Array.isArray(datos?.[clave])) {
        return datos[clave];
    }
    return [];
};

// Bandejas del tablero. Cada OT cae en una según su estado.
const columnas = [
    { id: "enCurso", titulo: "En curso", texto: "OT en tránsito o con manifiesto en ruta." },
    { id: "entregadas", titulo: "Entregadas", texto: "Órdenes ya cerradas en destino." },
    { id: "bodega", titulo: "En bodega", texto: "Carga recibida que aún no sale a ruta." },
    { id: "rechazadas", titulo: "Rechazadas", texto: "Entregas rechazadas, con motivo y datos de la OT." }
];

// La entrega puede venir directa o colgando del manifiesto. Toma la primera que exista.
const entregaDeOrden = (orden) => {
    const directas = orden?.entrega_ot || [];
    const deManifiesto = (orden?.manifiesto_ot || []).map((item) => item.entrega_ot).filter(Boolean);
    return [...directas, ...deManifiesto][0] || null;
};

export default function SeguimientoPage() {
    const { ordenDeBodega, nombreBodega } = useBodegaTrabajo();
    const { usuario } = useAuth();
    const [ordenes, setOrdenes] = useState([]);
    const [estados, setEstados] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState("error");
    const [pestana, setPestana] = useState("enCurso");
    const [detalle, setDetalle] = useState(null);
    const [actualizando, setActualizando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Aviso único de la pantalla.
    const aviso = (texto, tipo = "info") => {
        setMensaje(texto);
        setTipoMensaje(tipo);
    };

    // Trae todas las OT y los estados posibles para armar las bandejas.
    const cargar = async () => {
        const [lista, listaEstados] = await Promise.all([
            api("/ordenes-transporte"),
            api("/ordenes-transporte/estados").catch(() => ({ estados: [] }))
        ]);
        const ordenesNuevas = extraerLista(lista, "ordenes");
        setOrdenes(ordenesNuevas);
        setEstados(extraerLista(listaEstados, "estados"));
        return ordenesNuevas;
    };

    useEffect(() => {
        cargar().catch((error) => aviso(error.message, "error"));
    }, []);

    // Actualiza el tablero y, si hay una OT abierta, también su detalle.
    const recargar = async () => {
        setActualizando(true);
        try {
            const ordenesNuevas = await cargar();
            if (detalle?.idOrden) {
                const fresca = ordenesNuevas.find((item) => item.idOrden === detalle.idOrden);
                if (fresca) {
                    const completa = await api(`/ordenes-transporte/${fresca.idOrden}`).catch(() => fresca);
                    setDetalle(completa);
                }
            }
            aviso("Seguimiento actualizado desde la base de datos.", "success");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setActualizando(false);
        }
    };

    // Cambia el estado y mueve la OT a la bandeja que le corresponde.
    const aplicarEstado = async (estado) => {
        if (!detalle?.idOrden || !estado?.idEstado) {
            return;
        }
        setGuardando(true);
        try {
            const resultado = await api(`/ordenes-transporte/${detalle.idOrden}/estado`, {
                method: "PATCH",
                body: JSON.stringify({ idEstado: estado.idEstado })
            });
            const actualizada = resultado.orden || resultado;
            setDetalle(actualizada);
            await cargar();
            const bandeja = bandejaSeguimiento(actualizada);
            if (["enCurso", "entregadas", "bodega", "rechazadas"].includes(bandeja)) {
                setPestana(bandeja);
            }
            aviso(resultado.mensaje || `Estado de ${actualizada.numeroOT} actualizado.`, "success");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setGuardando(false);
        }
    };

    // Reparte las OT de la bodega activa. Las anuladas no se siguen.
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
                <button
                    type="button"
                    className="button-secondary"
                    onClick={recargar}
                    disabled={actualizando}
                >
                    {actualizando ? "Actualizando..." : "Actualizar"}
                </button>
            </header>
            <Message texto={mensaje} tipo={tipoMensaje} />
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
                    <p><span>Estado en base de datos</span><strong>{detalle.estado_ot?.nombreEstado || "—"}</strong></p>
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
                <div style={{ marginTop: 16 }}>
                    <p className="mx-note">
                        Cambia el estado con un botón. La lista sale de la tabla de estados y se guarda en la orden.
                    </p>
                    {estados.length === 0 ? (
                        <p className="mx-empty">No hay estados cargados en la base de datos.</p>
                    ) : (
                        <div className="mx-acciones">
                            {estados.map((estado) => {
                                const actual = estado.idEstado === detalle.idEstado
                                    || estado.nombreEstado === detalle.estado_ot?.nombreEstado;
                                return (
                                    <button
                                        key={estado.idEstado}
                                        type="button"
                                        className={actual ? "button-primary" : "button-secondary"}
                                        title={estado.descripcion || estado.nombreEstado}
                                        disabled={guardando || actual}
                                        onClick={() => aplicarEstado(estado)}
                                    >
                                        {String(estado.nombreEstado || "").replaceAll("_", " ")}
                                    </button>
                                );
                            })}
                        </div>
                    )}
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
