import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { api } from "../../api.js";
import { useBodegaTrabajo } from "../../bodegaTrabajo.jsx";
import Message from "../../components/Message.jsx";
import { formatearCLP, ordenAnulada } from "../../utils.js";

const extraerLista = (datos, clave) => {
    if (Array.isArray(datos)) {
        return datos;
    }
    if (Array.isArray(datos?.[clave])) {
        return datos[clave];
    }
    return [];
};

const mensajeRetorno = (estado) => {
    if (estado === "ok") {
        return { texto: "Pago Webpay autorizado. La OT quedó marcada como pagada.", tipo: "success" };
    }
    if (estado === "rechazado") {
        return { texto: "Webpay rechazó el pago. Puedes reintentar con otra tarjeta de prueba.", tipo: "error" };
    }
    if (estado === "anulado") {
        return { texto: "El pago se anuló en Webpay. La OT sigue pendiente.", tipo: "info" };
    }
    if (estado === "error") {
        return { texto: "No se pudo confirmar el pago con Webpay. Revisa la OT e inténtalo de nuevo.", tipo: "error" };
    }
    return { texto: "", tipo: "info" };
};

const irAWebpay = (url, token) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    const campo = document.createElement("input");
    campo.type = "hidden";
    campo.name = "token_ws";
    campo.value = token;
    form.appendChild(campo);
    document.body.appendChild(form);
    form.submit();
};

