/*
  VISTA: caja y retiro en bodega
  RUTA: /operador/caja y /administrador/caja
  CSS: admin-card, mx-scan, mx-table, button-primary
  API: GET /api/pagos/caja/:codigo y POST /api/pagos/caja
  FUNCIONES: el operador elige la orden y el sistema indica el medio antes de soltar la caja.
*/
import { useState } from "react";
import { api } from "../../api.js";
import { codigoConPrefijo, PREFIJO_OT } from "../../entrada.jsx";
import { formatearCLP } from "../../utils.js";
import Message from "../../components/Message.jsx";

const pastilla = {
    Impaga: "bg-amber-50 text-amber-800",
    "Por cuadrar": "bg-sky-50 text-sky-800",
    Pagada: "bg-green-50 text-green-800",
    "Cuenta corriente": "bg-violet-50 text-violet-800",
    "Sin registro": "bg-slate-100 text-slate-600"
};

const indicacion = (orden) => {
    const monto = formatearCLP(orden.total);
    const medio = orden.medio && orden.medio !== "—" ? orden.medio : "";
    if (orden.etiqueta === "Impaga") {
        return {
            detalle: `Por pagar · ${monto}`,
            accion: "Cobrar en efectivo, tarjeta o transferencia"
        };
    }
    if (orden.etiqueta === "Pagada") {
        return {
            detalle: medio ? `${medio} en origen` : "Ya cobrada",
            accion: "Puede retirar. No se cobra de nuevo."
        };
    }
    if (orden.etiqueta === "Cuenta corriente") {
        return {
            detalle: "",
            accion: "No se cobra en caja. Sigue en el mes."
        };
    }
    if (orden.etiqueta === "Por cuadrar") {
        return {
            detalle: medio ? `${medio} declarado` : "Declarado por el peoneta",
            accion: "No se cobra en caja. Se da de baja al cuadrar el manifiesto."
        };
    }
    return {
        detalle: "",
        accion: "Esta orden no tiene un pago registrado."
    };
};

export default function CajaRetiroPage() {
    const [codigo, setCodigo] = useState(PREFIJO_OT);
    const [orden, setOrden] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");
    const [cargando, setCargando] = useState(false);

    const abrir = async (event) => {
        event.preventDefault();
        setCargando(true);
        try {
            const datos = await api(`/pagos/caja/${encodeURIComponent(codigo.trim())}`);
            setOrden(datos.orden);
            setCodigo(datos.orden.numeroOT);
            setMensaje("");
        } catch (error) {
            setOrden(null);
            setMensaje(error.message);
            setTipo("error");
        } finally {
            setCargando(false);
        }
    };

    const cobrar = async (metodoPago) => {
        setCargando(true);
        try {
            const datos = await api("/pagos/caja", {
                method: "POST",
                body: JSON.stringify({ numeroOT: orden.numeroOT, metodoPago })
            });
            setOrden(datos.orden);
            setMensaje("La orden quedó pagada. Si después viaja, el manifiesto la muestra cobrada.");
            setTipo("success");
        } catch (error) {
            setMensaje(error.message);
            setTipo("error");
        } finally {
            setCargando(false);
        }
    };

    const visto = orden ? indicacion(orden) : null;

    return (
        <section className="admin-card">
            <header className="admin-card-header">
                <div>
                    <span>CAJA</span>
                    <h2>Cobrar o retirar</h2>
                </div>
            </header>
            <p className="mx-note">Elige la orden. El sistema muestra el medio antes de soltar la caja.</p>
            <Message texto={mensaje} tipo={tipo} />
            <form className="mx-scan" onSubmit={abrir}>
                <label>
                    Orden
                    <input
                        value={codigo}
                        onChange={(event) => setCodigo(codigoConPrefijo(event.target.value, PREFIJO_OT))}
                        onFocus={(event) => event.target.select()}
                        autoComplete="off"
                    />
                </label>
                <button className="button-primary" type="submit" disabled={cargando || codigo === PREFIJO_OT}>
                    {cargando ? "Buscando..." : "Abrir"}
                </button>
            </form>

            <div className="mx-table-wrap mt-4">
                <table className="mx-table">
                    <thead>
                        <tr>
                            <th>OT</th>
                            <th>Qué indica</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orden ? (
                            <tr>
                                <td>{orden.numeroOT}</td>
                                <td>
                                    <span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${pastilla[orden.etiqueta] || pastilla["Sin registro"]}`}>
                                        {orden.etiqueta}
                                    </span>
                                    {visto.detalle}
                                </td>
                                <td>{visto.accion}</td>
                            </tr>
                        ) : (
                            <tr>
                                <td colSpan={3} className="mx-empty">Abre la orden para ver si se cobra o se retira.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {orden?.puedeCobrar ? (
                <div className="mx-form-actions">
                    <button className="button-primary" type="button" disabled={cargando} onClick={() => cobrar("EFECTIVO")}>Cobrar en efectivo</button>
                    <button className="button-secondary" type="button" disabled={cargando} onClick={() => cobrar("TARJETA")}>Cobrar con tarjeta</button>
                    <button className="button-marino" type="button" disabled={cargando} onClick={() => cobrar("TRANSFERENCIA")}>Cobrar por transferencia</button>
                </div>
            ) : null}

            <p className="mx-note">La baja en caja es inmediata, porque el dinero se recibe en el mesón. Si esa orden después viaja, el manifiesto la muestra pagada.</p>
        </section>
    );
}
