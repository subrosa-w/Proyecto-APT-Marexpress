/*
  VISTA: cuentas corrientes
  RUTA: /administrador/cuentas
  CSS: admin-card, mx-table
  API: GET /api/clientes/cuentas-corrientes?periodo=
  FUNCIONES: cuatro listas: con deuda, al día, frecuentes y posibles bajas
*/
import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { formatearCLP, formatearFechaHora } from "../../utils.js";
import Message from "../../components/Message.jsx";

// Tabla reutilizada por los cuatro grupos. El motivo solo aparece en posibles bajas.
const TablaCuentas = ({ titulo, nota, filas, conMotivo = false }) => (
    <div>
        <h3 className="mt-4">{titulo} ({filas.length})</h3>
        <p className="mx-note">{nota}</p>
        <div className="mx-table-wrap">
            <table className="mx-table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>RUT</th>
                        <th>Saldo</th>
                        <th>Límite</th>
                        <th>Órdenes</th>
                        <th>Última orden</th>
                        {conMotivo ? <th>Motivo</th> : null}
                    </tr>
                </thead>
                <tbody>
                    {filas.length === 0 ? (
                        <tr>
                            <td colSpan={conMotivo ? 7 : 6} className="mx-empty">No hay clientes en este grupo.</td>
                        </tr>
                    ) : filas.map((item) => (
                        <tr key={`${titulo}-${item.idCliente}`}>
                            <td>{item.cliente}</td>
                            <td>{item.rut}</td>
                            <td>{formatearCLP(item.saldo)}</td>
                            <td>{formatearCLP(item.limite)}</td>
                            <td>{item.ordenes}</td>
                            <td>{item.ultimaOrden ? formatearFechaHora(item.ultimaOrden) : "—"}</td>
                            {conMotivo ? <td>{(item.motivos || []).join(" · ")}</td> : null}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default function CuentasCorrientesPage() {
    const [periodo, setPeriodo] = useState("mes");
    const [resumen, setResumen] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);

    // Pide el resumen. El período cambia quién cuenta como frecuente, no la deuda.
    const cargar = async (siguiente = periodo) => {
        setCargando(true);
        try {
            const datos = await api(`/clientes/cuentas-corrientes?periodo=${siguiente}`);
            setResumen(datos);
            setMensaje("");
        } catch (error) {
            setMensaje(error.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const umbral = resumen?.umbralFrecuente || 2;

    return (
        <section className="admin-card">
            <header className="admin-card-header">
                <div>
                    <span>COMERCIAL</span>
                    <h2>Clientes con cuenta corriente</h2>
                </div>
            </header>
            <Message texto={mensaje} tipo="error" />
            <form
                className="mx-toolbar"
                onSubmit={(event) => {
                    event.preventDefault();
                    cargar();
                }}
            >
                <select
                    value={periodo}
                    aria-label="Período de clientes frecuentes"
                    onChange={(event) => {
                        const siguiente = event.target.value;
                        setPeriodo(siguiente);
                        cargar(siguiente);
                    }}
                >
                    <option value="dia">Frecuentes de hoy</option>
                    <option value="semana">Frecuentes de esta semana</option>
                    <option value="mes">Frecuentes de este mes</option>
                    <option value="anio">Frecuentes de este año</option>
                </select>
                <button className="button-primary" type="submit" disabled={cargando}>
                    {cargando ? "Cargando..." : "Actualizar"}
                </button>
            </form>
            <p className="mx-note">
                Deuda y al día usan el saldo actual. Frecuente es quien tiene al menos {umbral} órdenes {resumen?.etiqueta || "este mes"}. Posible baja: sin encargos en 90 días, deuda sobre el límite o cliente inactivo.
            </p>
            <div className="mx-ciudad-info">
                <p><span>Con deuda</span><strong>{resumen?.deuda?.length || 0}</strong></p>
                <p><span>Al día</span><strong>{resumen?.alDia?.length || 0}</strong></p>
                <p><span>Frecuentes</span><strong>{resumen?.frecuentes?.length || 0}</strong></p>
                <p><span>Posible baja</span><strong>{resumen?.posiblesBaja?.length || 0}</strong></p>
            </div>
            <TablaCuentas
                titulo="Con deuda"
                nota="Saldo pendiente por cobrar."
                filas={resumen?.deuda || []}
            />
            <TablaCuentas
                titulo="Al día"
                nota="Cuenta activa y sin saldo pendiente."
                filas={resumen?.alDia || []}
            />
            <TablaCuentas
                titulo="Frecuentes"
                nota={`Al menos ${umbral} órdenes ${resumen?.etiqueta || "este mes"}.`}
                filas={resumen?.frecuentes || []}
            />
            <TablaCuentas
                titulo="Posibles dadas de baja"
                nota="Cuentas abiertas que conviene revisar antes de cerrarlas."
                filas={resumen?.posiblesBaja || []}
                conMotivo
            />
        </section>
    );
}
