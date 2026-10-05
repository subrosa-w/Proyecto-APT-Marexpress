import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import { etiquetaComuna, formatearCLP, formatearFechaHora, nombreCompleto } from "../../utils.js";
import Message from "../../components/Message.jsx";

const vacioTrayecto = {
    idTarifa: "",
    idComunaOrigen: "",
    idComunaDestino: "",
    valorFijo: "",
    valorKg: "",
    valorM3: ""
};

const tramoVacio = () => ({
    kgDesde: "",
    kgHasta: "",
    valorFijo: "",
    valorKg: ""
});

const tarifarioVacio = {
    nombreTarifa: "",
    valorKg: "",
    valorM3: "",
    valorBase: "0",
    valorRetiro: "30000",
    valorRetiroMediano: "60000",
    valorRetiroGrande: "120000",
    valorZonaUrbana: "0",
    valorZonaLejana: "0",
    tramos: [tramoVacio()]
};

const etiquetaCampo = {
    nombreTarifa: "Nombre",
    valorBase: "Valor base",
    valorKg: "Kg sobre 200",
    valorM3: "Valor m³",
    valorRetiro: "Retiro pequeño",
    valorRetiroMediano: "Retiro mediano",
    valorRetiroGrande: "Retiro grande",
    valorZonaUrbana: "Zona urbana",
    valorZonaLejana: "Zona lejana",
    estado: "Estado",
    tramos: "Tramos de kilos",
    tarifario: "Alta de tarifario"
};

const extraerLista = (datos, clave) => {
    if (Array.isArray(datos)) {
        return datos;
    }
    return Array.isArray(datos?.[clave]) ? datos[clave] : [];
};

const aFormulario = (tarifa) => ({
    nombreTarifa: tarifa.nombreTarifa || "",
    valorKg: String(tarifa.valorKg ?? ""),
    valorM3: String(tarifa.valorM3 ?? ""),
    valorBase: String(tarifa.valorBase ?? "0"),
    valorRetiro: String(tarifa.valorRetiro ?? "0"),
    valorRetiroMediano: String(tarifa.valorRetiroMediano ?? "0"),
    valorRetiroGrande: String(tarifa.valorRetiroGrande ?? "0"),
    valorZonaUrbana: String(tarifa.valorZonaUrbana ?? "0"),
    valorZonaLejana: String(tarifa.valorZonaLejana ?? "0"),
    tramos: (tarifa.tarifa_tramo || []).length
        ? tarifa.tarifa_tramo.map((item) => ({
            kgDesde: String(item.kgDesde ?? ""),
            kgHasta: String(item.kgHasta ?? ""),
            valorFijo: item.valorFijo == null ? "" : String(item.valorFijo),
            valorKg: item.valorKg == null ? "" : String(item.valorKg)
        }))
        : [tramoVacio()]
});

const payloadTarifario = (formulario) => ({
    nombreTarifa: formulario.nombreTarifa,
    valorKg: Number(formulario.valorKg) || 0,
    valorM3: Number(formulario.valorM3) || 0,
    valorBase: Number(formulario.valorBase) || 0,
    valorRetiro: Number(formulario.valorRetiro) || 0,
    valorRetiroMediano: Number(formulario.valorRetiroMediano) || 0,
    valorRetiroGrande: Number(formulario.valorRetiroGrande) || 0,
    valorZonaUrbana: Number(formulario.valorZonaUrbana) || 0,
    valorZonaLejana: Number(formulario.valorZonaLejana) || 0,
    tramos: formulario.tramos
});

const textoHistorial = (valor, campo) => {
    if (valor == null || valor === "") {
        return "—";
    }
    if (campo === "tramos" || campo === "tarifario") {
        try {
            const parsed = JSON.parse(valor);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => {
                    const cobro = item.valorFijo != null
                        ? formatearCLP(item.valorFijo)
                        : `${formatearCLP(item.valorKg)} / kg`;
                    return `${item.kgDesde}–${item.kgHasta} kg: ${cobro}`;
                }).join(" | ");
            }
            if (parsed?.nombreTarifa) {
                return `${parsed.nombreTarifa} · m³ ${formatearCLP(parsed.valorM3)}`;
            }
        } catch {
            return String(valor);
        }
    }
    if (["valorBase", "valorKg", "valorM3", "valorRetiro", "valorRetiroMediano", "valorRetiroGrande", "valorZonaUrbana", "valorZonaLejana"].includes(campo)) {
        const n = Number(valor);
        return Number.isFinite(n) ? formatearCLP(n) : String(valor);
    }
    return String(valor);
};

