/*
  VISTA: listado de órdenes
  RUTAS: /administrador/ordenes y /operador/ordenes-listado
  CSS: admin-card, mx-table, mx-toolbar
  API: GET /api/ordenes-transporte
  FUNCIONES: filtra, abre e imprime una OT. Anular la deja cancelada.
*/
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";
import { etiquetaComuna, formatearCLP, formatearKg, formatearM3, etiquetaMedidas, resumirDetallesCarga, textoResumenTipos, ordenAnulada } from "../../utils.js";
import Message from "../../components/Message.jsx";
import DocumentosEmision from "../../components/DocumentosEmision.jsx";
import { useAuth } from "../../auth.jsx";
import { formatos } from "../../formatos.js";
import { CampoTelefono } from "../../entrada.jsx";

// Deja la respuesta del API como arreglo, venga suelta o dentro de una clave.
const extraerLista = (datos, clave) => {
    if (Array.isArray(datos)) {
        return datos;
    }
    if (Array.isArray(datos?.[clave])) {
        return datos[clave];
    }
    return [];
};

// Copia los datos editables de la OT al formulario. Lo que no está aquí no se puede cambiar en esta pantalla.
const formularioDesdeOrden = (orden) => ({
    direccionOrigen: orden.direccionOrigen || "",
    contactoOrigen: orden.contactoOrigen || "",
    telefonoOrigen: orden.telefonoOrigen || "",
    idComunaOrigen: String(orden.idComunaOrigen || ""),
    direccionDestino: orden.direccionDestino || "",
    contactoDestino: orden.contactoDestino || "",
    telefonoDestino: orden.telefonoDestino || "",
    referenciaEntrega: orden.referenciaEntrega || "",
    idComunaDestino: String(orden.idComunaDestino || ""),
    idDestinatario: orden.idDestinatario ? String(orden.idDestinatario) : "",
    tipoServicio: orden.tipoServicio || "NORMAL",
    tipoDocumento: orden.tipoDocumento || "SIN_DOCUMENTO",
    numeroDocumento: orden.numeroDocumento || "",
    tipoZona: orden.tipoZona || "URBANA"
});

// Pide la OT completa. Primero por id y, si falla, por número, porque el listado a veces no trae todo.
const cargarDetalle = async (orden) => {
    const idOrden = Number(orden?.idOrden);
    if (Number.isInteger(idOrden) && idOrden > 0) {
        try {
            return await api(`/ordenes-transporte/${idOrden}`);
        } catch {
            /* se intenta por número */
        }
    }
    if (!orden?.numeroOT) {
        throw new Error("No se pudo identificar la orden");
    }
    return api(`/ordenes-transporte/numero/${encodeURIComponent(orden.numeroOT)}`);
};

