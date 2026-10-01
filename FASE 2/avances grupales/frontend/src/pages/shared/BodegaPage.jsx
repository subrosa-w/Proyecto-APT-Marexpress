import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";
import Message from "../../components/Message.jsx";
import { ordenAnulada } from "../../utils.js";

const extraerLista = (datos, clave) => {
    if (Array.isArray(datos)) {
        return datos;
    }
    if (Array.isArray(datos?.[clave])) {
        return datos[clave];
    }
    return [];
};

const etiquetaEstado = (estado) => {
    const mapa = {
        EN_BODEGA: "En bodega",
        EN_TRASLADO: "En traslado",
        ASIGNADO_MANIFIESTO: "En manifiesto",
        EN_TRANSITO: "En tránsito",
        ENTREGADO: "Entregado"
    };
    return mapa[estado] || estado || "—";
};

export default function BodegaPage() {
    const { idSucursal: idBodegaTrabajo, nombreBodega } = useBodegaTrabajo();
    const [bultos, setBultos] = useState([]);
    const [resumen, setResumen] = useState({ total: 0, enBodega: 0, enTraslado: 0, sinUbicacion: 0 });
    const [sucursales, setSucursales] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [estado, setEstado] = useState("EN_BODEGA");
    const [idSucursal, setIdSucursal] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");
    const [cargando, setCargando] = useState(false);
    const [recibiendo, setRecibiendo] = useState(null);
    const [sucursalIngreso, setSucursalIngreso] = useState("");
    const [scanReingreso, setScanReingreso] = useState("");
    const scanRef = useRef(null);

    const aviso = (texto, clase = "info") => {
        setMensaje(texto);
        setTipo(clase);
    };

    const cargar = async () => {
        const params = new URLSearchParams();
        if (estado) {
            params.set("estado", estado);
        }
        if (idSucursal) {
            params.set("idSucursal", idSucursal);
        }
        if (busqueda.trim()) {
            params.set("q", busqueda.trim());
        }

        const inventario = await api(`/bultos/bodega?${params.toString()}`);
        setBultos(extraerLista(inventario, "bultos"));
        setResumen(inventario.resumen || { total: 0, enBodega: 0, enTraslado: 0, sinUbicacion: 0 });
    };

    useEffect(() => {
        api("/bultos/sucursales")
            .then((datos) => setSucursales(extraerLista(datos, "sucursales")))
            .catch((error) => aviso(error.message, "error"));
    }, []);

    useEffect(() => {
        if (idBodegaTrabajo) {
            setIdSucursal(String(idBodegaTrabajo));
            setSucursalIngreso(String(idBodegaTrabajo));
        }
    }, [idBodegaTrabajo]);

    useEffect(() => {
        setCargando(true);
        cargar()
            .catch((error) => aviso(error.message, "error"))
            .finally(() => setCargando(false));
    }, [estado, idSucursal]);

    const buscar = (event) => {
        event.preventDefault();
        setCargando(true);
        cargar()
            .catch((error) => aviso(error.message, "error"))
            .finally(() => setCargando(false));
    };

    const sucursalPorDefecto = useMemo(
        () => sucursalIngreso || (idBodegaTrabajo ? String(idBodegaTrabajo) : ""),
        [sucursalIngreso, idBodegaTrabajo]
    );

    const bultosVisibles = useMemo(
        () => bultos.filter((bulto) => !ordenAnulada(bulto.detalle_carga?.orden_transporte)),
        [bultos]
    );

    const kpis = useMemo(() => ({
        enBodega: bultosVisibles.filter((item) => item.estado === "EN_BODEGA").length,
        sinUbicacion: bultosVisibles.filter((item) => item.estado === "EN_BODEGA" && !item.idSucursalActual).length,
        enTraslado: bultosVisibles.filter((item) => item.estado === "EN_TRASLADO").length,
        total: bultosVisibles.length
    }), [bultosVisibles]);

    const ingresarBulto = async (bulto) => {
        if (!sucursalPorDefecto) {
            aviso("No hay sucursales activas para ingresar el bulto.", "error");
            return;
        }
        setRecibiendo(bulto.idBulto);
        try {
            await api(`/bultos/${bulto.idBulto}/recibir`, {
                method: "POST",
                body: JSON.stringify({
                    idSucursal: Number(sucursalPorDefecto),
                    observacion: "Ingreso a bodega"
                })
            });
            aviso(`${bulto.codigoBulto} ingresado a bodega.`, "success");
            await cargar();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setRecibiendo(null);
        }
    };

    const reingresarRechazo = async (event) => {
        event.preventDefault();
        const codigo = scanReingreso.trim();
        if (!codigo) {
            return;
        }
        if (!sucursalPorDefecto) {
            aviso("Selecciona la sucursal de ingreso.", "error");
            return;
        }
        setCargando(true);
        try {
            const resultado = await api("/ordenes-transporte/reingreso-bodega", {
                method: "POST",
                body: JSON.stringify({
                    codigo,
                    idSucursal: Number(sucursalPorDefecto)
                })
            });
            aviso(resultado.mensaje, "success");
            setScanReingreso("");
            await cargar();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
            scanRef.current?.focus();
        }
    };

    return (
        <>
            <section className="operador-kpis admin-kpis">
                <article className="operador-kpi admin-kpi">
                    <span>En bodega</span>
                    <strong>{kpis.enBodega}</strong>
                    <small>{nombreBodega || "Bodega de trabajo"}</small>
                </article>
                <article className="operador-kpi admin-kpi">
                    <span>Sin ubicación</span>
                    <strong>{kpis.sinUbicacion}</strong>
                    <small>Pendientes de sucursal</small>
                </article>
                <article className="operador-kpi admin-kpi">
                    <span>En traslado</span>
                    <strong>{kpis.enTraslado}</strong>
                    <small>Movimientos entre sucursales</small>
                </article>
                <article className="operador-kpi admin-kpi">
                    <span>Total bultos</span>
                    <strong>{kpis.total}</strong>
                    <small>En esta bodega</small>
                </article>
            </section>

            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>INVENTARIO</span>
                        <h2>Bultos en bodega</h2>
                    </div>
                </header>
                <Message texto={mensaje} tipo={tipo} />
                <form className="mx-scan" onSubmit={reingresarRechazo}>
                    <label htmlFor="scan-rechazo">Reingreso de OT rechazada (pistola / OT o bulto)</label>
                    <input
                        id="scan-rechazo"
                        ref={scanRef}
                        value={scanReingreso}
                        autoComplete="off"
                        placeholder="Escanea la OT rechazada y presiona Enter"
                        onChange={(event) => setScanReingreso(event.target.value)}
                    />
                    <button type="submit" className="button-primary" disabled={cargando || !scanReingreso.trim()}>
                        Ingresar
                    </button>
                </form>
                <form className="mx-toolbar" onSubmit={buscar}>
                    <input
                        type="search"
                        placeholder="Buscar por código de bulto u OT"
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                    />
                    <select value={estado} onChange={(event) => setEstado(event.target.value)}>
                        <option value="EN_BODEGA">En bodega</option>
                        <option value="EN_TRASLADO">En traslado</option>
                        <option value="TODAS">Todos los estados</option>
                    </select>
                    <p className="mx-note" style={{ margin: 0 }}>
                        Inventario de {nombreBodega || "la bodega seleccionada"}.
                    </p>
                    <button type="submit" className="button-secondary" disabled={cargando}>
                        {cargando ? "Cargando..." : "Actualizar"}
                    </button>
                </form>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Bulto</th>
                                <th>OT</th>
                                <th>Cliente</th>
                                <th>Destino</th>
                                <th>Tipo</th>
                                <th>Peso</th>
                                <th>Sucursal</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {bultosVisibles.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="mx-empty">
                                        {cargando ? "Cargando inventario..." : "No hay bultos para este filtro."}
                                    </td>
                                </tr>
                            ) : bultosVisibles.map((bulto) => {
                                const orden = bulto.detalle_carga?.orden_transporte;
                                const pendiente = bulto.estado === "EN_BODEGA" && !bulto.idSucursalActual;
                                return (
                                    <tr key={bulto.idBulto}>
                                        <td>{bulto.codigoBulto}</td>
                                        <td>{orden?.numeroOT || "—"}</td>
                                        <td>{orden?.cliente?.razonSocial || "—"}</td>
                                        <td>
                                            {orden?.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna
                                                || orden?.direccionDestino
                                                || "—"}
                                        </td>
                                        <td>{bulto.detalle_carga?.tipo_bulto?.nombreTipo || "—"}</td>
                                        <td>{bulto.peso ? `${bulto.peso} kg` : "—"}</td>
                                        <td>{bulto.sucursal?.nombreSucursal || "Sin ubicación"}</td>
                                        <td>{etiquetaEstado(bulto.estado)}</td>
                                        <td>
                                            {pendiente ? (
                                                <button
                                                    type="button"
                                                    className="button-primary"
                                                    disabled={recibiendo === bulto.idBulto}
                                                    onClick={() => ingresarBulto(bulto)}
                                                >
                                                    {recibiendo === bulto.idBulto ? "Ingresando..." : "Ingresar"}
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
