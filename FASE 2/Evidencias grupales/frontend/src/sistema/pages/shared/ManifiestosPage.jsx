/*
  VISTA: manifiestos
  RUTAS: /administrador/manifiestos y /operador/manifiestos
  CSS: admin-card, mx-table, modal
  API: /api/manifiestos
  FUNCIONES: arma la carga, el camión, el conductor y los peonetas
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api.js";
import { PREFIJO_OT, codigoConPrefijo } from "../../entrada.jsx";
import { guardarBorrador, leerBorrador } from "../../borrador.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";
import { useAuth } from "../../auth.jsx";
import { imprimirManifiesto } from "../../utils/impresionManifiesto.js";
import Message from "../../components/Message.jsx";
import {
    etiquetaComuna,
    nombreCompleto,
    aInputFechaLocal,
    formatearFechaHora,
    formatearCLP,
    aNumero,
    volumenPiezaM3,
    etiquetaMedidas,
    etiquetaTipoCarga,
    formatearKg,
    formatearM3,
    resumirCarga,
    textoResumenTipos
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

const textoEstado = (estado) => ({
    PREPARACION: "En preparación",
    EN_RUTA: "En ruta",
    FINALIZADO: "Finalizado",
    CANCELADO: "Cancelado"
}[estado] || estado || "—");

// Baja los bultos anidados del manifiesto a una lista plana, con OT, kilos y medidas, para la tabla.
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
    const { usuario } = useAuth();
    const esAdmin = usuario?.rol === "ADMINISTRADOR";
    const scanRef = useRef(null);
    const manifiestoRestaurado = useRef(false);
    const [borradorManifiesto] = useState(() => leerBorrador("manifiesto") || {});
    const [manifiestos, setManifiestos] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [peonetas, setPeonetas] = useState([]);
    const [comunas, setComunas] = useState([]);
    const [activo, setActivo] = useState(null);
    const [codigo, setCodigo] = useState(() => (leerBorrador("manifiesto") || {}).codigo || PREFIJO_OT);
    const [enBodega, setEnBodega] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");
    const [cargando, setCargando] = useState(false);
    const [creando, setCreando] = useState(false);
    const [seleccionOt, setSeleccionOt] = useState(null);
    const [otAbierta, setOtAbierta] = useState(null);
    const [formulario, setFormulario] = useState(() => (leerBorrador("manifiesto") || {}).formulario || {
        idVehiculo: "",
        idConductor: "",
        idPeoneta: "",
        idComuna: "",
        fechaSalidaProgramada: "",
        observacion: "",
        tipoManifiesto: "REPARTO"
    });

    // Aviso único de la pantalla.
    const aviso = (texto, clase = "info") => {
        setMensaje(texto);
        setTipo(clase);
    };

    // Vuelve a leer los manifiestos después de crear, escanear o dar salida.
    const cargarListado = async () => {
        const datos = await api("/manifiestos");
        setManifiestos(extraerLista(datos, "manifiestos"));
    };

    // Al abrir: manifiestos, camiones, conductores, peonetas y comunas.
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

    // Si no hay borrador, la ciudad del manifiesto parte en la bodega de trabajo.
    useEffect(() => {
        if (idComuna && !borradorManifiesto.formulario?.idComuna) {
            setFormulario((prev) => ({ ...prev, idComuna: String(idComuna) }));
        }
    }, [idComuna]);

    // Guarda el manifiesto abierto. Espera a restaurarlo para no pisar el borrador con un formulario vacío.
    useEffect(() => {
        if (!manifiestoRestaurado.current && borradorManifiesto.idManifiesto && !activo) {
            return;
        }
        guardarBorrador("manifiesto", {
            idManifiesto: activo?.idManifiesto || null,
            codigo,
            formulario
        });
    }, [activo, codigo, formulario]);

    // Solo en preparación se puede sumar carga, así que la bodega se consulta en ese estado.
    useEffect(() => {
        if (activo?.estado !== "PREPARACION") {
            return;
        }
        api("/bultos/bodega?estado=EN_BODEGA")
            .then((datos) => setEnBodega(datos?.bultos || []))
            .catch(() => setEnBodega([]));
    }, [activo?.idManifiesto, activo?.estado]);

    // Deja el cursor en el escáner para leer el siguiente código sin hacer clic.
    useEffect(() => {
        if (activo?.estado === "PREPARACION") {
            scanRef.current?.focus();
        }
    }, [activo?.idManifiesto, activo?.estado]);

    // Solo los manifiestos de la bodega activa.
    const manifiestosVisibles = useMemo(
        () => manifiestos.filter((item) => manifiestoDeBodega(item)),
        [manifiestos, manifiestoDeBodega]
    );

    // Bultos ya cargados en el manifiesto abierto.
    const bultosActivos = useMemo(() => aplanarBultos(activo), [activo]);
    // Kilos, m³ y piezas de todo el manifiesto.
    const totalesManifiesto = useMemo(
        () => resumirCarga(bultosActivos.map((bulto) => ({
            tipo: bulto.tipoGrupo || bulto.tipo,
            cantidad: 1,
            peso: bulto.peso,
            volumen: bulto.volumen
        }))),
        [bultosActivos]
    );
    // Agrupa los bultos por OT para ver cuánto lleva cada orden.
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
    // Órdenes que siguen en bodega y todavía no están en este manifiesto.
    const disponiblesBodega = useMemo(() => {
        const cargadas = new Set(otsEnManifiesto.map((grupo) => grupo.numeroOT));
        const grupos = new Map();
        for (const bulto of enBodega) {
            const orden = bulto.detalle_carga?.orden_transporte;
            if (!orden?.numeroOT || cargadas.has(orden.numeroOT)) {
                continue;
            }
            if (!grupos.has(orden.numeroOT)) {
                grupos.set(orden.numeroOT, {
                    numeroOT: orden.numeroOT,
                    cliente: orden.cliente?.razonSocial || "Sin cliente",
                    destino: orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna
                        || orden.direccionDestino
                        || "Sin destino",
                    piezas: 0
                });
            }
            grupos.get(orden.numeroOT).piezas += 1;
        }
        return [...grupos.values()];
    }, [enBodega, otsEnManifiesto]);
    const enPreparacion = activo?.estado === "PREPARACION";
    // No sale a ruta sin camión, conductor, peoneta y al menos un bulto.
    const puedeSalir = enPreparacion
        && activo?.idVehiculo
        && activo?.idConductor
        && formulario.idPeoneta
        && bultosActivos.length > 0;

    const ciudadSeleccionada = useMemo(
        () => comunas.find((item) => String(item.idComuna) === String(formulario.idComuna)),
        [comunas, formulario.idComuna]
    );

    // Crea el manifiesto en preparación. La carga se agrega después, escaneando.
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
                    observacion: formulario.observacion,
                    tipo: formulario.tipoManifiesto || "REPARTO"
                })
            });
            setActivo(resultado.manifiesto);
            setCreando(false);
            aviso(resultado.mensaje, "success");
            await cargarListado();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    // Abre el detalle y rellena camión, conductor, peoneta y fecha ya guardados.
    const abrir = async (manifiesto) => {
        setCargando(true);
        try {
            const detalle = await api(`/manifiestos/${manifiesto.idManifiesto}`);
            setActivo(detalle.manifiesto);
            setCreando(false);
            setFormulario({
                idVehiculo: String(detalle.manifiesto.idVehiculo || ""),
                idConductor: String(detalle.manifiesto.idConductor || ""),
                idPeoneta: String(detalle.manifiesto.manifiesto_usuario?.[0]?.idUsuario || ""),
                idComuna: String(detalle.manifiesto.idComuna || ""),
                fechaSalidaProgramada: aInputFechaLocal(detalle.manifiesto.fechaSalidaProgramada),
                observacion: detalle.manifiesto.observacion || "",
                tipoManifiesto: detalle.manifiesto.tipo || "REPARTO"
            });
            setMensaje("");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    // Si había un manifiesto abierto en la sesión, lo vuelve a cargar al entrar.
    useEffect(() => {
        if (manifiestoRestaurado.current || !borradorManifiesto.idManifiesto) {
            return;
        }
        manifiestoRestaurado.current = true;
        abrir({ idManifiesto: borradorManifiesto.idManifiesto }).catch(() => {});
    }, [borradorManifiesto.idManifiesto]);

    // Actualiza camión, conductor, peoneta, ciudad y fecha sin recrear el manifiesto.
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

    // Suma al manifiesto el bulto o la OT del código leído.
    const escanear = async (event, codigoDirecto) => {
        event?.preventDefault?.();
        const codigoIngresado = String(codigoDirecto || codigo).trim();
        if (!activo || !codigoIngresado) {
            return;
        }
        setCargando(true);
        try {
            const resultado = await api(`/manifiestos/${activo.idManifiesto}/escanear`, {
                method: "POST",
                body: JSON.stringify({ codigo: codigoIngresado })
            });
            setCodigo(PREFIJO_OT);
            setActivo(resultado.manifiesto);
            if (resultado.numeroOT) {
                setOtAbierta(resultado.numeroOT);
            }
            aviso(resultado.mensaje, "success");
            await cargarListado();
            if (resultado.numeroOT) {
                await abrirEditorOt(resultado.numeroOT, resultado.manifiesto);
            }
        } catch (error) {
            aviso(error.message, "error");
            setCodigo(PREFIJO_OT);
        } finally {
            setCargando(false);
            window.setTimeout(() => scanRef.current?.focus(), 50);
        }
    };

    // Lista los bultos de una OT para marcar cuáles entran, sin escanearlos uno a uno.
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

    // Agrega o quita un bulto de la OT que está abierta en el editor.
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

    // Saca un bulto ya cargado y lo devuelve a bodega.
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

    // Marca la salida. A partir de aquí el peoneta puede ver el manifiesto en su ruta.
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
            imprimirManifiesto(resultado.manifiesto);
            aviso(`${resultado.mensaje} Se descargó el PDF del manifiesto.`, "success");
            await cargarListado();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const recepcionar = async () => {
        setCargando(true);
        try {
            const resultado = await api(`/manifiestos/${activo.idManifiesto}/recepcionar`, { method: "POST", body: JSON.stringify({}) });
            setActivo(resultado.manifiesto);
            aviso(resultado.mensaje, "success");
            await cargarListado();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const darDeBaja = async (idOrden, metodoPago) => {
        setCargando(true);
        try {
            const resultado = await api(`/manifiestos/${activo.idManifiesto}/cuadrar`, {
                method: "POST",
                body: JSON.stringify({ idsOrden: [idOrden], metodoPago })
            });
            setActivo(resultado.manifiesto);
            if (resultado.manifiesto?.estado === "FINALIZADO" && resultado.manifiesto?.tipo !== "TRASPASO") {
                imprimirManifiesto(resultado.manifiesto, { cuadre: true });
                aviso("La orden quedó pagada. Se descargó el PDF del cuadre.", "success");
            } else {
                aviso(resultado.mensaje, "success");
            }
            await cargarListado();
            return true;
        } catch (error) {
            aviso(error.message, "error");
            return false;
        } finally {
            setCargando(false);
        }
    };

    return (
        <>
            {esAdmin && !activo ? (
                <section className="admin-card operador-card">
                    <header className="admin-card-header">
                        <div>
                            <span>REGRESO</span>
                            <h2>Recepcionar manifiesto</h2>
                        </div>
                    </header>
                    <p className="mx-note">
                        Repartos en ruta de {nombreBodega || "esta bodega"}. Abre uno y recorre cada orden con el detalle del manifiesto. En cada una eliges el método de pago y la das de baja.
                    </p>
                    <div className="mx-table-wrap">
                        <table className="mx-table">
                            <thead>
                                <tr>
                                    <th>Manifiesto</th>
                                    <th>Ciudad</th>
                                    <th>Camión</th>
                                    <th>Salida</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {manifiestosVisibles.filter((item) => item.estado === "EN_RUTA" && item.tipo !== "TRASPASO").length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="mx-empty">
                                            En {nombreBodega || "esta bodega"} no hay un reparto en ruta. Si el camión volvió en otra ciudad, cámbiala arriba.
                                        </td>
                                    </tr>
                                ) : manifiestosVisibles.filter((item) => item.estado === "EN_RUTA" && item.tipo !== "TRASPASO").map((item) => (
                                    <tr key={item.idManifiesto}>
                                        <td>{item.numeroManifiesto}</td>
                                        <td>{etiquetaComuna(item.comuna) || "—"}</td>
                                        <td>{item.vehiculo?.patente || "—"}</td>
                                        <td>{formatearFechaHora(item.fechaSalidaProgramada)}</td>
                                        <td>
                                            <button type="button" className="button-primary" onClick={() => abrir(item)}>Recepcionar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}
            {!activo && !creando ? (
            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>DESPACHO</span>
                        <h2>Nuevo manifiesto</h2>
                    </div>
                    <button type="button" className="button-primary" onClick={() => setCreando(true)}>Crear manifiesto</button>
                </header>
                <p className="mx-note">
                    Arma un reparto para entregar en la ciudad, o un traspaso para mover carga a otra bodega.
                </p>
            </section>
            ) : null}
            {!activo && creando ? (
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
                        <label>Tipo de manifiesto</label>
                        <select
                            value={formulario.tipoManifiesto || "REPARTO"}
                            onChange={(event) => setFormulario((prev) => ({ ...prev, tipoManifiesto: event.target.value }))}
                        >
                            <option value="REPARTO">Reparto</option>
                            <option value="TRASPASO">Traspaso entre bodegas</option>
                        </select>
                        <p className="mx-note">
                            {formulario.tipoManifiesto === "TRASPASO"
                                ? "Mueve la carga a otra bodega. No cuadra pagos."
                                : "Entrega en la ciudad. El administrador cuadra los pagos cuando vuelve."}
                        </p>
                    </div>
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
                                    title="Día y hora de salida, formato local"
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
                        <button type="button" className="button-secondary" onClick={() => setCreando(false)}>Volver</button>
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
                            <span>{textoEstado(activo.estado)}</span>
                            <h2>
                                {esAdmin && activo.estado === "EN_RUTA" && activo.tipo !== "TRASPASO"
                                    ? `Recepcionar ${activo.numeroManifiesto}`
                                    : activo.estado === "PREPARACION"
                                        ? `Armar ${activo.numeroManifiesto}`
                                        : activo.numeroManifiesto}
                            </h2>
                        </div>
                        <div className="mx-form-actions">
                            <button type="button" className="button-secondary" onClick={() => imprimirManifiesto(activo)}>PDF del manifiesto</button>
                            <button type="button" className="button-secondary" onClick={() => {
                                setActivo(null);
                                guardarBorrador("manifiesto", { idManifiesto: null, codigo: "", formulario });
                            }}>Volver</button>
                        </div>
                    </header>
                    <Message texto={mensaje} tipo={tipo} />
                    <p className="mx-note">
                        Sale {formatearFechaHora(activo.fechaSalidaProgramada)} · {etiquetaComuna(activo.comuna) || "Sin ciudad"} · Camión {activo.vehiculo?.patente || "—"} · Conductor {activo.conductor ? `${activo.conductor.nombre} ${activo.conductor.apellido}` : "—"} · Peonetas {(activo.manifiesto_usuario || []).map((item) => nombreCompleto(item.usuario)).join(", ") || "—"}
                    </p>
                    {esAdmin && activo.estado === "EN_RUTA" && activo.tipo !== "TRASPASO" ? (
                        <RecepcionManifiesto manifiesto={activo} cargando={cargando} onBaja={darDeBaja} />
                    ) : (
                    <>
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
                                    title="Día y hora de salida, formato local"
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
                    {activo.estado === "EN_RUTA" && activo.tipo === "TRASPASO" ? (
                        <div className="mx-form-actions">
                            <p className="mx-note">Este viaje no cuadra pagos. Al recepcionarlo, la carga vuelve a la bodega de la ciudad de destino.</p>
                            <button type="button" className="button-primary" onClick={recepcionar} disabled={cargando}>Recepcionar en bodega destino</button>
                        </div>
                    ) : null}
                    {enPreparacion ? (
                        <>
                            <p className="mx-note">
                                {activo.tipo === "TRASPASO"
                                    ? "Cerrar el manifiesto deja la carga en tránsito hacia la otra bodega. Allá se recepciona, sin cobrar."
                                    : "Cerrar el manifiesto deja las órdenes en tránsito. El peoneta declara el cobro y el administrador lo cuadra al volver."}
                            </p>
                            <div className="mx-form-actions">
                                <button type="button" className="button-secondary" onClick={guardarAsignacion} disabled={cargando}>
                                    Guardar asignación
                                </button>
                                <button type="button" className="button-primary" onClick={salir} disabled={!puedeSalir || cargando}>
                                    Cerrar manifiesto
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
                                    placeholder="OT-000065 o el código de la etiqueta"
                                    title="Ya incluye OT-. La pistola puede leer el código completo."
                                    maxLength={40}
                                    onFocus={(event) => event.target.select()}
                                    onChange={(event) => setCodigo(codigoConPrefijo(event.target.value, PREFIJO_OT))}
                                />
                                <button type="submit" className="button-primary" disabled={cargando || codigo === PREFIJO_OT}>
                                    Cargar
                                </button>
                            </form>
                            <p className="mx-note">
                                El campo ya trae OT-. Si la pistola lee un manifiesto, el prefijo pasa a MAN-. Al terminar vuelve a OT- para el siguiente bulto.
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
                        <p className="mx-note">Este manifiesto ya salió. La carga no se modifica desde aquí.</p>
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
                                        style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            setOtAbierta((actual) => actual === grupo.numeroOT ? null : grupo.numeroOT);
                                        }}
                                    >
                                        <td colSpan={6}>
                                            <strong>{grupo.numeroOT}</strong>
                                            {otAbierta === grupo.numeroOT ? " · clic para ocultar" : " · clic para ver bultos"}
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
                                    ...(otAbierta === grupo.numeroOT ? grupo.bultos.map((bulto) => (
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
                                    )) : [])
                                ])}
                            </tbody>
                        </table>
                    </div>
                    {enPreparacion ? (
                        disponiblesBodega.length > 0 ? (
                            <div className="mx-table-wrap">
                                <p className="mx-note">Órdenes en bodega que puedes cargar a este manifiesto</p>
                                <table className="mx-table">
                                    <thead>
                                        <tr>
                                            <th>OT</th>
                                            <th>Cliente</th>
                                            <th>Destino</th>
                                            <th>Bultos</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {disponiblesBodega.map((item) => (
                                            <tr key={item.numeroOT}>
                                                <td>{item.numeroOT}</td>
                                                <td>{item.cliente}</td>
                                                <td>{item.destino}</td>
                                                <td>{item.piezas}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="button-secondary"
                                                        disabled={cargando}
                                                        onClick={() => escanear(null, item.numeroOT)}
                                                    >
                                                        Cargar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="mx-note">No hay otras órdenes en bodega pendientes de cargar.</p>
                        )
                    ) : null}
                    </>
                    )}
                </section>
            ) : null}

            {!activo ? (
            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>{nombreBodega || "BODEGA"}</span>
                        <h2>Manifiestos</h2>
                    </div>
                </header>
                {!creando ? <Message texto={mensaje} tipo={tipo} /> : null}
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Manifiesto</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Ciudad</th>
                                <th>Camión</th>
                                <th>Salida</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {manifiestosVisibles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="mx-empty">
                                        No hay manifiestos de {nombreBodega || "esta bodega"}.
                                    </td>
                                </tr>
                            ) : manifiestosVisibles.map((item) => (
                                <tr key={item.idManifiesto}>
                                    <td>{item.numeroManifiesto}</td>
                                    <td>{item.tipo === "TRASPASO" ? "Traspaso" : "Reparto"}</td>
                                    <td>{textoEstado(item.estado)}</td>
                                    <td>{etiquetaComuna(item.comuna) || "—"}</td>
                                    <td>{item.vehiculo?.patente || "—"}</td>
                                    <td>{formatearFechaHora(item.fechaSalidaProgramada)}</td>
                                    <td>
                                        <button type="button" className="button-secondary" onClick={() => abrir(item)}>
                                            {esAdmin && item.estado === "EN_RUTA" && item.tipo !== "TRASPASO"
                                                ? "Recepcionar"
                                                : item.estado === "PREPARACION"
                                                    ? "Continuar"
                                                    : "Ver"}
                                        </button>
                                    </td>
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

const nombreMedio = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSBANK: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
    CHEQUE: "Cheque"
};

const lecturaPago = (pago) => {
    const tipo = String(pago?.tipoPago || "").toUpperCase();
    const estado = String(pago?.estadoPago || "").toUpperCase();
    const medio = nombreMedio[String(pago?.metodoPago || "").toUpperCase()] || "";
    if (tipo === "CUENTA_CORRIENTE") {
        return { medio: "Cuenta corriente", estado: "Cuenta corriente", puedeElegir: false, nota: "Sigue en el mes. Aquí no se elige método." };
    }
    if (estado === "PAGADO") {
        return { medio: medio || "Pagada", estado: "Pagada", puedeElegir: false, nota: "Ya está de baja." };
    }
    if (estado === "POR_CUADRAR" || estado === "PENDIENTE") {
        return {
            medio: estado === "POR_CUADRAR" ? (medio ? `${medio} declarado` : "Declarado por el peoneta") : "Por pagar",
            estado: estado === "POR_CUADRAR" ? "Por cuadrar" : "Impaga",
            puedeElegir: true,
            metodoDeclarado: ["EFECTIVO", "TARJETA", "TRANSFERENCIA"].includes(String(pago?.metodoPago || "").toUpperCase())
                ? String(pago.metodoPago).toUpperCase()
                : "",
            nota: ""
        };
    }
    return { medio: "Sin registro", estado: "Sin registro", puedeElegir: false, nota: "Esta orden no tiene un pago para dar de baja." };
};

const bultosDe = (item) => (item.manifiesto_carga || []).flatMap((carga) =>
    (carga.manifiesto_bulto || []).map((asignado) => ({
        id: asignado.idManifiestoBulto,
        codigo: asignado.bulto?.codigoBulto || "—",
        tipo: carga.detalle_carga?.tipo_bulto?.nombreTipo || carga.detalle_carga?.descripcion || "Bulto",
        medidas: etiquetaMedidas(asignado.bulto),
        peso: asignado.bulto?.peso
    }))
);

function RecepcionManifiesto({ manifiesto, cargando, onBaja }) {
    const [elegida, setElegida] = useState(null);
    const [metodo, setMetodo] = useState("");
    const filas = (manifiesto.manifiesto_ot || []).map((item) => {
        const orden = item.orden_transporte || {};
        const bultos = bultosDe(item);
        return {
            idOrden: item.idOrden,
            numeroOT: orden.numeroOT || "—",
            cliente: orden.cliente?.razonSocial || "—",
            destino: orden.destinatario?.nombreRazonSocial || orden.contactoDestino || "—",
            telefono: orden.telefonoDestino || orden.destinatario?.telefono || "—",
            direccion: orden.direccionDestino || "—",
            comuna: orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna || "—",
            bultos,
            kilos: orden.pesoTotal,
            volumen: orden.volumenTotalM3,
            total: orden.valorTotal,
            estadoOt: orden.estado_ot?.nombreEstado || "—",
            ...lecturaPago(orden.pago?.[0])
        };
    });
    const abierta = filas.find((fila) => fila.idOrden === elegida) || null;

    const revisar = (fila) => {
        setElegida(fila.idOrden);
        setMetodo(fila.metodoDeclarado || "");
    };

    const confirmar = async () => {
        if (!abierta || !metodo) {
            return;
        }
        const siguiente = filas.find((fila) => fila.puedeElegir && fila.idOrden !== abierta.idOrden);
        const lista = await onBaja(abierta.idOrden, metodo);
        if (!lista) {
            return;
        }
        setElegida(siguiente?.idOrden || null);
        setMetodo(siguiente?.metodoDeclarado || "");
    };

    return (
        <div className="mt-4">
            <h3>Órdenes del viaje</h3>
            <p className="mx-note">
                Elige una orden. Abajo ves su detalle y eliges el método de pago para darla de baja.
            </p>
            <div className="mx-table-wrap">
                <table className="mx-table">
                    <thead>
                        <tr>
                            <th>OT</th>
                            <th>Destino</th>
                            <th>Bultos</th>
                            <th>Kg</th>
                            <th>m³</th>
                            <th>Valor</th>
                            <th>Pago</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.length === 0 ? (
                            <tr><td colSpan={8} className="mx-empty">Este manifiesto no tiene órdenes.</td></tr>
                        ) : filas.map((fila) => (
                            <tr key={fila.idOrden}>
                                <td>{fila.numeroOT}</td>
                                <td>
                                    {fila.destino}
                                    <br />
                                    {fila.telefono}
                                    <br />
                                    {fila.direccion}, {fila.comuna}
                                </td>
                                <td>{fila.bultos.length}</td>
                                <td>{formatearKg(fila.kilos)}</td>
                                <td>{formatearM3(fila.volumen)}</td>
                                <td>{formatearCLP(fila.total)}</td>
                                <td>{fila.estado} · {fila.medio}</td>
                                <td>
                                    <button type="button" className="button-secondary" onClick={() => revisar(fila)}>
                                        {elegida === fila.idOrden ? "Abierta" : "Revisar"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {abierta ? (
                <div className="mt-4">
                    <h3>{abierta.numeroOT}</h3>
                    <div className="mx-ciudad-info">
                        <p><span>Cliente</span><strong>{abierta.cliente}</strong></p>
                        <p><span>Destinatario</span><strong>{abierta.destino}</strong></p>
                        <p><span>Teléfono</span><strong>{abierta.telefono}</strong></p>
                        <p><span>Dirección</span><strong>{abierta.direccion}, {abierta.comuna}</strong></p>
                        <p><span>Estado de la orden</span><strong>{abierta.estadoOt}</strong></p>
                        <p><span>Pago</span><strong>{abierta.estado} · {abierta.medio}</strong></p>
                        <p><span>Kilos</span><strong>{formatearKg(abierta.kilos)}</strong></p>
                        <p><span>Volumen</span><strong>{formatearM3(abierta.volumen)}</strong></p>
                        <p><span>Valor</span><strong>{formatearCLP(abierta.total)}</strong></p>
                    </div>
                    <div className="mx-table-wrap mt-4">
                        <table className="mx-table">
                            <thead>
                                <tr>
                                    <th>Bulto</th>
                                    <th>Tipo</th>
                                    <th>Medidas</th>
                                    <th>Peso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {abierta.bultos.length === 0 ? (
                                    <tr><td colSpan={4} className="mx-empty">Esta orden no tiene bultos en el manifiesto.</td></tr>
                                ) : abierta.bultos.map((bulto) => (
                                    <tr key={bulto.id}>
                                        <td>{bulto.codigo}</td>
                                        <td>{bulto.tipo}</td>
                                        <td>{bulto.medidas}</td>
                                        <td>{formatearKg(bulto.peso)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {abierta.puedeElegir ? (
                        <div className="ot-grid mt-4">
                            <div className="field">
                                <label>Método de pago</label>
                                <select value={metodo} onChange={(event) => setMetodo(event.target.value)}>
                                    <option value="">Selecciona el método</option>
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TARJETA">Tarjeta</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                </select>
                            </div>
                            <div className="mx-form-actions">
                                <button type="button" className="button-primary" disabled={cargando || !metodo} onClick={confirmar}>
                                    Dar de baja esta orden
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="mx-note">{abierta.nota}</p>
                    )}
                </div>
            ) : null}
        </div>
    );
}
