/*
  VISTA: ruta del peoneta
  RUTAS: /peoneta, /peoneta/manifiestos, /peoneta/entregas, /peoneta/historial
  CSS: admin-card, mx-table
  API: /api/peoneta
  FUNCIONES: muestra los manifiestos asignados. El peoneta inicia el reparto cuando la carga va en el camión y registra la entrega o el rechazo con su motivo.
  La misma vista cambia de lista según la dirección.
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { api } from "../../api.js";
import { guardarBorrador, leerBorrador } from "../../borrador.js";
import { formatos } from "../../formatos.js";
import Message from "../../components/Message.jsx";
import {
    etiquetaMedidas,
    formatearCLP,
    formatearFechaHora,
    formatearKg
} from "../../utils.js";

// Formulario de una entrega todavía no registrada: por defecto queda como entregada y pago en efectivo.
const vacio = {
    resultado: "ENTREGADA",
    nombreReceptor: "",
    observacion: "",
    metodoPago: "EFECTIVO"
};

// La OT cuenta como entregada solo si el resultado guardado es ENTREGADA. Un rechazo no entra al historial.
const ordenEntregada = (entrega) => String(entrega?.resultado?.resultadoEntrega || "").toUpperCase() === "ENTREGADA";

// Completo: cada OT ya tiene resultado, sea entregada o rechazada. Así sale de la ruta pendiente.
const manifiestoCompleto = (item) => {
    const lista = item?.entregas || [];
    return lista.length > 0 && lista.every((entrega) => entrega.resultado);
};

// Historial: todas las OT entregadas. Si hay un rechazo, el manifiesto no se muestra aquí.
const manifiestoEntregado = (item) => {
    const lista = item?.entregas || [];
    return lista.length > 0 && lista.every(ordenEntregada);
};

// En preparación todavía no salió a ruta, así que el peoneta no debe verlo.
const manifiestoEnPreparacion = (item) => String(item?.estado || "").toUpperCase() === "PREPARACION";

// La etapa visible sigue el recorrido real: bodega, manifiesto cerrado, camión y entrega.
const faseEntrega = (entrega) => {
    const resultado = String(entrega?.resultado?.resultadoEntrega || "").toUpperCase();
    if (resultado === "RECHAZADA") {
        return "rechazada";
    }
    if (resultado === "ENTREGADA") {
        return "entregada";
    }
    const estado = String(entrega?.estado || "").toUpperCase();
    if (["EN_REPARTO", "EN_DESTINO", "EN_ENTREGA", "ENTREGA_PARCIAL"].includes(estado)) {
        return "reparto";
    }
    if (estado === "DEVOLUCION_SOLICITADA") {
        return "devolucion";
    }
    if (["EN_TRANSITO", "EN_RUTA", "DESPACHADA"].includes(estado)) {
        return "transito";
    }
    return "oficina";
};

const textoFase = {
    oficina: "En oficina, en bodega",
    transito: "En tránsito, manifiesto cerrado",
    reparto: "En reparto, en el camión",
    devolucion: "Devolución pedida por el cliente",
    entregada: "Entregada",
    rechazada: "Rechazada"
};

// Traduce el código de pago a un texto para la ficha de la entrega.
const etiquetaPago = (valor) => {
    const mapa = {
        EFECTIVO: "Efectivo",
        TRANSFERENCIA: "Transferencia",
        TRANSBANK: "Transbank",
        CHEQUE: "Cheque",
        TARJETA: "Tarjeta"
    };
    return mapa[String(valor || "").toUpperCase()] || valor || "—";
};

export default function ManifiestosPeonetaPage() {
    const { pathname } = useLocation();
    // La misma vista cambia de lista según la URL: ruta, entregas o historial.
    const modo = pathname.includes("historial")
        ? "historial"
        : pathname.includes("entregas")
            ? "entregas"
            : "ruta";
    const [manifiestos, setManifiestos] = useState([]);
    const [activoId, setActivoId] = useState(() => (leerBorrador("peoneta") || {}).activoId || null);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");
    const [forms, setForms] = useState(() => (leerBorrador("peoneta") || {}).forms || {});
    const [guardando, setGuardando] = useState("");
    const [manifiestoAbierto, setManifiestoAbierto] = useState(() => Boolean((leerBorrador("peoneta") || {}).activoId));
    const [otAbierta, setOtAbierta] = useState(null);
    const detalleRef = useRef(null);
    const llevarAlDetalle = useRef(false);

    // Trae los manifiestos del peoneta de la sesión. Si el abierto ya no existe, lo cierra.
    const cargar = async () => {
        const datos = await api("/peoneta/manifiestos");
        const lista = datos?.data || [];
        setManifiestos(lista);
        setActivoId((prev) => (
            lista.some((item) => item.idManifiesto === prev) ? prev : null
        ));
    };

    // Guarda qué manifiesto está abierto y los formularios a medio llenar.
    useEffect(() => {
        guardarBorrador("peoneta", { activoId, forms });
    }, [activoId, forms]);

    useEffect(() => {
        cargar().catch((error) => {
            setMensaje(error.message);
            setTipo("error");
        });
    }, []);

    // Baja hasta el detalle después de abrir un manifiesto, porque la lista queda arriba.
    useEffect(() => {
        if (!llevarAlDetalle.current || !detalleRef.current) {
            return;
        }
        llevarAlDetalle.current = false;
        detalleRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [activoId, manifiestoAbierto]);

    // Abre un manifiesto y lleva la vista a sus órdenes.
    const abrirManifiesto = (idManifiesto) => {
        setActivoId(idManifiesto);
        setManifiestoAbierto(true);
        setOtAbierta(null);
        llevarAlDetalle.current = true;
        window.setTimeout(() => {
            detalleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
    };

    // Filtra según la pantalla: ruta (asignados), entregas (cerrados) o historial (todos entregados).
    const manifiestosVisibles = useMemo(() => {
        const asignados = manifiestos.filter((item) => !manifiestoEnPreparacion(item));
        if (modo === "historial") {
            return asignados.filter(manifiestoEntregado);
        }
        if (modo === "entregas") {
            return asignados.filter(manifiestoCompleto);
        }
        return asignados;
    }, [manifiestos, modo]);
    const activo = manifiestosVisibles.find((item) => item.idManifiesto === activoId) || null;
    const entregas = useMemo(() => {
        const lista = activo?.entregas || [];
        if (modo === "historial") {
            return lista.filter(ordenEntregada);
        }
        if (modo === "entregas") {
            return lista.filter((item) => item.resultado);
        }
        return lista;
    }, [activo, modo]);

    const titulo = modo === "historial" ? "Entregados" : modo === "entregas" ? "Completadas" : "Mi ruta";
    const listasParaReparto = (activo?.entregas || []).filter((item) => ["oficina", "transito"].includes(faseEntrega(item)));

    // Cada OT tiene su propio formulario para no mezclar receptor ni observación.
    const setCampo = (numeroOT, campo, valor) => {
        setForms((prev) => ({
            ...prev,
            [numeroOT]: { ...vacio, ...prev[numeroOT], [campo]: valor }
        }));
    };

    // Guarda entrega o rechazo. El pago solo se envía si la orden quedó entregada.
    const registrar = async (event, entrega) => {
        event.preventDefault();
        const formulario = { ...vacio, ...forms[entrega.numeroOT] };
        setGuardando(entrega.numeroOT);
        try {
            const resultado = await api("/peoneta/entregas", {
                method: "POST",
                body: JSON.stringify({
                    numeroOT: entrega.numeroOT,
                    resultado: formulario.resultado,
                    nombreReceptor: formulario.nombreReceptor,
                    observacion: formulario.observacion,
                    metodoPago: formulario.resultado === "ENTREGADA" ? formulario.metodoPago : null,
                    comprobante: formulario.comprobante || null
                })
            });
            setManifiestos(resultado?.data || []);
            setMensaje(resultado.mensaje || "Entrega registrada.");
            setTipo("success");
        } catch (error) {
            setMensaje(error.message);
            setTipo("error");
        } finally {
            setGuardando("");
        }
    };

    // Confirma que la carga va en el camión. Puede ser una orden o todo el manifiesto.
    const iniciarReparto = async (numeroOT) => {
        setGuardando(numeroOT || "manifiesto");
        try {
            const resultado = await api("/peoneta/reparto", {
                method: "POST",
                body: JSON.stringify(numeroOT ? { numeroOT } : { idManifiesto: activo.idManifiesto })
            });
            setManifiestos(resultado?.data || []);
            setMensaje(resultado.mensaje || "Reparto iniciado.");
            setTipo("success");
        } catch (error) {
            setMensaje(error.message);
            setTipo("error");
        } finally {
            setGuardando("");
        }
    };

    const pendientes = (activo?.entregas || []).filter((item) => !item.resultado).length;

    return (
        <>
            <section className="peoneta-card">
                <header className="admin-card-header">
                    <div>
                        <span>REPARTO</span>
                        <h2>{titulo}</h2>
                    </div>
                </header>
                <Message texto={mensaje} tipo={tipo} />
                <p className="mx-note">
                    {modo === "historial"
                        ? "Aquí aparecen los manifiestos en los que todas las órdenes ya fueron entregadas."
                        : modo === "entregas"
                            ? "Aquí aparecen los manifiestos terminados y las órdenes que ya fueron entregadas o rechazadas."
                            : "En oficina la carga está en bodega. Al cerrar el manifiesto pasa a tránsito. Cuando confirmas que va en el camión queda en reparto, y al entregarla o rechazarla se cierra con el resultado."}
                </p>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Manifiesto</th>
                                <th>Estado</th>
                                <th>Salida</th>
                                <th>Ciudad</th>
                                <th>Camión</th>
                                <th>Entregas</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {manifiestosVisibles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="mx-empty">
                                        {modo === "historial"
                                            ? "No hay manifiestos con todas las órdenes entregadas."
                                            : modo === "entregas"
                                                ? "No hay manifiestos completados."
                                                : "Aún no tienes manifiestos asignados."}
                                    </td>
                                </tr>
                            ) : manifiestosVisibles.map((item) => (
                                <tr key={item.idManifiesto}>
                                    <td>{item.numeroManifiesto}</td>
                                    <td>{item.estado}</td>
                                    <td>{formatearFechaHora(item.fechaSalidaProgramada || item.fechaSalida)}</td>
                                    <td>{item.ciudad ? `${item.ciudad}${item.region ? ` · ${item.region}` : ""}` : "—"}</td>
                                    <td>{item.camion || "—"}</td>
                                    <td>{item.entregas?.length || 0}</td>
                                    <td>
                                        <button type="button" className="button-secondary" onClick={() => abrirManifiesto(item.idManifiesto)}>
                                            Ver ruta
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {activo ? (
                <section className="peoneta-card" ref={detalleRef}>
                    <button
                        type="button"
                        className="admin-card-header mx-desplegable"
                        onClick={() => setManifiestoAbierto((abierto) => !abierto)}
                    >
                        <div>
                            <span>{activo.estado}</span>
                            <h2>{activo.numeroManifiesto}</h2>
                        </div>
                        <span>{manifiestoAbierto ? "Ocultar" : "Ver información"}</span>
                    </button>
                    {manifiestoAbierto ? (
                    <>
                    <div className="mx-ciudad-info">
                        <p><span>Ciudad</span><strong>{activo.ciudad || "—"}</strong></p>
                        <p><span>Región</span><strong>{activo.region || "—"}</strong></p>
                        <p><span>Salida</span><strong>{formatearFechaHora(activo.fechaSalidaProgramada || activo.fechaSalida)}</strong></p>
                        <p><span>Camión</span><strong>{activo.camion || "—"}</strong></p>
                        <p><span>Conductor</span><strong>{activo.conductor || "—"}</strong></p>
                        <p><span>Pendientes</span><strong>{pendientes} de {activo.entregas?.length || 0}</strong></p>
                    </div>
                    {activo.observacion ? <p className="mx-note">{activo.observacion}</p> : null}
                    {activo.tipo === "TRASPASO" ? (
                        <p className="mx-note">Este viaje es un traspaso entre bodegas. No se cobra ni se entrega en la puerta. La bodega de destino recepciona la carga.</p>
                    ) : null}
                    {modo === "ruta" && activo.tipo !== "TRASPASO" && listasParaReparto.length > 0 ? (
                        <div className="mx-form-actions">
                            <button
                                type="button"
                                className="button-primary"
                                disabled={guardando === "manifiesto"}
                                onClick={() => iniciarReparto()}
                            >
                                {guardando === "manifiesto" ? "Guardando..." : "Iniciar reparto del manifiesto"}
                            </button>
                        </div>
                    ) : null}

                    {entregas.length === 0 ? (
                        <p className="mx-note">
                            {modo === "entregas" || modo === "historial"
                                ? "Este manifiesto no tiene órdenes completadas."
                                : "Este manifiesto no tiene órdenes pendientes."}
                        </p>
                    ) : entregas.map((entrega) => {
                        const formulario = { ...vacio, ...forms[entrega.numeroOT] };
                        const abierta = otAbierta === entrega.numeroOT;
                        const fase = faseEntrega(entrega);
                        const motivo = entrega.resultado?.motivoResultado || entrega.resultado?.observacion || "";
                        return (
                            <article key={entrega.numeroOT} className="admin-card" style={{ marginTop: 12 }}>
                                <button
                                    type="button"
                                    className="admin-card-header mx-desplegable"
                                    onClick={() => setOtAbierta(abierta ? null : entrega.numeroOT)}
                                >
                                    <div>
                                        <span>{textoFase[fase]}</span>
                                        <h2>{entrega.numeroOT}</h2>
                                    </div>
                                    <span>{abierta ? "Ocultar" : "Ver detalle"}</span>
                                </button>
                                {abierta ? (
                                <>
                                <div className="mx-ciudad-info">
                                    <p><span>Estado OT</span><strong>{entrega.estado}</strong></p>
                                    <p><span>Destinatario</span><strong>{entrega.destinatario}</strong></p>
                                    <p><span>Dirección</span><strong>{entrega.direccion || "—"}</strong></p>
                                    <p><span>Comuna</span><strong>{entrega.comuna || "—"}{entrega.region ? ` · ${entrega.region}` : ""}</strong></p>
                                    <p><span>Contacto</span><strong>{[entrega.contacto, entrega.telefono].filter(Boolean).join(" · ") || "—"}</strong></p>
                                    <p><span>A cobrar</span><strong>{formatearCLP(entrega.valor)}</strong></p>
                                    <p><span>Pago</span><strong>{entrega.pago ? `${entrega.pago.estadoPago || "—"} · ${etiquetaPago(entrega.pago.metodoPago)}` : "Sin pago"}</strong></p>
                                    {entrega.referencia ? <p><span>Referencia</span><strong>{entrega.referencia}</strong></p> : null}
                                </div>
                                <div className="mx-table-wrap">
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
                                            {(entrega.bultos || []).length === 0 ? (
                                                <tr><td colSpan={4} className="mx-empty">Sin bultos cargados.</td></tr>
                                            ) : entrega.bultos.map((bulto) => (
                                                <tr key={bulto.codigoBulto}>
                                                    <td>{bulto.codigoBulto}</td>
                                                    <td>{bulto.tipo}</td>
                                                    <td>{etiquetaMedidas(bulto)}</td>
                                                    <td>{bulto.pesoKg == null ? "—" : formatearKg(bulto.pesoKg)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {fase === "devolucion" ? (
                                    <p className="mx-note">El cliente pidió la devolución. No la entregues. Regresa la carga a la oficina.</p>
                                ) : entrega.resultado ? (
                                    <div className="mx-ciudad-info">
                                        <p><span>Resultado</span><strong>{textoFase[fase]}</strong></p>
                                        <p><span>Receptor</span><strong>{entrega.resultado.nombreReceptor || "—"}</strong></p>
                                        <p><span>Fecha</span><strong>{formatearFechaHora(entrega.resultado.fechaEntrega)}</strong></p>
                                        <p>
                                            <span>{fase === "rechazada" ? "Motivo del rechazo" : "Comentario"}</span>
                                            <strong>{motivo || "—"}</strong>
                                        </p>
                                    </div>
                                ) : activo.tipo === "TRASPASO" ? null : fase === "reparto" ? (
                                    <form className="admin-grid-2" onSubmit={(event) => registrar(event, entrega)}>
                                        <div className="field">
                                            <label>Resultado *</label>
                                            <select
                                                value={formulario.resultado}
                                                onChange={(event) => setCampo(entrega.numeroOT, "resultado", event.target.value)}
                                            >
                                                <option value="ENTREGADA">Entregada</option>
                                                <option value="RECHAZADA">Rechazada</option>
                                            </select>
                                        </div>
                                        <div className="field">
                                            <label>Quién recibe {formulario.resultado === "ENTREGADA" ? "*" : ""}</label>
                                            <input
                                                {...formatos.contacto}
                                                value={formulario.nombreReceptor}
                                                onChange={(event) => setCampo(entrega.numeroOT, "nombreReceptor", event.target.value)}
                                                required={formulario.resultado === "ENTREGADA"}
                                            />
                                        </div>
                                        {formulario.resultado === "ENTREGADA" ? (
                                            <div className="field">
                                                <label>Método declarado *</label>
                                                <select
                                                    value={formulario.metodoPago}
                                                    onChange={(event) => setCampo(entrega.numeroOT, "metodoPago", event.target.value)}
                                                >
                                                    <option value="EFECTIVO">Efectivo</option>
                                                    <option value="TRANSFERENCIA">Transferencia</option>
                                                    <option value="TRANSBANK">Transbank</option>
                                                    <option value="CHEQUE">Cheque</option>
                                                </select>
                                                <p className="mx-note">Esto no deja la orden pagada. Queda por cuadrar hasta que el administrador revise el manifiesto.</p>
                                            </div>
                                        ) : null}
                                        {formulario.resultado === "ENTREGADA" && ["TRANSFERENCIA", "TRANSBANK"].includes(formulario.metodoPago) ? (
                                            <div className="field">
                                                <label>Voucher</label>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                                    onChange={(event) => {
                                                        const archivo = event.target.files?.[0];
                                                        if (!archivo) {
                                                            setCampo(entrega.numeroOT, "comprobante", null);
                                                            return;
                                                        }
                                                        const lector = new FileReader();
                                                        lector.onload = () => setCampo(entrega.numeroOT, "comprobante", {
                                                            tipo: archivo.type,
                                                            datos: lector.result
                                                        });
                                                        lector.readAsDataURL(archivo);
                                                    }}
                                                />
                                                <p className="mx-note">Foto o PDF de hasta 2 MB. Queda cifrado. En efectivo no se pide.</p>
                                            </div>
                                        ) : null}
                                        <div className="field">
                                            <label>Observación {formulario.resultado === "RECHAZADA" ? "*" : ""}</label>
                                            <input
                                                {...formatos.descripcion}
                                                placeholder={formulario.resultado === "RECHAZADA" ? "Motivo del rechazo" : "Comentario de la entrega"}
                                                value={formulario.observacion}
                                                onChange={(event) => setCampo(entrega.numeroOT, "observacion", event.target.value)}
                                                required={formulario.resultado === "RECHAZADA"}
                                            />
                                        </div>
                                        <div className="mx-form-actions">
                                            <button className="button-primary" type="submit" disabled={guardando === entrega.numeroOT}>
                                                {guardando === entrega.numeroOT ? "Guardando..." : "Registrar entrega"}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="mx-form-actions">
                                        <p className="mx-note">Confirma que la carga va en el camión. Después puedes registrar la entrega o el rechazo con su motivo.</p>
                                        <button
                                            type="button"
                                            className="button-primary"
                                            disabled={guardando === entrega.numeroOT}
                                            onClick={() => iniciarReparto(entrega.numeroOT)}
                                        >
                                            {guardando === entrega.numeroOT ? "Guardando..." : "La carga está en el camión"}
                                        </button>
                                    </div>
                                )}
                                </>
                                ) : null}
                            </article>
                        );
                    })}
                    </>
                    ) : null}
                </section>
            ) : null}
        </>
    );
}
