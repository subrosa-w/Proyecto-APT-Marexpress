import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";
import Message from "../../components/Message.jsx";
import {
    etiquetaComuna,
    nombreCompleto,
    aInputFechaLocal,
    formatearFechaHora,
    aNumero,
    volumenPiezaM3,
    etiquetaMedidas,
    etiquetaTipoCarga,
    formatearKg,
    formatearM3,
    resumirCarga,
    textoResumenTipos
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

const aplanarBultos = (manifiesto) =>
    (manifiesto?.manifiesto_ot || []).flatMap((ot) =>
        (ot.manifiesto_carga || []).flatMap((carga) => {
            const detalle = carga.detalle_carga;
            return (carga.manifiesto_bulto || []).map((item) => {
                const bulto = item.bulto || {};
                const medidas = {
                    largoCm: bulto.largoCm ?? detalle?.largoCm,
                    anchoCm: bulto.anchoCm ?? detalle?.anchoCm,
                    altoCm: bulto.altoCm ?? detalle?.altoCm
                };
                const cantidadLinea = Math.max(1, aNumero(detalle?.cantidad) || 1);
                return {
                    ...bulto,
                    ...medidas,
                    tipo: detalle?.tipo_bulto?.nombreTipo,
                    tipoGrupo: etiquetaTipoCarga(detalle?.tipo_bulto?.nombreTipo),
                    peso: aNumero(bulto.peso ?? detalle?.pesoUnitario),
                    volumen: volumenPiezaM3({ ...bulto, ...medidas })
                        || (aNumero(detalle?.volumenM3) / cantidadLinea),
                    numeroOT: ot.orden_transporte?.numeroOT,
                    idOrden: ot.orden_transporte?.idOrden,
                    cliente: ot.orden_transporte?.cliente?.razonSocial,
                    destino: ot.orden_transporte?.destinatario?.nombreRazonSocial
                        || ot.orden_transporte?.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna
                };
            });
        })
    );

export default function ManifiestosPage() {
    const { idComuna, nombreBodega, manifiestoDeBodega } = useBodegaTrabajo();
    const scanRef = useRef(null);
    const [manifiestos, setManifiestos] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [peonetas, setPeonetas] = useState([]);
    const [comunas, setComunas] = useState([]);
    const [activo, setActivo] = useState(null);
    const [codigo, setCodigo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");
    const [cargando, setCargando] = useState(false);
    const [seleccionOt, setSeleccionOt] = useState(null);
    const [formulario, setFormulario] = useState({
        idVehiculo: "",
        idConductor: "",
        idPeoneta: "",
        idComuna: "",
        fechaSalidaProgramada: "",
        observacion: ""
    });

    const aviso = (texto, clase = "info") => {
        setMensaje(texto);
        setTipo(clase);
    };

    const cargarListado = async () => {
        const datos = await api("/manifiestos");
        setManifiestos(extraerLista(datos, "manifiestos"));
    };

    useEffect(() => {
        Promise.all([
            api("/manifiestos"),
            api("/maestros/vehiculos"),
            api("/maestros/conductores"),
            api("/maestros/peonetas"),
            api("/comunas")
        ])
            .then(([lista, camiones, choferes, ayudantes, listaComunas]) => {
                setManifiestos(extraerLista(lista, "manifiestos"));
                setVehiculos(extraerLista(camiones, "vehiculos"));
                setConductores(extraerLista(choferes, "conductores"));
                setPeonetas(extraerLista(ayudantes, "peonetas"));
                setComunas(extraerLista(listaComunas, "comunas"));
            })
            .catch((error) => aviso(error.message, "error"));
    }, []);

    useEffect(() => {
        if (idComuna) {
            setFormulario((prev) => ({ ...prev, idComuna: String(idComuna) }));
        }
    }, [idComuna]);

    useEffect(() => {
        if (activo?.estado === "PREPARACION") {
            scanRef.current?.focus();
        }
    }, [activo?.idManifiesto, activo?.estado]);

    const manifiestosVisibles = useMemo(
        () => manifiestos.filter((item) => manifiestoDeBodega(item)),
        [manifiestos, manifiestoDeBodega]
    );

    const bultosActivos = useMemo(() => aplanarBultos(activo), [activo]);
    const totalesManifiesto = useMemo(
        () => resumirCarga(bultosActivos.map((bulto) => ({
            tipo: bulto.tipoGrupo || bulto.tipo,
            cantidad: 1,
            peso: bulto.peso,
            volumen: bulto.volumen
        }))),
        [bultosActivos]
    );
    const otsEnManifiesto = useMemo(() => {
        const grupos = [];
        const indice = new Map();
        for (const bulto of bultosActivos) {
            const clave = bulto.idOrden || bulto.numeroOT;
            if (!indice.has(clave)) {
                indice.set(clave, grupos.length);
                grupos.push({
                    numeroOT: bulto.numeroOT,
                    cliente: bulto.cliente,
                    destino: bulto.destino,
                    bultos: []
                });
            }
            grupos[indice.get(clave)].bultos.push(bulto);
        }
        return grupos.map((grupo) => ({
            ...grupo,
            totales: resumirCarga(grupo.bultos.map((bulto) => ({
                tipo: bulto.tipoGrupo || bulto.tipo,
                cantidad: 1,
                peso: bulto.peso,
                volumen: bulto.volumen
            })))
        }));
    }, [bultosActivos]);
    const enPreparacion = activo?.estado === "PREPARACION";
    const puedeSalir = enPreparacion
        && activo?.idVehiculo
        && activo?.idConductor
        && formulario.idPeoneta
        && bultosActivos.length > 0;

    const ciudadSeleccionada = useMemo(
        () => comunas.find((item) => String(item.idComuna) === String(formulario.idComuna)),
        [comunas, formulario.idComuna]
    );

    const crear = async (event) => {
        event.preventDefault();
        setCargando(true);
        try {
            const resultado = await api("/manifiestos", {
                method: "POST",
                body: JSON.stringify({
                    idVehiculo: Number(formulario.idVehiculo),
                    idConductor: Number(formulario.idConductor),
                    idsPeoneta: formulario.idPeoneta ? [Number(formulario.idPeoneta)] : [],
                    idComuna: Number(formulario.idComuna),
                    fechaSalidaProgramada: formulario.fechaSalidaProgramada,
                    observacion: formulario.observacion
                })
            });
            setActivo(resultado.manifiesto);
            aviso(resultado.mensaje, "success");
            await cargarListado();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const abrir = async (manifiesto) => {
        setCargando(true);
        try {
            const detalle = await api(`/manifiestos/${manifiesto.idManifiesto}`);
            setActivo(detalle.manifiesto);
            setFormulario({
                idVehiculo: String(detalle.manifiesto.idVehiculo || ""),
                idConductor: String(detalle.manifiesto.idConductor || ""),
                idPeoneta: String(detalle.manifiesto.manifiesto_usuario?.[0]?.idUsuario || ""),
                idComuna: String(detalle.manifiesto.idComuna || ""),
                fechaSalidaProgramada: aInputFechaLocal(detalle.manifiesto.fechaSalidaProgramada),
                observacion: detalle.manifiesto.observacion || ""
            });
            aviso(`Manifiesto ${detalle.manifiesto.numeroManifiesto}`, "info");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const guardarAsignacion = async () => {
        if (!activo) {
            return;
        }
        setCargando(true);
        try {
            const resultado = await api(`/manifiestos/${activo.idManifiesto}`, {
                method: "PUT",
                body: JSON.stringify({
                    idVehiculo: Number(formulario.idVehiculo),
                    idConductor: Number(formulario.idConductor),
                    idsPeoneta: formulario.idPeoneta ? [Number(formulario.idPeoneta)] : [],
                    idComuna: Number(formulario.idComuna),
                    fechaSalidaProgramada: formulario.fechaSalidaProgramada,
                    observacion: formulario.observacion
                })
            });
            setActivo(resultado.manifiesto);
            aviso("Asignación, fecha y ciudad actualizadas.", "success");
            await cargarListado();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const escanear = async (event) => {
        event.preventDefault();
        if (!activo || !codigo.trim()) {
            return;
        }
        const codigoIngresado = codigo.trim();
        setCargando(true);
        try {
            const resultado = await api(`/manifiestos/${activo.idManifiesto}/escanear`, {
                method: "POST",
                body: JSON.stringify({ codigo: codigoIngresado })
            });
            setCodigo("");
            setActivo(resultado.manifiesto);
            aviso(resultado.mensaje, "success");
            await cargarListado();
            if (resultado.numeroOT) {
                await abrirEditorOt(resultado.numeroOT, resultado.manifiesto);
            }
        } catch (error) {
            aviso(error.message, "error");
            setCodigo("");
        } finally {
            setCargando(false);
            window.setTimeout(() => scanRef.current?.focus(), 50);
        }
    };

    const abrirEditorOt = async (numeroOT, manifiestoActual = activo) => {
        if (!manifiestoActual || !numeroOT) {
            return;
        }
        const resultado = await api(`/manifiestos/${manifiestoActual.idManifiesto}/escanear`, {
            method: "POST",
            body: JSON.stringify({ codigo: numeroOT, listar: true })
        });
        setSeleccionOt({
            numeroOT: resultado.numeroOT,
            bultos: resultado.bultos || []
        });
    };

    const alternarBultoOt = async (bulto) => {
        if (!activo || !seleccionOt) {
            return;
        }
        setCargando(true);
        try {
            if (bulto.enManifiesto) {
                const resultado = await api(`/manifiestos/${activo.idManifiesto}/bultos/${bulto.idBulto}`, {
                    method: "DELETE"
                });
                setActivo(resultado.manifiesto);
                aviso("Bulto quitado.", "success");
            } else {
                const resultado = await api(`/manifiestos/${activo.idManifiesto}/escanear`, {
                    method: "POST",
                    body: JSON.stringify({
                        codigo: seleccionOt.numeroOT,
                        idsBulto: [bulto.idBulto]
                    })
                });
                setActivo(resultado.manifiesto);
                aviso(resultado.mensaje, "success");
            }
            await abrirEditorOt(seleccionOt.numeroOT);
            await cargarListado();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
            window.setTimeout(() => scanRef.current?.focus(), 50);
        }
    };

    const quitar = async (idBulto) => {
        setCargando(true);
        try {
            const resultado = await api(`/manifiestos/${activo.idManifiesto}/bultos/${idBulto}`, {
                method: "DELETE"
            });
            setActivo(resultado.manifiesto);
            aviso("Bulto quitado.", "success");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
            scanRef.current?.focus();
        }
    };

    const salir = async () => {
        if (!activo) {
            return;
        }
        setCargando(true);
        try {
            const resultado = await api(`/manifiestos/${activo.idManifiesto}/salir`, {
                method: "POST",
                body: JSON.stringify({})
            });
            setActivo(resultado.manifiesto);
            aviso(resultado.mensaje, "success");
            await cargarListado();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    return (
        <>
            {!activo ? (
            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>DESPACHO</span>
                        <h2>Nuevo manifiesto</h2>
                    </div>
                </header>
                <Message texto={!activo ? mensaje : ""} tipo={tipo} />
                <form className="ot-grid" onSubmit={crear}>
                    <div className="field">
                        <label>Camión</label>
                        <select
                            required
                            value={formulario.idVehiculo}
                            onChange={(event) => setFormulario((prev) => ({ ...prev, idVehiculo: event.target.value }))}
                        >
                            <option value="">Seleccione patente</option>
                            {vehiculos.filter((item) => item.estado !== false).map((item) => (
                                <option key={item.idVehiculo} value={item.idVehiculo}>
                                    {item.patente} · {item.marca} {item.modelo}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Conductor</label>
                        <select
                            required
                            value={formulario.idConductor}
                            onChange={(event) => setFormulario((prev) => ({ ...prev, idConductor: event.target.value }))}
                        >
                            <option value="">Seleccione conductor</option>
                            {conductores.filter((item) => item.estado !== false).map((item) => (
                                <option key={item.idConductor} value={item.idConductor}>
                                    {item.nombre} {item.apellido}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Peoneta</label>
                        <select
                            required
                            value={formulario.idPeoneta}
                            onChange={(event) => setFormulario((prev) => ({ ...prev, idPeoneta: event.target.value }))}
                        >
                            <option value="">Seleccione peoneta</option>
                            {peonetas.map((item) => (
                                <option key={item.idUsuario} value={item.idUsuario}>
                                    {nombreCompleto(item) || item.nombreUsuario}
                                </option>
                            ))}
                        </select>
                        {peonetas.length === 0 ? (
                            <p className="mx-note">No hay peonetas activos. Créalos en Usuarios con rol PEONETA.</p>
                        ) : null}
                    </div>
                    <div className="field">
                        <label>Fecha de salida a ruta</label>
                        <input
                            type="datetime-local"
                            required
                            value={formulario.fechaSalidaProgramada}
                            onChange={(event) => setFormulario((prev) => ({ ...prev, fechaSalidaProgramada: event.target.value }))}
                        />
                    </div>
                    <div className="field">
                        <label>Ciudad de la ruta</label>
                        <select
                            required
                            value={formulario.idComuna}
                            onChange={(event) => setFormulario((prev) => ({ ...prev, idComuna: event.target.value }))}
                        >
                            <option value="">Seleccione ciudad</option>
                            {comunas.map((comuna) => (
                                <option key={comuna.idComuna} value={comuna.idComuna}>
                                    {etiquetaComuna(comuna)}
                                </option>
                            ))}
                        </select>
                    </div>
                    {ciudadSeleccionada ? (
                        <div className="mx-ciudad-info">
                            <p><span>Ciudad</span><strong>{ciudadSeleccionada.nombreComuna}</strong></p>
                            <p><span>Región</span><strong>{ciudadSeleccionada.region?.nombreRegion || "—"}</strong></p>
                            <p><span>Estado</span><strong>{ciudadSeleccionada.estado === false ? "Inactiva" : "Activa"}</strong></p>
                            {(ciudadSeleccionada.sucursal || []).length ? (
                                <p>
                                    <span>Sucursales</span>
                                    <strong>
                                        {ciudadSeleccionada.sucursal.map((item) => `${item.nombreSucursal} · ${item.direccion}${item.telefono ? ` · ${item.telefono}` : ""}`).join(" | ")}
                                    </strong>
                                </p>
                            ) : (
                                <p><span>Sucursales</span><strong>Sin sucursal MAREXPRESS en esta ciudad</strong></p>
                            )}
                        </div>
                    ) : null}
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                        <label>Observación</label>
                        <input
                            value={formulario.observacion}
                            onChange={(event) => setFormulario((prev) => ({ ...prev, observacion: event.target.value }))}
                            placeholder="Ruta, sector o nota"
                        />
                    </div>
                    <div className="mx-form-actions">
                        <button type="submit" className="button-primary" disabled={cargando}>
                            {cargando ? "Creando..." : "Crear manifiesto"}
                        </button>
                    </div>
                </form>
            </section>
            ) : null}

            {activo ? (
                <section className="admin-card operador-card">
                    <header className="admin-card-header">
                        <div>
                            <span>{activo.estado}</span>
                            <h2>{activo.numeroManifiesto}</h2>
                        </div>
                        <button type="button" className="button-secondary" onClick={() => setActivo(null)}>Cerrar</button>
                    </header>
                    <Message texto={mensaje} tipo={tipo} />
                    <p className="mx-note">
                        Sale {formatearFechaHora(activo.fechaSalidaProgramada)} · {etiquetaComuna(activo.comuna) || "Sin ciudad"} · Camión {activo.vehiculo?.patente || "—"} · Conductor {activo.conductor ? `${activo.conductor.nombre} ${activo.conductor.apellido}` : "—"} · Peonetas {(activo.manifiesto_usuario || []).map((item) => nombreCompleto(item.usuario)).join(", ") || "—"}
                    </p>
                    {enPreparacion ? (
                        <div className="ot-grid">
                            <div className="field">
                                <label>Camión</label>
                                <select
                                    required
                                    value={formulario.idVehiculo}
                                    onChange={(event) => setFormulario((prev) => ({ ...prev, idVehiculo: event.target.value }))}
                                >
                                    <option value="">Seleccione patente</option>
                                    {vehiculos.filter((item) => item.estado !== false).map((item) => (
                                        <option key={item.idVehiculo} value={item.idVehiculo}>
                                            {item.patente} · {item.marca} {item.modelo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Conductor</label>
                                <select
                                    required
                                    value={formulario.idConductor}
                                    onChange={(event) => setFormulario((prev) => ({ ...prev, idConductor: event.target.value }))}
                                >
                                    <option value="">Seleccione conductor</option>
                                    {conductores.filter((item) => item.estado !== false).map((item) => (
                                        <option key={item.idConductor} value={item.idConductor}>
                                            {item.nombre} {item.apellido}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Peoneta</label>
                                <select
                                    required
                                    value={formulario.idPeoneta}
                                    onChange={(event) => setFormulario((prev) => ({ ...prev, idPeoneta: event.target.value }))}
                                >
                                    <option value="">Seleccione peoneta</option>
                                    {peonetas.map((item) => (
                                        <option key={item.idUsuario} value={item.idUsuario}>
                                            {nombreCompleto(item) || item.nombreUsuario}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Fecha de salida a ruta</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formulario.fechaSalidaProgramada}
                                    onChange={(event) => setFormulario((prev) => ({ ...prev, fechaSalidaProgramada: event.target.value }))}
                                />
                            </div>
                            <div className="field">
                                <label>Ciudad de la ruta</label>
                                <select
                                    required
                                    value={formulario.idComuna}
                                    onChange={(event) => setFormulario((prev) => ({ ...prev, idComuna: event.target.value }))}
                                >
                                    <option value="">Seleccione ciudad</option>
                                    {comunas.map((comuna) => (
                                        <option key={comuna.idComuna} value={comuna.idComuna}>
                                            {etiquetaComuna(comuna)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : null}
                    {activo.comuna ? (
                        <div className="mx-ciudad-info">
                            <p><span>Ciudad</span><strong>{activo.comuna.nombreComuna}</strong></p>
                            <p><span>Región</span><strong>{activo.comuna.region?.nombreRegion || "—"}</strong></p>
                            <p><span>Salida programada</span><strong>{formatearFechaHora(activo.fechaSalidaProgramada)}</strong></p>
                            <p><span>Salida real</span><strong>{formatearFechaHora(activo.fechaSalida)}</strong></p>
                            {(activo.comuna.sucursal || []).length ? (
                                <p>
                                    <span>Sucursales</span>
                                    <strong>
                                        {activo.comuna.sucursal.map((item) => `${item.nombreSucursal} · ${item.direccion}${item.telefono ? ` · ${item.telefono}` : ""}`).join(" | ")}
                                    </strong>
                                </p>
                            ) : (
                                <p><span>Sucursales</span><strong>Sin sucursal MAREXPRESS en esta ciudad</strong></p>
                            )}
                        </div>
                    ) : null}

                    {enPreparacion ? (
                        <>
                            <div className="mx-form-actions">
                                <button type="button" className="button-secondary" onClick={guardarAsignacion} disabled={cargando}>
                                    Guardar asignación
                                </button>
                                <button type="button" className="button-primary" onClick={salir} disabled={!puedeSalir || cargando}>
                                    Sacar a ruta
                                </button>
                            </div>
                            <form className="mx-scan" onSubmit={escanear}>
                                <label htmlFor="scan-ean">Pistola / código EAN del bulto o OT</label>
                                <input
                                    id="scan-ean"
                                    ref={scanRef}
                                    value={codigo}
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="Escanea la etiqueta y presiona Enter"
                                    onChange={(event) => setCodigo(event.target.value)}
                                />
                                <button type="submit" className="button-primary" disabled={cargando || !codigo.trim()}>
                                    Cargar
                                </button>
                            </form>
                            <p className="mx-note">
                                Al ingresar una OT se cargan todos sus bultos. Luego selecciona esa OT para marcar cuáles van y cuáles no.
                            </p>
                            {seleccionOt ? (
                                <div className="mx-table-wrap" style={{ marginTop: 12 }}>
                                    <p className="mx-note">
                                        {seleccionOt.numeroOT}: desmarca los que no viajan ahora. Puedes volver a marcarlos si se quedan en este manifiesto.
                                    </p>
                                    <table className="mx-table">
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>Bulto</th>
                                                <th>Tipo</th>
                                                <th>Medidas</th>
                                                <th>Peso</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {seleccionOt.bultos.map((bulto) => (
                                                <tr key={bulto.idBulto}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(bulto.enManifiesto)}
                                                            disabled={cargando}
                                                            onChange={() => alternarBultoOt(bulto)}
                                                        />
                                                    </td>
                                                    <td>{bulto.codigoBulto}</td>
                                                    <td>{bulto.tipo}</td>
                                                    <td>{etiquetaMedidas(bulto)}</td>
                                                    <td>{formatearKg(bulto.peso)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="mx-form-actions">
                                        <button type="button" className="button-secondary" onClick={() => setSeleccionOt(null)}>
                                            Listo
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <p className="mx-note">Este manifiesto ya salió a ruta. No se pueden escanear más bultos.</p>
                    )}

                    {bultosActivos.length > 0 ? (
                        <div className="mx-ciudad-info">
                            <p><span>Carga total</span><strong>{textoResumenTipos(totalesManifiesto.porTipo)}</strong></p>
                            <p><span>Kilaje</span><strong>{formatearKg(totalesManifiesto.peso)}</strong></p>
                            <p><span>Volumen</span><strong>{formatearM3(totalesManifiesto.volumen)}</strong></p>
                            <p><span>Órdenes</span><strong>{otsEnManifiesto.length}</strong></p>
                        </div>
                    ) : null}

                    <div className="mx-table-wrap">
                        <table className="mx-table">
                            <thead>
                                <tr>
                                    <th>Bulto</th>
                                    <th>Tipo</th>
                                    <th>Medidas</th>
                                    <th>Peso</th>
                                    <th>m³</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bultosActivos.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="mx-empty">Escanea bultos u OT para cargarlos al manifiesto.</td>
                                    </tr>
                                ) : otsEnManifiesto.flatMap((grupo) => [
                                    <tr
                                        key={`ot-${grupo.numeroOT}`}
                                        className="mx-fila-grupo"
                                        style={enPreparacion ? { cursor: "pointer" } : undefined}
                                        onClick={() => {
                                            if (!enPreparacion) {
                                                return;
                                            }
                                            if (seleccionOt?.numeroOT === grupo.numeroOT) {
                                                setSeleccionOt(null);
                                                return;
                                            }
                                            abrirEditorOt(grupo.numeroOT).catch((error) => aviso(error.message, "error"));
                                        }}
                                    >
                                        <td colSpan={6}>
                                            <strong>{grupo.numeroOT}</strong>
                                            {enPreparacion ? " · clic para elegir bultos" : ""}
                                            {" · "}
                                            {grupo.cliente || "Sin cliente"}
                                            {" · "}
                                            {grupo.destino || "Sin destino"}
                                            {" · "}
                                            {textoResumenTipos(grupo.totales.porTipo)}
                                            {" · "}
                                            {formatearKg(grupo.totales.peso)}
                                            {" · "}
                                            {formatearM3(grupo.totales.volumen)}
                                        </td>
                                    </tr>,
                                    ...grupo.bultos.map((bulto) => (
                                        <tr key={bulto.idBulto}>
                                            <td>{bulto.codigoBulto}</td>
                                            <td>{bulto.tipo || bulto.tipoGrupo}</td>
                                            <td>{etiquetaMedidas(bulto)}</td>
                                            <td>{formatearKg(bulto.peso)}</td>
                                            <td>{formatearM3(bulto.volumen)}</td>
                                            <td>
                                                {enPreparacion ? (
                                                    <button type="button" className="button-secondary" onClick={() => quitar(bulto.idBulto)}>
                                                        Quitar
                                                    </button>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))
                                ])}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>HISTORIAL</span>
                        <h2>Manifiestos</h2>
                    </div>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Estado</th>
                                <th>Salida</th>
                                <th>Ciudad</th>
                                <th>Camión</th>
                                <th>Conductor</th>
                                <th>Peonetas</th>
                                <th>Carga</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {manifiestosVisibles.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="mx-empty">
                                        No hay manifiestos de {nombreBodega || "esta bodega"}.
                                    </td>
                                </tr>
                            ) : manifiestosVisibles.map((item) => {
                                const bultos = aplanarBultos(item);
                                const totales = resumirCarga(bultos.map((bulto) => ({
                                    tipo: bulto.tipoGrupo || bulto.tipo,
                                    cantidad: 1,
                                    peso: bulto.peso,
                                    volumen: bulto.volumen
                                })));
                                return (
                                <tr key={item.idManifiesto}>
                                    <td>{item.numeroManifiesto}</td>
                                    <td>{item.estado}</td>
                                    <td>{formatearFechaHora(item.fechaSalidaProgramada)}</td>
                                    <td>{etiquetaComuna(item.comuna) || "—"}</td>
                                    <td>{item.vehiculo?.patente || "—"}</td>
                                    <td>{item.conductor ? `${item.conductor.nombre} ${item.conductor.apellido}` : "—"}</td>
                                    <td>{(item.manifiesto_usuario || []).map((asig) => nombreCompleto(asig.usuario)).join(", ") || "—"}</td>
                                    <td>
                                        {totales.cantidad
                                            ? `${textoResumenTipos(totales.porTipo)} · ${formatearKg(totales.peso)} · ${formatearM3(totales.volumen)}`
                                            : "—"}
                                    </td>
                                    <td>
                                        <button type="button" className="button-secondary" onClick={() => abrir(item)}>
                                            Abrir
                                        </button>
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
