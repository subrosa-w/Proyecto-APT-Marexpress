import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { api } from "../../api.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";
import Message from "../../components/Message.jsx";
import { formatearFechaHora, formatearKg, ordenAnulada } from "../../utils.js";

const textoDias = (dias) => {
    const n = Number(dias) || 0;
    if (n <= 0) {
        return "Hoy";
    }
    return n === 1 ? "1 día" : `${n} días`;
};

export default function ProntoDespachoPage() {
    const { idSucursal, nombreBodega } = useBodegaTrabajo();
    const [datos, setDatos] = useState({
        diasMinimos: 3,
        resumen: { ordenes: 0, bultos: 0, diasMaximo: 0 },
        ordenes: []
    });
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(true);
    const [abierta, setAbierta] = useState(null);

    useEffect(() => {
        api("/bultos/pronto-despacho?dias=3")
            .then((respuesta) => {
                setDatos({
                    diasMinimos: respuesta.diasMinimos || 3,
                    resumen: respuesta.resumen || { ordenes: 0, bultos: 0, diasMaximo: 0 },
                    ordenes: respuesta.ordenes || []
                });
                setAbierta(respuesta.ordenes?.[0]?.idOrden || respuesta.ordenes?.[0]?.numeroOT || null);
            })
            .catch((error) => setMensaje(error.message))
            .finally(() => setCargando(false));
    }, []);

    const vista = useMemo(() => {
        const ordenes = (datos.ordenes || [])
            .map((orden) => ({
                ...orden,
                bultos: (orden.bultos || []).filter((bulto) =>
                    !idSucursal || Number(bulto.idSucursal) === Number(idSucursal)
                )
            }))
            .filter((orden) => orden.bultos.length > 0 && !ordenAnulada(orden));
        return {
            ...datos,
            ordenes,
            resumen: {
                ...datos.resumen,
                ordenes: ordenes.length,
                bultos: ordenes.reduce((acc, orden) => acc + orden.bultos.length, 0),
                diasMaximo: ordenes[0]?.diasEnBodega || 0
            }
        };
    }, [datos, idSucursal]);

    return (
        <>
            <section className="operador-kpis admin-kpis">
                <article className="operador-kpi admin-kpi">
                    <span>Órdenes atrasadas</span>
                    <strong>{vista.resumen.ordenes}</strong>
                    <small>Más de {vista.diasMinimos} días en {nombreBodega || "bodega"}</small>
                </article>
                <article className="operador-kpi admin-kpi">
                    <span>Bultos</span>
                    <strong>{vista.resumen.bultos}</strong>
                    <small>Pendientes de despacho</small>
                </article>
                <article className="operador-kpi admin-kpi">
                    <span>Mayor permanencia</span>
                    <strong>{textoDias(vista.resumen.diasMaximo)}</strong>
                    <small>Carga más antigua en bodega</small>
                </article>
            </section>

            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>PRIORIDAD</span>
                        <h2>Pronto despacho</h2>
                    </div>
                    <Link className="button-secondary" to="/operador/manifiestos">Crear manifiesto</Link>
                </header>
                <Message texto={mensaje} tipo="error" />
                <p className="mx-note">
                    Se listan primero las OT cuyo bulto más antiguo lleva {vista.diasMinimos} días o más en {nombreBodega || "bodega"}.
                </p>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>Días</th>
                                <th>OT</th>
                                <th>Cliente</th>
                                <th>Destino</th>
                                <th>Bultos</th>
                                <th>Desde</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan={7} className="mx-empty">Cargando carga atrasada...</td>
                                </tr>
                            ) : vista.ordenes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="mx-empty">
                                        No hay bultos con más de {vista.diasMinimos} días en {nombreBodega || "esta bodega"}.
                                    </td>
                                </tr>
                            ) : vista.ordenes.flatMap((orden) => {
                                const clave = orden.idOrden || orden.numeroOT;
                                const abiertaEsta = abierta === clave;
                                return [
                                    <tr key={clave} className="mx-fila-grupo">
                                        <td><strong>{textoDias(orden.diasEnBodega)}</strong></td>
                                        <td>{orden.numeroOT}</td>
                                        <td>{orden.cliente}</td>
                                        <td>{orden.destino}</td>
                                        <td>{orden.bultos.length}</td>
                                        <td>{formatearFechaHora(orden.fechaIngresoBodega)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="button-secondary"
                                                onClick={() => setAbierta(abiertaEsta ? null : clave)}
                                            >
                                                {abiertaEsta ? "Ocultar" : "Ver bultos"}
                                            </button>
                                        </td>
                                    </tr>,
                                    ...(abiertaEsta
                                        ? orden.bultos.map((bulto) => (
                                            <tr key={bulto.idBulto}>
                                                <td>{textoDias(bulto.diasEnBodega)}</td>
                                                <td colSpan={2}>{bulto.codigoBulto}</td>
                                                <td>{bulto.tipo}</td>
                                                <td>{bulto.peso ? formatearKg(bulto.peso) : "—"}</td>
                                                <td>{bulto.sucursal}</td>
                                                <td>{formatearFechaHora(bulto.fechaIngresoBodega)}</td>
                                            </tr>
                                        ))
                                        : [])
                                ];
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