export default function TarifasPage() {
    const [trayectos, setTrayectos] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [comunas, setComunas] = useState([]);
    const [formularioTrayecto, setFormularioTrayecto] = useState(vacioTrayecto);
    const [tarifario, setTarifario] = useState(tarifarioVacio);
    const [idEditando, setIdEditando] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");
    const [cargando, setCargando] = useState(false);

    const aviso = (texto, clase = "info") => {
        setMensaje(texto);
        setTipo(clase);
    };

    const cargar = async () => {
        const [lista, maestros, listaComunas] = await Promise.all([
            api("/tarifas-trayecto"),
            api("/maestros/tarifas"),
            api("/comunas")
        ]);
        setTrayectos(Array.isArray(lista) ? lista : []);
        setCatalogo(Array.isArray(maestros) ? maestros : extraerLista(maestros, "tarifas"));
        setComunas(Array.isArray(listaComunas) ? listaComunas : extraerLista(listaComunas, "comunas"));
    };

    useEffect(() => {
        cargar().catch((error) => aviso(error.message, "error"));
    }, []);

    const cargarHistorial = async (idTarifa) => {
        const respuesta = await api(`/maestros/tarifas/${idTarifa}/historial`);
        setHistorial(extraerLista(respuesta, "historial"));
    };

    const seleccionar = async (tarifa) => {
        setIdEditando(tarifa.idTarifa);
        setTarifario(aFormulario(tarifa));
        try {
            await cargarHistorial(tarifa.idTarifa);
        } catch (error) {
            aviso(error.message, "error");
        }
    };

    const nuevo = () => {
        setIdEditando(null);
        setTarifario(tarifarioVacio);
        setHistorial([]);
    };

    const copiarTramosDe = (idTarifa) => {
        const origen = catalogo.find((item) => String(item.idTarifa) === String(idTarifa));
        if (!origen) {
            return;
        }
        setTarifario((prev) => ({
            ...prev,
            tramos: aFormulario(origen).tramos
        }));
    };

    const setTramo = (indice, campo, valor) => {
        setTarifario((prev) => ({
            ...prev,
            tramos: prev.tramos.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item))
        }));
    };

    const guardarTarifario = async (event) => {
        event.preventDefault();
        setCargando(true);
        try {
            if (idEditando) {
                await api(`/maestros/tarifas/${idEditando}`, {
                    method: "PUT",
                    body: JSON.stringify(payloadTarifario(tarifario))
                });
                aviso("Tarifario actualizado. El cambio quedó en el historial.", "success");
                await cargar();
                await cargarHistorial(idEditando);
            } else {
                const creado = await api("/maestros/tarifas", {
                    method: "POST",
                    body: JSON.stringify(payloadTarifario(tarifario))
                });
                const idNuevo = creado.tarifa?.idTarifa;
                setIdEditando(idNuevo || null);
                aviso("Tarifario creado.", "success");
                await cargar();
                if (idNuevo) {
                    await cargarHistorial(idNuevo);
                }
            }
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const cambiarEstado = async (tarifa) => {
        setCargando(true);
        try {
            await api(`/maestros/tarifas/${tarifa.idTarifa}/estado`, {
                method: "PATCH",
                body: JSON.stringify({ estado: !tarifa.estado })
            });
            aviso(tarifa.estado ? "Tarifario desactivado." : "Tarifario activado.", "success");
            await cargar();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const crearTrayecto = async (event) => {
        event.preventDefault();
        setCargando(true);
        try {
            await api("/tarifas-trayecto", {
                method: "POST",
                body: JSON.stringify({
                    idTarifa: Number(formularioTrayecto.idTarifa),
                    idComunaOrigen: Number(formularioTrayecto.idComunaOrigen),
                    idComunaDestino: Number(formularioTrayecto.idComunaDestino),
                    valorFijo: Number(formularioTrayecto.valorFijo),
                    valorKg: Number(formularioTrayecto.valorKg || 0),
                    valorM3: Number(formularioTrayecto.valorM3 || 0)
                })
            });
            setFormularioTrayecto(vacioTrayecto);
            aviso("Tarifa por trayecto creada.", "success");
            await cargar();
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const comparativa = useMemo(() => {
        const numericos = historial.filter((item) =>
            item.variacionPct != null && ["valorM3", "valorKg", "valorRetiro", "valorRetiroMediano", "valorRetiroGrande", "valorBase"].includes(item.campo)
        );
        return numericos.slice(0, 8);
    }, [historial]);

    return (
        <>
            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>TARIFARIOS</span>
                        <h2>Precios vigentes</h2>
                    </div>
                    <button type="button" className="button-secondary" onClick={nuevo}>
                        Nueva tarifa
                    </button>
                </header>
                <Message texto={mensaje} tipo={tipo} />
                <p className="mx-note">
                    Edita tramos, m³ y retiros. Cada cambio queda en historial para comparar precios en el tiempo.
                </p>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>m³</th>
                                <th>+200 kg</th>
                                <th>Retiro P/M/G</th>
                                <th>Tramos</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {catalogo.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="mx-empty">Aún no hay tarifarios.</td>
                                </tr>
                            ) : catalogo.map((item) => (
                                <tr key={item.idTarifa}>
                                    <td>{item.nombreTarifa}</td>
                                    <td>{formatearCLP(item.valorM3)}</td>
                                    <td>{formatearCLP(item.valorKg)}</td>
                                    <td>
                                        {formatearCLP(item.valorRetiro)} / {formatearCLP(item.valorRetiroMediano)} / {formatearCLP(item.valorRetiroGrande)}
                                    </td>
                                    <td>{(item.tarifa_tramo || []).length}</td>
                                    <td>{item.estado ? "Activa" : "Inactiva"}</td>
                                    <td>
                                        <button type="button" className="button-secondary" onClick={() => seleccionar(item)}>
                                            Editar
                                        </button>
                                        {" "}
                                        <button type="button" className="button-secondary" onClick={() => cambiarEstado(item)} disabled={cargando}>
                                            {item.estado ? "Desactivar" : "Activar"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>{idEditando ? "EDICIÓN" : "ALTA"}</span>
                        <h2>{idEditando ? "Editar tarifario" : "Nuevo tarifario"}</h2>
                    </div>
                </header>
                <form className="admin-grid-2" onSubmit={guardarTarifario}>
                    <div className="field">
                        <label>Nombre *</label>
                        <input
                            value={tarifario.nombreTarifa}
                            onChange={(e) => setTarifario({ ...tarifario, nombreTarifa: e.target.value })}
                            required
                        />
                    </div>
                    <div className="field">
                        <label>Valor m³ *</label>
                        <input
                            type="number"
                            min="0"
                            value={tarifario.valorM3}
                            onChange={(e) => setTarifario({ ...tarifario, valorM3: e.target.value })}
                            required
                        />
                    </div>
                    <div className="field">
                        <label>Valor kg sobre 200 *</label>
                        <input
                            type="number"
                            min="0"
                            value={tarifario.valorKg}
                            onChange={(e) => setTarifario({ ...tarifario, valorKg: e.target.value })}
                            required
                        />
                    </div>
                    <div className="field">
                        <label>Valor base</label>
                        <input
                            type="number"
                            min="0"
                            value={tarifario.valorBase}
                            onChange={(e) => setTarifario({ ...tarifario, valorBase: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Retiro urbano pequeño</label>
                        <input
                            type="number"
                            min="0"
                            value={tarifario.valorRetiro}
                            onChange={(e) => setTarifario({ ...tarifario, valorRetiro: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Retiro urbano mediano</label>
                        <input
                            type="number"
                            min="0"
                            value={tarifario.valorRetiroMediano}
                            onChange={(e) => setTarifario({ ...tarifario, valorRetiroMediano: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Retiro urbano grande</label>
                        <input
                            type="number"
                            min="0"
                            value={tarifario.valorRetiroGrande}
                            onChange={(e) => setTarifario({ ...tarifario, valorRetiroGrande: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Copiar tramos desde</label>
                        <select defaultValue="" onChange={(e) => copiarTramosDe(e.target.value)}>
                            <option value="">Seleccione un tarifario</option>
                            {catalogo.map((item) => (
                                <option key={item.idTarifa} value={item.idTarifa}>
                                    {item.nombreTarifa}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mx-table-wrap" style={{ gridColumn: "1 / -1" }}>
                        <p className="mx-note">Tramos de kilos: valor fijo o, en el último, valor por kg.</p>
                        <table className="mx-table">
                            <thead>
                                <tr>
                                    <th>Desde kg</th>
                                    <th>Hasta kg</th>
                                    <th>Valor fijo</th>
                                    <th>Valor / kg</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tarifario.tramos.map((tramo, indice) => (
                                    <tr key={`tramo-${indice}`}>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={tramo.kgDesde}
                                                onChange={(e) => setTramo(indice, "kgDesde", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={tramo.kgHasta}
                                                onChange={(e) => setTramo(indice, "kgHasta", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                value={tramo.valorFijo}
                                                onChange={(e) => setTramo(indice, "valorFijo", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                value={tramo.valorKg}
                                                onChange={(e) => setTramo(indice, "valorKg", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="button-secondary"
                                                onClick={() => setTarifario((prev) => ({
                                                    ...prev,
                                                    tramos: prev.tramos.filter((_, i) => i !== indice)
                                                }))}
                                            >
                                                Quitar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button
                            type="button"
                            className="button-secondary"
                            style={{ marginTop: 8 }}
                            onClick={() => setTarifario((prev) => ({ ...prev, tramos: [...prev.tramos, tramoVacio()] }))}
                        >
                            Agregar tramo
                        </button>
                    </div>
                    <div className="mx-form-actions">
                        <button className="button-primary" type="submit" disabled={cargando}>
                            {cargando ? "Guardando..." : idEditando ? "Guardar cambios" : "Crear tarifario"}
                        </button>
                    </div>
                </form>
            </section>

            {idEditando ? (
                <section className="admin-card">
                    <header className="admin-card-header">
                        <div>
                            <span>HISTORIAL</span>
                            <h2>Comparativa de precios</h2>
                        </div>
                    </header>
                    {comparativa.length ? (
                        <p className="mx-note">
                            Últimas variaciones: {comparativa.map((item) =>
                                `${etiquetaCampo[item.campo] || item.campo} ${Number(item.variacionPct) > 0 ? "+" : ""}${item.variacionPct}%`
                            ).join(" · ")}
                        </p>
                    ) : (
                        <p className="mx-note">Todavía no hay cambios de valor para comparar.</p>
                    )}
                    <div className="mx-table-wrap">
                        <table className="mx-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Campo</th>
                                    <th>Antes</th>
                                    <th>Después</th>
                                    <th>Variación</th>
                                    <th>Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="mx-empty">Sin movimientos registrados.</td>
                                    </tr>
                                ) : historial.map((item) => (
                                    <tr key={item.idHistorial}>
                                        <td>{formatearFechaHora(item.fechaCambio)}</td>
                                        <td>{etiquetaCampo[item.campo] || item.campo || item.tipoCambio}</td>
                                        <td>{textoHistorial(item.valorAnterior, item.campo)}</td>
                                        <td>{textoHistorial(item.valorNuevo, item.campo)}</td>
                                        <td>
                                            {item.variacionPct == null
                                                ? "—"
                                                : `${Number(item.variacionPct) > 0 ? "+" : ""}${item.variacionPct}%`}
                                        </td>
                                        <td>{nombreCompleto(item.usuario) || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            <section className="admin-card">
                <header className="admin-card-header">
                    <div>
                        <span>TRAYECTO</span>
                        <h2>Tarifa fija por comunas (opcional)</h2>
                    </div>
                </header>
                <form className="admin-grid-2" onSubmit={crearTrayecto}>
                    <div className="field">
                        <label>Tarifario</label>
                        <select
                            value={formularioTrayecto.idTarifa}
                            onChange={(e) => setFormularioTrayecto({ ...formularioTrayecto, idTarifa: e.target.value })}
                            required
                        >
                            <option value="">Seleccione</option>
                            {catalogo.map((tarifa) => (
                                <option key={tarifa.idTarifa} value={tarifa.idTarifa}>
                                    {tarifa.nombreTarifa}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Comuna origen</label>
                        <select
                            value={formularioTrayecto.idComunaOrigen}
                            onChange={(e) => setFormularioTrayecto({ ...formularioTrayecto, idComunaOrigen: e.target.value })}
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
                        <label>Comuna destino</label>
                        <select
                            value={formularioTrayecto.idComunaDestino}
                            onChange={(e) => setFormularioTrayecto({ ...formularioTrayecto, idComunaDestino: e.target.value })}
                            required
                        >
                            <option value="">Seleccione</option>
                            {comunas.map((comuna) => (
                                <option key={`d-${comuna.idComuna}`} value={comuna.idComuna}>
                                    {etiquetaComuna(comuna)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Valor fijo</label>
                        <input
                            type="number"
                            min="0"
                            value={formularioTrayecto.valorFijo}
                            onChange={(e) => setFormularioTrayecto({ ...formularioTrayecto, valorFijo: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mx-form-actions">
                        <button className="button-primary" type="submit" disabled={cargando}>
                            {cargando ? "Guardando..." : "Guardar trayecto"}
                        </button>
                    </div>
                </form>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Tarifa</th>
                                <th>Origen</th>
                                <th>Destino</th>
                                <th>Valor fijo</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trayectos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="mx-empty">No hay tarifas por trayecto.</td>
                                </tr>
                            ) : trayectos.map((tarifa) => (
                                <tr key={tarifa.idTarifaTrayecto}>
                                    <td>{tarifa.tarifa?.nombreTarifa}</td>
                                    <td>{tarifa.comuna_tarifa_trayecto_idComunaOrigenTocomuna?.nombreComuna}</td>
                                    <td>{tarifa.comuna_tarifa_trayecto_idComunaDestinoTocomuna?.nombreComuna}</td>
                                    <td>{formatearCLP(tarifa.valorFijo)}</td>
                                    <td>{tarifa.estado ? "Activa" : "Inactiva"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