export default function PagosOtPage() {
    const { idComuna } = useBodegaTrabajo();
    const [searchParams, setSearchParams] = useSearchParams();
    const scanRef = useRef(null);
    const [numeroOT, setNumeroOT] = useState(searchParams.get("ot") || "");
    const [orden, setOrden] = useState(null);
    const [pendientes, setPendientes] = useState([]);
    const [tarjetas, setTarjetas] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState("info");
    const [cargando, setCargando] = useState(false);
    const [pagando, setPagando] = useState(false);

    const aviso = (texto, tipoAviso = "info") => {
        setMensaje(texto);
        setTipo(tipoAviso);
    };

    const cargarPendientes = () => {
        api("/pagos/pendientes")
            .then((respuesta) => setPendientes(extraerLista(respuesta, "ordenes")))
            .catch(() => setPendientes([]));
    };

    const pendientesBodega = useMemo(
        () => pendientes.filter((item) =>
            !ordenAnulada(item)
            && (!idComuna || Number(item.idComunaOrigen) === Number(idComuna))
        ),
        [pendientes, idComuna]
    );

    useEffect(() => {
        api("/pagos/webpay/ambiente")
            .then((respuesta) => setTarjetas(respuesta.tarjetas || []))
            .catch(() => setTarjetas([]));
        cargarPendientes();
    }, []);

    useEffect(() => {
        const retorno = mensajeRetorno(searchParams.get("estado"));
        if (retorno.texto) {
            aviso(retorno.texto, retorno.tipo);
        }
        const inicial = searchParams.get("ot");
        if (inicial) {
            setNumeroOT(inicial);
        }
        scanRef.current?.focus();
    }, [searchParams]);

    useEffect(() => {
        const inicial = new URLSearchParams(window.location.search).get("ot");
        if (inicial) {
            buscar(inicial);
        }
        // carga inicial de OT en query
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const buscar = async (valor) => {
        const numero = String(valor || numeroOT || "").trim();
        if (!numero) {
            aviso("Ingresa el número de OT", "error");
            return;
        }
        setCargando(true);
        try {
            const resultado = await api(`/pagos/ot/${encodeURIComponent(numero)}`);
            if (ordenAnulada(resultado)) {
                setOrden(null);
                aviso(`${resultado.numeroOT} está anulada y no se puede pagar.`, "error");
                return;
            }
            setOrden(resultado);
            setNumeroOT(resultado.numeroOT || numero);
            setSearchParams((actual) => {
                const siguiente = new URLSearchParams(actual);
                siguiente.set("ot", resultado.numeroOT || numero);
                return siguiente;
            }, { replace: true });
            if (!searchParams.get("estado")) {
                aviso(
                    resultado.pagada
                        ? `${resultado.numeroOT} ya está pagada.`
                        : `${resultado.numeroOT} lista para pago Webpay.`,
                    resultado.pagada ? "success" : "info"
                );
            }
        } catch (error) {
            setOrden(null);
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const pagar = async () => {
        if (!orden?.puedePagar) {
            return;
        }
        setPagando(true);
        try {
            const resultado = await api("/pagos/webpay/iniciar", {
                method: "POST",
                body: JSON.stringify({
                    idOrden: orden.idOrden,
                    numeroOT: orden.numeroOT
                })
            });
            if (!resultado.url || !resultado.token) {
                throw new Error("Webpay no devolvió la URL de pago");
            }
            irAWebpay(resultado.url, resultado.token);
        } catch (error) {
            setPagando(false);
            aviso(error.message, "error");
        }
    };

    const ambiente = useMemo(
        () => tarjetas.length > 0,
        [tarjetas]
    );

    return (
        <>
            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>WEBPAY INTEGRACIÓN</span>
                        <h2>Pago de OT</h2>
                    </div>
                </header>
                <Message texto={mensaje} tipo={tipo} />
                <p className="mx-note">
                    Busca la orden y paga el valor total con Webpay Plus de prueba (comercio 597055555532).
                    Tras pagar, Transbank vuelve a MAREXPRESS y marca la OT como pagada.
                </p>
                <form
                    className="mx-scan"
                    onSubmit={(evento) => {
                        evento.preventDefault();
                        buscar();
                    }}
                >
                    <label>
                        Número de OT
                        <input
                            ref={scanRef}
                            value={numeroOT}
                            onChange={(evento) => setNumeroOT(evento.target.value.toUpperCase())}
                            placeholder="OT-000123"
                            autoComplete="off"
                        />
                    </label>
                    <button type="submit" className="button-primary" disabled={cargando}>
                        {cargando ? "Buscando..." : "Buscar"}
                    </button>
                </form>

                {orden ? (
                    <div className="mx-detalle-pago">
                        <p><strong>{orden.numeroOT}</strong> · {orden.cliente || "Sin cliente"}</p>
                        <p>Estado OT: {orden.estadoOt || "—"}</p>
                        <p>Monto: {formatearCLP(orden.monto)}</p>
                        <p>
                            Pago: {orden.pago?.estadoPago || "Sin registro"}
                            {orden.pago?.tipoPago ? ` · ${orden.pago.tipoPago}` : ""}
                            {orden.pago?.metodoPago ? ` · ${orden.pago.metodoPago}` : ""}
                        </p>
                        {orden.pago?.observacion ? <p>{orden.pago.observacion}</p> : null}
                        {orden.puedePagar ? (
                            <button
                                type="button"
                                className="button-primary"
                                onClick={pagar}
                                disabled={pagando}
                            >
                                {pagando ? "Redirigiendo a Webpay..." : "Pagar con Webpay"}
                            </button>
                        ) : (
                            <p className="mx-note">
                                {orden.pagada
                                    ? "Esta OT ya está pagada."
                                    : orden.cuentaCorriente
                                        ? "Esta OT se cobra por cuenta corriente."
                                        : "Esta OT no se puede pagar por Webpay."}
                            </p>
                        )}
                    </div>
                ) : null}
            </section>

            {ambiente ? (
                <section className="admin-card operador-card">
                    <header className="admin-card-header">
                        <div>
                            <span>TARJETAS DE PRUEBA</span>
                            <h2>Ambiente Transbank</h2>
                        </div>
                    </header>
                    <div className="mx-table-wrap">
                        <table className="mx-table">
                            <thead>
                                <tr>
                                    <th>Resultado</th>
                                    <th>Tarjeta</th>
                                    <th>Número</th>
                                    <th>CVV</th>
                                    <th>RUT / clave</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tarjetas.map((tarjeta) => (
                                    <tr key={tarjeta.numero}>
                                        <td>{tarjeta.resultado}</td>
                                        <td>{tarjeta.marca}</td>
                                        <td>{tarjeta.numero}</td>
                                        <td>{tarjeta.cvv}</td>
                                        <td>{tarjeta.rut} · clave {tarjeta.clave || "123"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            <section className="admin-card operador-card">
                <header className="admin-card-header">
                    <div>
                        <span>PENDIENTES</span>
                        <h2>OT por pagar</h2>
                    </div>
                </header>
                <div className="mx-table-wrap">
                    <table className="mx-table">
                        <thead>
                            <tr>
                                <th>OT</th>
                                <th>Cliente</th>
                                <th>Monto</th>
                                <th>Tipo</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendientesBodega.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="mx-empty">No hay OT pendientes de pago en esta bodega.</td>
                                </tr>
                            ) : pendientesBodega.map((item) => (
                                <tr key={item.idOrden}>
                                    <td>{item.numeroOT}</td>
                                    <td>{item.cliente}</td>
                                    <td>{formatearCLP(item.monto)}</td>
                                    <td>{item.pago?.tipoPago || "Sin registro"}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="button-secondary"
                                            onClick={() => {
                                                setNumeroOT(item.numeroOT);
                                                buscar(item.numeroOT);
                                            }}
                                        >
                                            Pagar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

export function RedirigirComprobantesAPagos() {
    return <Navigate to="/operador/pagos" replace />;
}
