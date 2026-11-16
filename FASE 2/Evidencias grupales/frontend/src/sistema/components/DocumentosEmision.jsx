/*
  COMPONENTE: ticket y etiquetas
  CSS: vista previa de impresión en sistema.css
  FUNCIONES: ticket de 80 mm y etiquetas de 100×70 mm
*/
import { useEffect, useMemo, useRef, useState } from "react";
import logoMarexpress from "../assets/logo-marexpress.png";
import { empresa } from "../empresa.js";
import { etiquetaComuna, formatearCLP } from "../utils.js";
import { descargarZplEtiquetas, imprimirEtiquetasZebra, imprimirOrdenTermica } from "../utils/impresionTermica.js";

const aplanarBultos = (orden) => {
    const detalles = orden?.detalle_carga || [];
    const existentes = detalles.flatMap((detalle) =>
        (detalle.bulto || []).map((bulto) => ({
            ...bulto,
            descripcion: detalle.descripcion,
            tipo: detalle.tipo_bulto?.nombreTipo
        }))
    );

    if (existentes.length) {
        return existentes;
    }

    return detalles.flatMap((detalle, indice) => {
        const cantidad = Number(detalle.cantidad) || 1;
        return Array.from({ length: cantidad }, (_, pieza) => ({
            idBulto: `${detalle.idDetalleCarga || indice}-${pieza}`,
            codigoBulto: `${orden.numeroOT}-${String(indice + pieza + 1).padStart(3, "0")}`,
            descripcion: detalle.descripcion,
            tipo: detalle.tipo_bulto?.nombreTipo,
            peso: detalle.pesoUnitario,
            largoCm: detalle.largoCm,
            anchoCm: detalle.anchoCm,
            altoCm: detalle.altoCm
        }));
    });
};

function CodigoBarras({ valor, alto = 36 }) {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!svgRef.current || !valor) {
            return;
        }

        let cancelado = false;
        import("jsbarcode").then((modulo) => {
            if (cancelado || !svgRef.current) {
                return;
            }
            const JsBarcode = modulo.default || modulo;
            JsBarcode(svgRef.current, valor, {
                format: "CODE128",
                displayValue: true,
                fontSize: 11,
                height: alto,
                margin: 0,
                lineColor: "#06365e"
            });
        }).catch(() => {});

        return () => {
            cancelado = true;
        };
    }, [valor, alto]);

    return <svg ref={svgRef} className="ot-barcode" role="img" aria-label={valor} />;
}

const numero = (valor, decimales = 2) => {
    const cantidad = Number(valor);
    return Number.isFinite(cantidad) ? cantidad.toFixed(decimales) : "—";
};

const fechaHora = (valor) => {
    const fecha = valor ? new Date(valor) : new Date();
    if (Number.isNaN(fecha.getTime())) {
        return { fecha: "—", hora: "—" };
    }
    return {
        fecha: fecha.toLocaleDateString("es-CL"),
        hora: fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };
};

