import { useEffect, useMemo, useState } from "react";
import { api } from "../../api.js";
import Message from "../../components/Message.jsx";
import {
    etiquetaMedidas,
    formatearFechaHora,
    formatearKg
} from "../../utils.js";

export default function ManifiestosPeonetaPage() {
    const [manifiestos, setManifiestos] = useState([]);
    const [activo, setActivo] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");

    useEffect(() => {
        api("/peoneta/manifiestos")
            .then((datos) => {
                const lista = datos?.data || [];
                setManifiestos(lista);
                setActivo((prev) => lista.find((item) => item.idManifiesto === prev?.idManifiesto) || lista[0] || null);
            })
            .catch((error) => {
                setMensaje(error.message);
                setTipo("error");
            });
    }, []);

    const pendientes = useMemo(
        () => (activo?.entregas || []).filter((item) => !item.resultado),
        [activo]
    );

    return (
        <>
            <section className="peoneta-card">
                <header className="admin-card-header">
                    <div>
                        <span>REPARTO</span>
                        <h2>Mi ruta</h2>
                    </div>
                </header>
                <Message texto={mensaje} tipo={tipo} />
                <p className="mx-note">
                    Solo ves la ruta, el camión y lo que debes entregar. No se muestran valores ni tarifas.
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
                            {manifiestos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="mx-empty">Aún no tienes manifiestos asignados.</td>
                                </tr>
                            ) : manifiestos.map((item) => (
                                <tr key={item.idManifiesto}>
                                    <td>{item.numeroManifiesto}</td>
                                    <td>{item.estado}</td>
                                    <td>{formatearFechaHora(item.fechaSalidaProgramada || item.fechaSalida)}</td>
                                    <td>{item.ciudad ? `${item.ciudad}${item.region ? ` · ${item.region}` : ""}` : "—"}</td>
                                    <td>{item.camion || "—"}</td>
                                    <td>{item.entregas?.length || 0}</td>
                                    <td>
                                        <button type="button" className="button-secondary" onClick={() => setActivo(item)}>
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
                <section className="peoneta-card">
                    <header className="admin-card-header">
                        <div>
                            <span>{activo.estado}</span>
                            <h2>{activo.numeroManifiesto}</h2>
                        </div>
                    </header>
                    <div className="mx-ciudad-info">
                        <p><span>Ciudad</span><strong>{activo.ciudad || "—"}</strong></p>
                        <p><span>Región</span><strong>{activo.region || "—"}</strong></p>
                        <p><span>Salida</span><strong>{formatearFechaHora(activo.fechaSalidaProgramada || activo.fechaSalida)}</strong></p>
                        <p><span>Camión</span><strong>{activo.camion || "—"}</strong></p>
                        <p><span>Conductor</span><strong>{activo.conductor || "—"}</strong></p>
                        <p><span>Pendientes</span><strong>{pendientes.length} de {activo.entregas?.length || 0}</strong></p>
                    </div>
                    {activo.observacion ? <p className="mx-note">{activo.observacion}</p> : null}

                    {(activo.entregas || []).length === 0 ? (
                        <p className="mx-note">Este manifiesto aún no tiene órdenes cargadas.</p>
                    ) : activo.entregas.map((entrega) => (
                        <article key={entrega.numeroOT} className="mx-ciudad-info" style={{ marginTop: 12 }}>
                            <p><span>OT</span><strong>{entrega.numeroOT} · {entrega.estado}</strong></p>
                            <p><span>Destinatario</span><strong>{entrega.destinatario}</strong></p>
                            <p><span>Dirección</span><strong>{entrega.direccion || "—"}</strong></p>
                            <p><span>Comuna</span><strong>{entrega.comuna || "—"}{entrega.region ? ` · ${entrega.region}` : ""}</strong></p>
                            <p><span>Contacto</span><strong>{[entrega.contacto, entrega.telefono].filter(Boolean).join(" · ") || "—"}</strong></p>
                            {entrega.referencia ? <p><span>Referencia</span><strong>{entrega.referencia}</strong></p> : null}
                            {entrega.resultado ? (
                                <p><span>Entrega</span><strong>{entrega.resultado.resultadoEntrega} · {entrega.resultado.nombreReceptor || "Sin receptor"}</strong></p>
                            ) : (
                                <p><span>Entrega</span><strong>Pendiente</strong></p>
                            )}
                            <div className="mx-table-wrap" style={{ gridColumn: "1 / -1" }}>
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
                                            <tr>
                                                <td colSpan={4}>Sin bultos cargados.</td>
                                            </tr>
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
                        </article>
                    ))}
                </section>
            ) : null}
        </>
    );
}
