import { useEffect, useState } from "react";
import { Link } from "react-router";
import Message from "../../components/Message.jsx";
import { formatearCLP, formatearFechaSola, formatearKg, formatearM3 } from "../../utils.js";
import { obtenerCotizaciones } from "./clienteDatos.js";

const DIA = 24 * 60 * 60 * 1000;

// Una cotización "vigente" cuya fecha de validez ya pasó se muestra como vencida
// (validaHasta es una fecha sin hora: vale hasta el final de ese día)
const estadoReal = (c) => (c.estado === "VIGENTE" && new Date(c.validaHasta).getTime() + DIA < Date.now() ? "VENCIDA" : c.estado);

const insignias = {
    VIGENTE: ["Vigente", "border-blue-200 bg-blue-50 text-blue-700"],
    VENCIDA: ["Vencida", "border-slate-200 bg-slate-100 text-slate-500"],
    CONVERTIDA: ["Convertida en OT", "border-green-200 bg-green-50 text-green-700"]
};

const fecha = (valor) =>
    valor ? new Intl.DateTimeFormat("es-CL", { dateStyle: "short" }).format(new Date(valor)) : "—";

export default function CotizacionesPage() {
    const [cotizaciones, setCotizaciones] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [estado, setEstado] = useState("todas");
    // "desde" se calcula al elegir el período (no en cada render)
    const [periodo, setPeriodo] = useState({ valor: "todo", desde: 0 });
    const cambiarPeriodo = (valor) =>
        setPeriodo({ valor, desde: valor === "todo" ? 0 : Date.now() - Number(valor) * DIA });

    useEffect(() => {
        let vigente = true;
        obtenerCotizaciones()
            .then((datos) => {
                if (!vigente) return;
                // El estado real (vigente o vencida) se calcula una vez, al cargar
                const conEstado = datos.map((c) => ({ ...c, estado: estadoReal(c) }));
                setCotizaciones(conEstado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
            })
            .catch((error) => vigente && setMensaje(error.message));
        return () => {
            vigente = false;
        };
    }, []);

    const texto = busqueda.trim().toLowerCase();
    const visibles = (cotizaciones || []).filter((c) => {
        const coincide = !texto || [c.numero, c.comunaOrigen?.nombreComuna, c.comunaDestino?.nombreComuna]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(texto));
        return coincide && (estado === "todas" || c.estado === estado) && new Date(c.fecha).getTime() >= periodo.desde;
    });

    // Indicadores del informe: se calculan sobre lo que está filtrado
    const total = visibles.reduce((s, c) => s + Number(c.valorTotal || 0), 0);
    const convertidas = visibles.filter((c) => c.estado === "CONVERTIDA").length;
    const vigentes = visibles.filter((c) => c.estado === "VIGENTE").length;

    return (
        <>
            <section className="admin-kpis">
                <article className="admin-kpi">
                    <span>Cotizaciones</span>
                    <strong>{visibles.length}</strong>
                    <small>{vigentes} vigentes</small>
                </article>
                <article className="admin-kpi">
                    <span>Monto cotizado</span>
                    <strong>{formatearCLP(total)}</strong>
                    <small>Suma de los totales con IVA</small>
                </article>
                <article className="admin-kpi">
                    <span>Promedio</span>
                    <strong>{formatearCLP(visibles.length ? total / visibles.length : 0)}</strong>
                    <small>Por cotización</small>
                </article>
                <article className="admin-kpi">
                    <span>Convertidas en OT</span>
                    <strong>{convertidas}</strong>
                    <small>{visibles.length ? Math.round((convertidas / visibles.length) * 100) : 0}% de las cotizaciones</small>
                </article>
            </section>

            <section className="cliente-card">
                <header className="admin-card-header">
                    <div>
                        <span>INFORME</span>
                        <h2>Cotizaciones realizadas</h2>
                    </div>
                    <div className="mx-acciones print:hidden">
                        <button type="button" className="button-secondary" onClick={() => window.print()}>
                            Imprimir informe
                        </button>
                        <Link className="button-primary" to="/cliente/cotizar">Nueva cotización</Link>
                    </div>
                </header>

                <Message texto={mensaje} tipo="error" />

                <div className="mx-toolbar print:hidden">
                    <input
                        type="search"
                        placeholder="Buscar por número o comuna"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        aria-label="Buscar cotización"
                    />
                    <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado">
                        <option value="todas">Todos los estados</option>
                        <option value="VIGENTE">Vigentes</option>
                        <option value="VENCIDA">Vencidas</option>
                        <option value="CONVERTIDA">Convertidas en OT</option>
                    </select>
                    <select value={periodo.valor} onChange={(e) => cambiarPeriodo(e.target.value)} aria-label="Período">
                        <option value="30">Últimos 30 días</option>
                        <option value="90">Últimos 90 días</option>
                        <option value="todo">Todo</option>
                    </select>
                </div>

                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>N°</th>
                                <th>Fecha</th>
                                <th>Origen → Destino</th>
                                <th>Servicio</th>
                                <th>Bultos</th>
                                <th>Kg / m³</th>
                                <th>Total</th>
                                <th>Válida hasta</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cotizaciones === null && !mensaje ? (
                                <tr><td colSpan={9} className="mx-empty">Cargando cotizaciones...</td></tr>
                            ) : visibles.length === 0 ? (
                                <tr><td colSpan={9} className="mx-empty">No hay cotizaciones con estos filtros.</td></tr>
                            ) : visibles.map((c) => {
                                const [textoEstado, clases] = insignias[c.estado] || [c.estado, insignias.VENCIDA[1]];
                                return (
                                    <tr key={c.idCotizacion}>
                                        <td><strong className="font-mono text-marino">{c.numero}</strong></td>
                                        <td>{fecha(c.fecha)}</td>
                                        <td>{c.comunaOrigen?.nombreComuna || "—"} → {c.comunaDestino?.nombreComuna || "—"}</td>
                                        <td>{c.tipoServicio === "NORMAL" ? "Normal" : c.tipoServicio}</td>
                                        <td>{c.cantidadBultos}</td>
                                        <td>{formatearKg(c.pesoTotal)} · {formatearM3(c.volumenM3)}</td>
                                        <td><strong>{formatearCLP(c.valorTotal)}</strong></td>
                                        <td>{formatearFechaSola(c.validaHasta)}</td>
                                        <td>
                                            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${clases}`}>
                                                {textoEstado}{c.numeroOT ? ` · ${c.numeroOT}` : ""}
                                            </span>
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