function VoucherOrden({ orden, origen, destino, pago, etiquetaComuna, formatearCLP }) {
    const momento = fechaHora(orden.fechaCreacion);
    const cargas = orden.detalle_carga || [];
    const recargos = Array.isArray(orden.recargo) ? orden.recargo : [];
    const totalRecargo = recargos.reduce((suma, item) => suma + Number(item.monto || 0), 0);
    const historial = orden.historial_ot || [];
    const usuario = [...historial].at(-1)?.usuario;
    const creador = usuario
        ? [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.nombreUsuario
        : "";
    const observacion = cargas.map((item) => item.observacion).filter(Boolean).join(" · ")
        || orden.referenciaEntrega
        || "SIN OBSERVACIONES";
    const fila = (etiqueta, valor) => (
        <p className="ot-ticket-dato">
            <span>{etiqueta}</span>
            <strong>{valor || "—"}</strong>
        </p>
    );

    return (
        <section className="ot-ticket">
            <header className="ot-ticket-cabeza">
                <img src={logoMarexpress} alt="Marexpress" className="ot-ticket-logo" />
                <div className="ot-ticket-empresa">
                    {empresa.lineas.map((linea) => <p key={linea}>{linea}</p>)}
                </div>
            </header>
            {fila("N° DE TRANSPORTE", orden.numeroOT)}
            <CodigoBarras valor={orden.numeroOT} alto={36} />
            {fila("FECHA", momento.fecha)}
            {fila("HORA", momento.hora)}
            {fila("ORIGEN", etiquetaComuna(origen))}
            {fila("DESTINO", etiquetaComuna(destino))}
            {fila("TIPO ENTREGA", orden.direccionDestino ? "DOMICILIO" : "SUCURSAL")}

            <h3>Datos remitente</h3>
            {fila("NOMBRE", orden.cliente?.razonSocial)}
            {fila("RUT", orden.cliente?.rut)}
            {fila("CIUDAD", etiquetaComuna(origen))}
            {fila("FONO", orden.telefonoOrigen || orden.cliente?.telefono)}

            <h3>Datos destinatario</h3>
            {fila("NOMBRE", orden.destinatario?.nombreRazonSocial || orden.contactoDestino)}
            {fila("RUT", orden.destinatario?.rut)}
            {fila("CIUDAD ENTREGA", etiquetaComuna(destino))}
            {fila("DIRECCIÓN ENTREGA", orden.direccionDestino)}
            {fila("FONO", orden.telefonoDestino || orden.destinatario?.telefono)}

            <h3>Contenido</h3>
            {fila("OBSERVACIÓN", observacion)}
            {fila("GUÍA", orden.numeroDocumento)}

            <table className="ot-ticket-tabla">
                <thead>
                    <tr>
                        <th>Encar</th>
                        <th>Cant</th>
                        <th>Peso</th>
                        <th>Largo</th>
                        <th>Ancho</th>
                        <th>Alto</th>
                        <th>M3</th>
                        <th>Kg</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {cargas.length === 0 ? (
                        <tr><td colSpan="9">Sin carga</td></tr>
                    ) : cargas.map((carga, indice) => (
                        <tr key={carga.idDetalleCarga || indice}>
                            <td>{carga.tipo_bulto?.nombreTipo || "Bulto"}</td>
                            <td>{carga.cantidad}</td>
                            <td>{numero(carga.pesoTotal || carga.pesoUnitario)}</td>
                            <td>{numero(carga.largoCm)}</td>
                            <td>{numero(carga.anchoCm)}</td>
                            <td>{numero(carga.altoCm)}</td>
                            <td>{numero(carga.volumenM3, 3)}</td>
                            <td>{numero(carga.pesoTotal || carga.pesoUnitario)}</td>
                            <td>{indice === 0 ? formatearCLP(orden.valorCargaAplicado) : "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {fila("FORMA DE PAGO", [pago?.tipoPago, pago?.pagadoPor].filter(Boolean).join(" "))}
            {fila("MÉTODO DE PAGO", pago?.metodoPago)}
            {fila("ESTADO DE PAGO", pago?.estadoPago || "PENDIENTE")}
            {fila("VENTA", formatearCLP(orden.valorCargaAplicado))}
            {fila("RETIRO", formatearCLP(orden.valorRetiroAplicado ?? orden.retiro?.valor))}
            {fila("RECARGO", formatearCLP(totalRecargo))}
            {fila("IVA 19%", formatearCLP(orden.valorIva))}
            <p className="ot-ticket-total">
                <span>TOTAL A PAGAR</span>
                <strong>{formatearCLP(orden.valorTotal)}</strong>
            </p>

            <h3>Recepción conforme</h3>
            {fila("FECHA", "")}
            {fila("HORA", "")}
            {fila("NOMBRE", "")}
            {fila("RUT", "")}
            {fila("OBSERVACIONES", "")}
            <p className="ot-ticket-pie">Creado por usuario{creador ? ` : ${creador}` : ""}</p>
        </section>
    );
}

export default function DocumentosEmision({ orden, onCerrar }) {
    const [paso, setPaso] = useState("ot");
    const [imprimiendo, setImprimiendo] = useState(false);
    const [avisoZebra, setAvisoZebra] = useState("");
    const bultos = useMemo(() => aplanarBultos(orden), [orden]);
    const pago = Array.isArray(orden?.pago) ? orden.pago[0] : orden?.pago;
    const origen = orden?.comuna_orden_transporte_idComunaOrigenTocomuna;
    const destino = orden?.comuna_orden_transporte_idComunaDestinoTocomuna;

    if (!orden) {
        return null;
    }

    const medidas = (bulto) => {
        const valores = [bulto.largoCm, bulto.anchoCm, bulto.altoCm].filter((valor) => valor);
        return valores.length ? `${valores.join("×")} cm` : "—";
    };

    const datosImpresion = {
        orden,
        bultos,
        origen,
        destino,
        pago,
        medidas,
        formatearCLP,
        etiquetaComuna
    };

    const imprimirOt = async () => {
        setImprimiendo(true);
        setAvisoZebra("");
        try {
            await imprimirOrdenTermica(datosImpresion);
            setPaso("etiquetas");
        } finally {
            setImprimiendo(false);
        }
    };

    const imprimirEtiquetas = async () => {
        setImprimiendo(true);
        setAvisoZebra("");
        try {
            const modo = await imprimirEtiquetasZebra(datosImpresion);
            setAvisoZebra(modo === "zebra"
                ? "Etiquetas enviadas a la impresora Zebra."
                : "Listas en 100 × 70 mm. Deja ese papel y la escala en 100%.");
        } finally {
            setImprimiendo(false);
        }
    };

    return (
        <div className="ot-impresion">
            <div className="ot-impresion-acciones no-print">
                {paso === "ot" ? (
                    <>
                        <p className="mx-note">La orden se imprime en ticket de 80 mm de ancho. En el diálogo deja ese tamaño de papel y la escala en 100%.</p>
                        <button type="button" className="button-primary" onClick={imprimirOt} disabled={imprimiendo}>
                            {imprimiendo ? "Preparando..." : "Imprimir orden de transporte"}
                        </button>
                        <button type="button" className="button-secondary" onClick={() => setPaso("etiquetas")}>
                            Cerrar impresión de OT
                        </button>
                    </>
                ) : (
                    <>
                        <p className="mx-note">Cada etiqueta sale en una hoja de 100 × 70 mm. En el diálogo deja ese papel y la escala en 100%.</p>
                        {avisoZebra ? <p className="mx-note">{avisoZebra}</p> : null}
                        <button type="button" className="button-primary" onClick={imprimirEtiquetas} disabled={!bultos.length || imprimiendo}>
                            {imprimiendo ? "Preparando..." : "Imprimir etiquetas Zebra"}
                        </button>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => descargarZplEtiquetas(datosImpresion)}
                            disabled={!bultos.length}
                        >
                            Descargar ZPL
                        </button>
                        <button type="button" className="button-secondary" onClick={onCerrar}>
                            Terminar
                        </button>
                    </>
                )}
            </div>

            {paso === "ot" ? (
                <VoucherOrden
                    orden={orden}
                    origen={origen}
                    destino={destino}
                    pago={pago}
                    etiquetaComuna={etiquetaComuna}
                    formatearCLP={formatearCLP}
                />
            ) : (
                <section className="ot-etiquetas">
                    {bultos.length === 0 ? (
                        <p className="mx-note">Esta OT no tiene bultos generados.</p>
                    ) : bultos.map((bulto, indice) => (
                        <article key={bulto.idBulto || bulto.codigoBulto} className="ot-etiqueta">
                            <header className="ot-etiqueta-cabeza">
                                <img src={logoMarexpress} alt="Marexpress" className="ot-etiqueta-logo" />
                                <div>
                                    <span>ETIQUETA {indice + 1}/{bultos.length}</span>
                                    <strong>{orden.numeroOT}</strong>
                                </div>
                            </header>
                            <CodigoBarras valor={bulto.codigoBulto || orden.numeroOT} alto={28} />
                            <p className="ot-etiqueta-codigo">{bulto.codigoBulto}</p>
                            <p className="ot-etiqueta-destino">{etiquetaComuna(destino)}</p>
                            <div className="ot-etiqueta-cuerpo">
                                <p><span>Destino</span><strong>{orden.destinatario?.nombreRazonSocial || orden.contactoDestino}</strong></p>
                                <p><span>Dirección</span><strong>{orden.direccionDestino}</strong></p>
                                <p><span>Tipo</span><strong>{bulto.tipo || "Bulto"}</strong></p>
                                <p><span>Peso</span><strong>{bulto.peso ? `${bulto.peso} kg` : "—"}</strong></p>
                                <p><span>Medidas</span><strong>{medidas(bulto)}</strong></p>
                                <p><span>Origen</span><strong>{etiquetaComuna(origen)}</strong></p>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </div>
    );
}