export default function OrdenesListadoPage() {
    const { ordenDeBodega, nombreBodega } = useBodegaTrabajo();
    const { usuario } = useAuth();
    const esOperador = usuario?.rol === "OPERADOR";
    const [ordenes, setOrdenes] = useState([]);
    const [comunas, setComunas] = useState([]);
    const [destinatarios, setDestinatarios] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("todas");
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState("info");
    const [guardando, setGuardando] = useState(false);
    const [panel, setPanel] = useState(null);
    const [ordenActiva, setOrdenActiva] = useState(null);
    const [formulario, setFormulario] = useState(null);
    const [ordenImprimir, setOrdenImprimir] = useState(null);
    const [estados, setEstados] = useState([]);
    const [actualizando, setActualizando] = useState(false);

    // Aviso único de la pantalla.
    const aviso = (texto, tipo = "info") => {
        setMensaje(texto);
        setTipoMensaje(tipo);
    };

    // Cierra edición, anulación, estado o impresión y suelta la OT que estaba abierta.
    const cerrarPanel = () => {
        setPanel(null);
        setOrdenActiva(null);
        setFormulario(null);
        setOrdenImprimir(null);
        setGuardando(false);
    };

    // Trae órdenes, comunas, destinatarios y los estados posibles.
    const cargar = async () => {
        const [lista, listaComunas, dest, listaEstados] = await Promise.all([
            api("/ordenes-transporte"),
            api("/comunas"),
            api("/destinatarios"),
            api("/ordenes-transporte/estados").catch(() => ({ estados: [] }))
        ]);
        setOrdenes(Array.isArray(lista) ? lista : extraerLista(lista, "ordenes"));
        setComunas(extraerLista(listaComunas, "comunas"));
        setDestinatarios(dest?.destinatarios || extraerLista(dest, "destinatarios"));
        setEstados(extraerLista(listaEstados, "estados"));
    };

    // Vuelve a leer la base. El botón existe porque otra persona puede haber cambiado una OT.
    const recargar = async () => {
        setActualizando(true);
        try {
            await cargar();
            aviso("Listado actualizado desde la base de datos.", "success");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setActualizando(false);
        }
    };

    useEffect(() => {
        cargar().catch((error) => aviso(error.message, "error"));
    }, []);

    // Lo que se ve: solo la bodega activa, y según el filtro las activas, las anuladas o todas.
    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return ordenes.filter((orden) => {
            if (!ordenDeBodega(orden)) {
                return false;
            }
            const anulada = ordenAnulada(orden);
            if (esOperador && anulada) {
                return false;
            }
            if (filtro === "activas" && anulada) {
                return false;
            }
            if (filtro === "anuladas" && !anulada) {
                return false;
            }
            if (!texto) {
                return true;
            }
            const hay = [
                orden.numeroOT,
                orden.cliente?.razonSocial,
                orden.comuna_orden_transporte_idComunaOrigenTocomuna?.nombreComuna,
                orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna,
                orden.estado_ot?.nombreEstado
            ].join(" ").toLowerCase();
            return hay.includes(texto);
        });
    }, [ordenes, busqueda, filtro, ordenDeBodega, esOperador]);

    // Suma kilos, m³ y bultos de las órdenes que quedaron después del filtro.
    const totalesListado = useMemo(
        () => visibles.reduce((acc, orden) => {
            const resumen = resumirDetallesCarga(orden.detalle_carga);
            acc.peso += resumen.peso || Number(orden.pesoTotal) || 0;
            acc.volumen += resumen.volumen || Number(orden.volumenTotalM3) || 0;
            acc.cantidad += resumen.cantidad;
            Object.entries(resumen.porTipo).forEach(([tipo, n]) => {
                acc.porTipo[tipo] = (acc.porTipo[tipo] || 0) + n;
            });
            return acc;
        }, { peso: 0, volumen: 0, cantidad: 0, porTipo: {} }),
        [visibles]
    );

    // Cambia un campo del formulario de edición.
    const setCampo = (campo, valor) => {
        setFormulario((prev) => ({ ...prev, [campo]: valor }));
    };

    // Abre la edición con lo que ya tiene el listado y después pide el detalle completo.
    const abrirEdicion = (orden) => {
        if (ordenAnulada(orden)) {
            aviso("Una orden anulada no se puede editar.", "error");
            return;
        }
        setOrdenActiva(orden);
        setFormulario(formularioDesdeOrden(orden));
        setOrdenImprimir(null);
        setPanel("editar");
        aviso(`Editando ${orden.numeroOT}.`, "info");
        cargarDetalle(orden)
            .then((detalle) => {
                setOrdenActiva(detalle);
                setFormulario(formularioDesdeOrden(detalle));
            })
            .catch((error) => aviso(error.message, "error"));
    };

    // Guarda dirección, contactos y documento. Prueba PUT y, si el servidor no lo acepta, PATCH.
    const guardarEdicion = async (event) => {
        event.preventDefault();
        if (!ordenActiva || !formulario) {
            return;
        }

        setGuardando(true);
        try {
            const cuerpo = {
                ...formulario,
                idComunaOrigen: Number(formulario.idComunaOrigen),
                idComunaDestino: Number(formulario.idComunaDestino),
                idDestinatario: formulario.idDestinatario
                    ? Number(formulario.idDestinatario)
                    : null
            };
            let resultado;
            try {
                resultado = await api(`/ordenes-transporte/${ordenActiva.idOrden}`, {
                    method: "PUT",
                    body: JSON.stringify(cuerpo)
                });
            } catch {
                resultado = await api(`/ordenes-transporte/${ordenActiva.idOrden}`, {
                    method: "PATCH",
                    body: JSON.stringify(cuerpo)
                });
            }
            const actualizada = resultado.orden || resultado;
            setOrdenes((prev) => prev.map((item) => (
                item.idOrden === actualizada.idOrden ? { ...item, ...actualizada } : item
            )));
            aviso(`Orden ${actualizada.numeroOT} actualizada.`, "success");
            cerrarPanel();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setGuardando(false);
        }
    };

    const confirmarDevolucion = async (orden) => {
        setGuardando(true);
        try {
            const resultado = await api("/ordenes-transporte/devolver-cliente", {
                method: "POST",
                body: JSON.stringify({ idOrden: orden.idOrden })
            });
            aviso(resultado.mensaje, "success");
            await cargar();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setGuardando(false);
        }
    };
    const abrirAnular = (orden) => {
        if (ordenAnulada(orden)) {
            aviso("La orden ya está anulada.", "error");
            return;
        }
        setOrdenActiva(orden);
        setPanel("anular");
    };

    // Confirma la anulación en el servidor y actualiza esa fila del listado.
    const confirmarAnular = async () => {
        if (!ordenActiva) {
            return;
        }
        setGuardando(true);
        try {
            const resultado = await api("/ordenes-transporte/anular", {
                method: "POST",
                body: JSON.stringify({ idOrden: ordenActiva.idOrden })
            });
            const actualizada = resultado.orden || resultado;
            setOrdenes((prev) => prev.map((item) => (
                item.idOrden === actualizada.idOrden ? { ...item, ...actualizada } : item
            )));
            aviso(resultado.mensaje || `Orden ${ordenActiva.numeroOT} anulada. El registro se conserva.`, "success");
            cerrarPanel();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setGuardando(false);
        }
    };

    // Muestra los estados que vienen de la base para no inventar nombres en la pantalla.
    const abrirEstado = (orden) => {
        setOrdenActiva(orden);
        setOrdenImprimir(null);
        setFormulario(null);
        setPanel("estado");
        aviso(`Elige el estado de ${orden.numeroOT}. Los botones salen de la base de datos.`, "info");
    };

    // Cambia el estado y recarga el listado para que la bandeja quede al día.
    const aplicarEstado = async (estado) => {
        if (!ordenActiva || !estado?.idEstado) {
            return;
        }
        setGuardando(true);
        try {
            const resultado = await api(`/ordenes-transporte/${ordenActiva.idOrden}/estado`, {
                method: "PATCH",
                body: JSON.stringify({ idEstado: estado.idEstado })
            });
            await cargar();
            aviso(resultado.mensaje || `Estado de ${ordenActiva.numeroOT} actualizado.`, "success");
            cerrarPanel();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setGuardando(false);
        }
    };

    // Carga el detalle antes de imprimir, porque el ticket y las etiquetas necesitan bultos y direcciones.
    const abrirImpresion = async (orden) => {
        setOrdenActiva(orden);
        setOrdenImprimir(null);
        setPanel("imprimir");
        aviso(`Preparando documentos de ${orden.numeroOT}...`, "info");
        try {
            const detalle = await cargarDetalle(orden);
            setOrdenImprimir(detalle);
            aviso(`Imprime primero la OT ${detalle.numeroOT} y luego las etiquetas.`, "success");
        } catch (error) {
            aviso(error.message, "error");
        }
    };

    return (
        <>
            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>OT</span>
                        <h2>Órdenes de transporte</h2>
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
                <div className="mx-toolbar">
                    <input
                        type="search"
                        placeholder="OT-000001, cliente o comuna"
                        title="Texto libre: número de OT, cliente o comuna"
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                    />
                    {esOperador ? null : (
                    <select value={filtro} onChange={(event) => setFiltro(event.target.value)}>
                        <option value="todas">Todas</option>
                        <option value="activas">Activas</option>
                        <option value="anuladas">Anuladas</option>
                    </select>
                    )}
                </div>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Cliente</th>
                                <th>Origen</th>
                                <th>Destino</th>
                                <th>Estado</th>
                                <th>Carga</th>
                                <th>Kg</th>
                                <th>m³</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="mx-empty">No hay órdenes para mostrar.</td>
                                </tr>
                            ) : visibles.map((orden) => {
                                const anulada = ordenAnulada(orden);
                                const resumen = resumirDetallesCarga(orden.detalle_carga);
                                const peso = resumen.peso || Number(orden.pesoTotal) || 0;
                                const volumen = resumen.volumen || Number(orden.volumenTotalM3) || 0;
                                return (
                                    <tr key={orden.idOrden} className={anulada ? "ot-fila-anulada" : ""}>
                                        <td>{orden.numeroOT}</td>
                                        <td>{orden.cliente?.razonSocial || "—"}</td>
                                        <td>
                                            {orden.comuna_orden_transporte_idComunaOrigenTocomuna?.nombreComuna || "—"}
                                        </td>
                                        <td>
                                            {orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna || "—"}
                                        </td>
                                        <td>
                                            <span className={anulada ? "mx-badge-anulada" : ""}>
                                                {orden.estado_ot?.nombreEstado || "—"}
                                            </span>
                                        </td>
                                        <td>{textoResumenTipos(resumen.porTipo)}</td>
                                        <td>{formatearKg(peso)}</td>
                                        <td>{formatearM3(volumen)}</td>
                                        <td>{formatearCLP(orden.valorTotal)}</td>
                                        <td>
                                            <div className="mx-acciones">
                                                <button
                                                    type="button"
                                                    className="button-secondary"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        abrirEdicion(orden);
                                                    }}
                                                    disabled={anulada}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="button-primary"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        abrirImpresion(orden);
                                                    }}
                                                >
                                                    Imprimir
                                                </button>
                                                <button
                                                    type="button"
                                                    className="button-secondary"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        abrirEstado(orden);
                                                    }}
                                                >
                                                    Estado
                                                </button>
                                                <button
                                                    type="button"
                                                    className="button-secondary"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        abrirAnular(orden);
                                                    }}
                                                    disabled={anulada}
                                                >
                                                    Anular
                                                </button>
                                                {String(orden.estado_ot?.nombreEstado || "").toUpperCase() === "DEVOLUCION_SOLICITADA" ? (
                                                    <button
                                                        type="button"
                                                        className="button-primary"
                                                        disabled={guardando}
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            confirmarDevolucion(orden);
                                                        }}
                                                    >
                                                        Devolver al cliente
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {visibles.length > 0 ? (
                            <tfoot>
                                <tr className="mx-fila-grupo">
                                    <td colSpan={5}>Totales del listado</td>
                                    <td>{textoResumenTipos(totalesListado.porTipo)}</td>
                                    <td>{formatearKg(totalesListado.peso)}</td>
                                    <td>{formatearM3(totalesListado.volumen)}</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        ) : null}
                    </table>
                </div>
            </section>

            {panel ? (
                <div className="mx-modal-fondo" onClick={cerrarPanel} role="presentation">
                    <div
                        className="mx-modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Edición de direcciones y documento. Una OT anulada no llega aquí. */}
                        {panel === "editar" && formulario && ordenActiva ? (
                            <>
                                <header className="admin-card-header">
                                    <div>
                                        <span>EDITAR</span>
                                        <h2>{ordenActiva.numeroOT}</h2>
                                    </div>
                                    <button type="button" className="button-secondary" onClick={cerrarPanel}>
                                        Cerrar
                                    </button>
                                </header>
                                <Message texto={mensaje} tipo={tipoMensaje} />
                                <p className="mx-note">Corrige los datos de la orden. La carga y los bultos se conservan.</p>
                                {(ordenActiva.detalle_carga || []).length ? (
                                    <div className="mx-table-wrap">
                                        <table className="mx-table">
                                            <thead>
                                                <tr>
                                                    <th>Tipo</th>
                                                    <th>Descripción</th>
                                                    <th>Cant.</th>
                                                    <th>Medidas</th>
                                                    <th>Peso</th>
                                                    <th>m³</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ordenActiva.detalle_carga.map((detalle) => (
                                                    <tr key={detalle.idDetalleCarga}>
                                                        <td>{detalle.tipo_bulto?.nombreTipo || "Bulto"}</td>
                                                        <td>{detalle.descripcion || "—"}</td>
                                                        <td>{detalle.cantidad}</td>
                                                        <td>{etiquetaMedidas(detalle)}</td>
                                                        <td>{formatearKg(detalle.pesoTotal || (Number(detalle.pesoUnitario) || 0) * (Number(detalle.cantidad) || 1))}</td>
                                                        <td>{formatearM3(detalle.volumenM3)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="mx-fila-grupo">
                                                    <td colSpan={2}>Total OT</td>
                                                    <td colSpan={2}>{textoResumenTipos(resumirDetallesCarga(ordenActiva.detalle_carga).porTipo)}</td>
                                                    <td>{formatearKg(resumirDetallesCarga(ordenActiva.detalle_carga).peso)}</td>
                                                    <td>{formatearM3(resumirDetallesCarga(ordenActiva.detalle_carga).volumen)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : null}
                                <form className="ot-grid" onSubmit={guardarEdicion}>
                                    <div className="field">
                                        <label>Dirección origen</label>
                                        <input
                                            {...formatos.direccion}
                                            value={formulario.direccionOrigen}
                                            onChange={(event) => setCampo("direccionOrigen", event.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Comuna origen</label>
                                        <select
                                            value={formulario.idComunaOrigen}
                                            onChange={(event) => setCampo("idComunaOrigen", event.target.value)}
                                            required
                                        >
                                            <option value="">Seleccione</option>
                                            {comunas.map((comuna) => (
                                                <option key={comuna.idComuna} value={comuna.idComuna}>
                                                    {etiquetaComuna(comuna)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Contacto origen</label>
                                        <input
                                            {...formatos.contacto}
                                            value={formulario.contactoOrigen}
                                            onChange={(event) => setCampo("contactoOrigen", event.target.value)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Teléfono origen</label>
                                        <CampoTelefono value={formulario.telefonoOrigen} onChange={(valor) => setCampo("telefonoOrigen", valor)} />
                                    </div>
                                    <div className="field">
                                        <label>Destinatario</label>
                                        <select
                                            value={formulario.idDestinatario}
                                            onChange={(event) => setCampo("idDestinatario", event.target.value)}
                                        >
                                            <option value="">Sin destinatario maestro</option>
                                            {destinatarios.map((item) => (
                                                <option key={item.idDestinatario} value={item.idDestinatario}>
                                                    {item.nombreRazonSocial}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Dirección destino</label>
                                        <input
                                            {...formatos.direccion}
                                            value={formulario.direccionDestino}
                                            onChange={(event) => setCampo("direccionDestino", event.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Comuna destino</label>
                                        <select
                                            value={formulario.idComunaDestino}
                                            onChange={(event) => setCampo("idComunaDestino", event.target.value)}
                                            required
                                        >
                                            <option value="">Seleccione</option>
                                            {comunas.map((comuna) => (
                                                <option key={comuna.idComuna} value={comuna.idComuna}>
                                                    {etiquetaComuna(comuna)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Contacto destino</label>
                                        <input
                                            {...formatos.contacto}
                                            value={formulario.contactoDestino}
                                            onChange={(event) => setCampo("contactoDestino", event.target.value)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Teléfono destino</label>
                                        <CampoTelefono value={formulario.telefonoDestino} onChange={(valor) => setCampo("telefonoDestino", valor)} />
                                    </div>
                                    <div className="field">
                                        <label>Referencia</label>
                                        <input
                                            {...formatos.referencia}
                                            value={formulario.referenciaEntrega}
                                            onChange={(event) => setCampo("referenciaEntrega", event.target.value)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Tipo de servicio</label>
                                        <select
                                            value={formulario.tipoServicio}
                                            onChange={(event) => setCampo("tipoServicio", event.target.value)}
                                        >
                                            <option value="NORMAL">Normal</option>
                                            <option value="EXPRESS">Express</option>
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Documento</label>
                                        <select
                                            value={formulario.tipoDocumento}
                                            onChange={(event) => setCampo("tipoDocumento", event.target.value)}
                                        >
                                            <option value="SIN_DOCUMENTO">Sin documento</option>
                                            <option value="FACTURA">Factura</option>
                                            <option value="GUIA">Guía</option>
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Número de documento</label>
                                        <input
                                            {...formatos.documento}
                                            value={formulario.numeroDocumento}
                                            onChange={(event) => setCampo("numeroDocumento", event.target.value)}
                                        />
                                    </div>
                                    <div className="mx-form-actions">
                                        <button type="submit" className="button-primary" disabled={guardando}>
                                            {guardando ? "Guardando..." : "Guardar cambios"}
                                        </button>
                                        <button type="button" className="button-secondary" onClick={cerrarPanel}>
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : null}

                        {/* Cambio de estado con los valores reales de la base. */}
                        {panel === "estado" && ordenActiva ? (
                            <>
                                <header className="admin-card-header">
                                    <div>
                                        <span>ESTADO</span>
                                        <h2>{ordenActiva.numeroOT}</h2>
                                    </div>
                                    <button type="button" className="button-secondary" onClick={cerrarPanel}>
                                        Cerrar
                                    </button>
                                </header>
                                <Message texto={mensaje} tipo={tipoMensaje} />
                                <p className="mx-note">
                                    Estado actual: <strong>{ordenActiva.estado_ot?.nombreEstado || "—"}</strong>.
                                    Cada botón corresponde a un registro de la tabla de estados.
                                </p>
                                {estados.length === 0 ? (
                                    <p className="mx-empty">No hay estados cargados en la base de datos.</p>
                                ) : (
                                    <div className="mx-acciones">
                                        {estados.map((estado) => {
                                            const actual = estado.idEstado === ordenActiva.idEstado
                                                || estado.nombreEstado === ordenActiva.estado_ot?.nombreEstado;
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
                            </>
                        ) : null}

                        {/* Confirmación de anulación. El registro se conserva. */}
                        {panel === "anular" && ordenActiva ? (
                            <>
                                <header className="admin-card-header">
                                    <div>
                                        <span>ANULAR</span>
                                        <h2>{ordenActiva.numeroOT}</h2>
                                    </div>
                                    <button type="button" className="button-secondary" onClick={cerrarPanel}>
                                        Cerrar
                                    </button>
                                </header>
                                <Message texto={mensaje} tipo={tipoMensaje} />
                                <p>
                                    La orden no se borra. Queda registrada en la base de datos con estado ANULADA.
                                </p>
                                <div className="mx-form-actions">
                                    <button type="button" className="button-primary" onClick={confirmarAnular} disabled={guardando}>
                                        {guardando ? "Anulando..." : "Confirmar anulación"}
                                    </button>
                                    <button type="button" className="button-secondary" onClick={cerrarPanel}>
                                        Volver
                                    </button>
                                </div>
                            </>
                        ) : null}

                        {/* Ticket y etiquetas de la OT elegida. */}
                        {panel === "imprimir" ? (
                            <>
                                <header className="admin-card-header">
                                    <div>
                                        <span>DOCUMENTOS</span>
                                        <h2>{ordenActiva?.numeroOT || "Impresión"}</h2>
                                    </div>
                                    <button type="button" className="button-secondary" onClick={cerrarPanel}>
                                        Cerrar
                                    </button>
                                </header>
                                <Message texto={mensaje} tipo={tipoMensaje} />
                                {ordenImprimir ? (
                                    <DocumentosEmision
                                        orden={ordenImprimir}
                                        onCerrar={cerrarPanel}
                                    />
                                ) : (
                                    <p className="mx-note">Cargando documentos de la OT...</p>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </>
    );
}
