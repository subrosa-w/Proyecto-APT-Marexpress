import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";
import Message from "../../components/Message.jsx";
import {
    esRechazoEntrega,
    motivoRechazoOrden,
    ordenAnulada,
    resumirDetallesCarga,
    textoResumenTipos,
    etiquetaMedidas,
    formatearKg,
    formatearM3,
    formatearCLP,
    formatearFechaHora,
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

const vacio = {
    cliente: "",
    rutRemitente: "",
    direccionOrigen: "",
    origen: "",
    destinatario: "",
    rutDestinatario: "",
    destino: "",
    direccionDestino: "",
    tipoDocumento: "",
    numeroDocumento: ""
};

const ordenRechazada = (orden) => {
    if (!orden) {
        return false;
    }
    if (esRechazoEntrega(orden.estado_ot?.nombreEstado)) {
        return true;
    }
    const entregas = [
        ...(orden.entrega_ot || []),
        ...(orden.manifiesto_ot || []).map((item) => item.entrega_ot).filter(Boolean)
    ];
    return entregas.some((item) => esRechazoEntrega(item.resultadoEntrega));
};

export default function RecepcionPage() {
    const { idSucursal: idBodegaTrabajo, nombreBodega } = useBodegaTrabajo();
    const scanRef = useRef(null);
    const [searchParams] = useSearchParams();
    const [numeroOT, setNumeroOT] = useState(searchParams.get("ot") || "");
    const [orden, setOrden] = useState(null);
    const [datos, setDatos] = useState(vacio);
    const [sucursales, setSucursales] = useState([]);
    const [idSucursal, setIdSucursal] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");
    const [cargando, setCargando] = useState(false);

    const mapearOrden = (resultado) => {
        setOrden(resultado);
        setDatos({
            cliente: resultado.cliente?.razonSocial || "",
            rutRemitente: resultado.cliente?.rut || "",
            direccionOrigen: resultado.direccionOrigen || "",
            origen: resultado.comuna_orden_transporte_idComunaOrigenTocomuna?.nombreComuna || "",
            destinatario: resultado.destinatario?.nombreRazonSocial || resultado.contactoDestino || "",
            rutDestinatario: resultado.destinatario?.rut || "",
            destino: resultado.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna || "",
            direccionDestino: resultado.direccionDestino || "",
            tipoDocumento: resultado.tipoDocumento || "",
            numeroDocumento: resultado.numeroDocumento || ""
        });
    };

    useEffect(() => {
        api("/bultos/sucursales")
            .then((datosSucursal) => {
                const lista = extraerLista(datosSucursal, "sucursales");
                setSucursales(lista);
            })
            .catch(() => setSucursales([]));
        scanRef.current?.focus();
    }, []);

    useEffect(() => {
        if (idBodegaTrabajo) {
            setIdSucursal(String(idBodegaTrabajo));
        }
    }, [idBodegaTrabajo]);

    const cargarOrden = async (valor) => {
        const codigo = String(valor || "").trim();
        if (!codigo) {
            return;
        }
        setCargando(true);
        setMensaje("");
        try {
            let resultado = null;
            try {
                resultado = await api(`/ordenes-transporte/numero/${encodeURIComponent(codigo)}?registrar=1`);
            } catch {
                const bultos = await api(`/bultos/bodega?q=${encodeURIComponent(codigo)}&estado=TODAS`);
                const lista = extraerLista(bultos, "bultos");
                const idOrden = lista[0]?.detalle_carga?.orden_transporte?.idOrden;
                if (idOrden) {
                    resultado = await api(`/ordenes-transporte/${idOrden}?registrar=1`);
                }
            }
            if (!resultado?.numeroOT) {
                throw new Error("No se encontró la OT ni el bulto escaneado");
            }
            if (ordenAnulada(resultado)) {
                setOrden(null);
                setDatos(vacio);
                setNumeroOT(resultado.numeroOT);
                throw new Error(`La ${resultado.numeroOT} está anulada y no aparece en operación`);
            }
            mapearOrden(resultado);
            setNumeroOT(resultado.numeroOT);
            if (ordenRechazada(resultado)) {
                setMensaje(`OT ${resultado.numeroOT} rechazada. Motivo: ${motivoRechazoOrden(resultado) || "sin detalle"}. Ingrésala a bodega.`);
                setTipo("info");
            } else {
                setMensaje(`Orden ${resultado.numeroOT} encontrada. Evento registrado en seguimiento.`);
                setTipo("success");
            }
        } catch (error) {
            setOrden(null);
            setDatos(vacio);
            setMensaje(error.message);
            setTipo("error");
        } finally {
            setCargando(false);
            window.setTimeout(() => scanRef.current?.focus(), 50);
        }
    };

    useEffect(() => {
        const inicial = searchParams.get("ot");
        if (inicial) {
            setNumeroOT(inicial);
            cargarOrden(inicial);
        }
    }, [searchParams]);

    const buscar = (event) => {
        event.preventDefault();
        cargarOrden(numeroOT);
    };

    const ingresar = async () => {
        if (!orden || !idSucursal) {
            setMensaje("Selecciona la sucursal de ingreso.");
            setTipo("error");
            return;
        }
        setCargando(true);
        try {
            const resultado = await api("/ordenes-transporte/reingreso-bodega", {
                method: "POST",
                body: JSON.stringify({
                    codigo: numeroOT.trim() || orden.numeroOT,
                    idSucursal: Number(idSucursal)
                })
            });
            if (resultado.orden) {
                mapearOrden(resultado.orden);
            }
            setMensaje(resultado.mensaje);
            setTipo("success");
        } catch (error) {
            setMensaje(error.message);
            setTipo("error");
        } finally {
            setCargando(false);
            window.setTimeout(() => scanRef.current?.focus(), 50);
        }
    };

    const rechazada = ordenRechazada(orden);
    const resumen = useMemo(() => resumirDetallesCarga(orden?.detalle_carga), [orden]);
    const bultos = useMemo(
        () => (orden?.detalle_carga || []).flatMap((detalle) =>
            (detalle.bulto || []).map((bulto) => ({
                ...bulto,
                tipo: detalle.tipo_bulto?.nombreTipo,
                descripcion: detalle.descripcion,
                largoCm: bulto.largoCm ?? detalle.largoCm,
                anchoCm: bulto.anchoCm ?? detalle.anchoCm,
                altoCm: bulto.altoCm ?? detalle.altoCm,
                peso: bulto.peso ?? detalle.pesoUnitario
            }))
        ),
        [orden]
    );
    const historial = useMemo(() => lineaTiempoOt(orden), [orden]);

    const campos = useMemo(() => ([
        ["Cliente / Remitente", datos.cliente],
        ["RUT remitente", datos.rutRemitente],
        ["Dirección de origen", datos.direccionOrigen],
        ["Ciudad origen", datos.origen],
        ["Destinatario", datos.destinatario],
        ["RUT destinatario", datos.rutDestinatario],
        ["Ciudad destino", datos.destino],
        ["Dirección final de entrega", datos.direccionDestino]
    ]), [datos]);

    return (
        <>
            <section className="operador-card">
                <header className="operador-card-header">
                    <div>
                        <span>IDENTIFICACIÓN</span>
                        <h2>Orden de transporte</h2>
                    </div>
                </header>
                <form className="operador-form-grid" onSubmit={buscar}>
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                        <label htmlFor="recepcion-ot">Pistola / número de OT o código de bulto</label>
                        <input
                            id="recepcion-ot"
                            ref={scanRef}
                            value={numeroOT}
                            autoComplete="off"
                            autoFocus
                            onChange={(e) => setNumeroOT(e.target.value)}
                            placeholder="Escanea la OT o la etiqueta y presiona Enter"
                        />
                    </div>
                    <div className="mx-form-actions">
                        <button className="button-primary" type="submit" disabled={cargando}>
                            {cargando ? "Buscando..." : "Buscar / escanear"}
                        </button>
                    </div>
                </form>
                <Message texto={mensaje} tipo={tipo} />
                {rechazada ? (
                    <div className="mx-ciudad-info">
                        <p><span>Estado</span><strong>Rechazada</strong></p>
                        <p><span>Motivo</span><strong>{motivoRechazoOrden(orden) || "Sin motivo"}</strong></p>
                        <p><span>Sucursal de ingreso</span>
                            <strong>
                                <select
                                    value={idSucursal}
                                    disabled={Boolean(idBodegaTrabajo)}
                                    onChange={(event) => setIdSucursal(event.target.value)}
                                >
                                    <option value="">Seleccione sucursal</option>
                                    {sucursales.map((sucursal) => (
                                        <option key={sucursal.idSucursal} value={sucursal.idSucursal}>
                                            {sucursal.nombreSucursal}
                                        </option>
                                    ))}
                                </select>
                            </strong>
                        </p>
                    </div>
                ) : null}
                {rechazada ? (
                    <div className="mx-form-actions">
                        <button type="button" className="button-primary" onClick={ingresar} disabled={cargando || !idSucursal}>
                            {cargando ? "Ingresando..." : "Ingresar a bodega"}
                        </button>
                    </div>
                ) : null}
                <div className="operador-form-grid">
                    {campos.map(([label, value]) => (
                        <div className="field" key={label}>
                            <label>{label}</label>
                            <input value={value} readOnly />
                        </div>
                    ))}
                </div>
            </section>

            <section className="operador-card">
                <header className="operador-card-header">
                    <div>
                        <span>DOCUMENTO</span>
                        <h2>Información asociada</h2>
                    </div>
                </header>
                <div className="operador-form-grid">
                    <div className="field">
                        <label>Tipo de documento</label>
                        <input value={datos.tipoDocumento} readOnly />
                    </div>
                    <div className="field">
                        <label>Número de documento</label>
                        <input value={datos.numeroDocumento} readOnly />
                    </div>
                    <div className="field">
                        <label>Valor del envío</label>
                        <input value={orden ? formatearCLP(orden.valorTotal) : ""} readOnly />
                    </div>
                    <div className="field">
                        <label>Carga</label>
                        <input
                            value={orden ? `${textoResumenTipos(resumen.porTipo)} · ${formatearKg(resumen.peso)} · ${formatearM3(resumen.volumen)}` : ""}
                            readOnly
                        />
                    </div>
                </div>
            </section>

            {orden ? (
                <section className="operador-card">
                    <header className="operador-card-header">
                        <div>
                            <span>CARGA</span>
                            <h2>{resumen.cantidad || 0} bulto{(resumen.cantidad || 0) === 1 ? "" : "s"}</h2>
                        </div>
                    </header>
                    <div className="mx-table-wrap">
                        <table className="mx-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Medidas</th>
                                    <th>Peso</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bultos.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="mx-empty">Esta OT no tiene bultos registrados.</td>
                                    </tr>
                                ) : bultos.map((bulto) => (
                                    <tr key={bulto.idBulto || bulto.codigoBulto}>
                                        <td>{bulto.codigoBulto}</td>
                                        <td>{bulto.tipo || "—"}</td>
                                        <td>{bulto.descripcion || "—"}</td>
                                        <td>{etiquetaMedidas(bulto)}</td>
                                        <td>{bulto.peso ? formatearKg(bulto.peso) : "—"}</td>
                                        <td>{bulto.estado || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {orden ? (
                <section className="operador-card">
                    <header className="operador-card-header">
                        <div>
                            <span>SEGUIMIENTO</span>
                            <h2>Historial de la OT</h2>
                        </div>
                    </header>
                    <div className="mx-table-wrap">
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
                                {historial.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="mx-empty">Aún no hay eventos de seguimiento.</td>
                                    </tr>
                                ) : historial.map((item) => (
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
                </section>
            ) : null}
        </>
    );
}
