import { useEffect, useMemo, useRef, useState } from "react";
import logoMarexpress from "../assets/logo-marexpress.svg";
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
                : "PDF 100 × 70 mm. Elige la Zebra, papel 100×70 y escala 100% (sin ajustar a la página).");
        } finally {
            setImprimiendo(false);
        }
    };

    return (
        <div className="ot-impresion">
            <div className="ot-impresion-acciones no-print">
                {paso === "ot" ? (
                    <>
                        <p className="mx-note">Imprime primero la orden de transporte en ticket 88 mm. Al cerrar esa impresión podrás emitir las etiquetas Zebra 100 × 70 mm.</p>
                        <button type="button" className="button-primary" onClick={imprimirOt} disabled={imprimiendo}>
                            {imprimiendo ? "Preparando..." : "Imprimir orden de transporte"}
                        </button>
                        <button type="button" className="button-secondary" onClick={() => setPaso("etiquetas")}>
                            Cerrar impresión de OT
                        </button>
                    </>
                ) : (
                    <>
                        <p className="mx-note">Etiquetas Zebra 100 × 70 mm (una etiqueta por página). En el diálogo elige la impresora Zebra, papel 100×70 mm y escala 100%. Si está instalado Zebra Browser Print, se envían en ZPL directo.</p>
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
                <section className="ot-ticket">
                    <header className="ot-ticket-cabeza">
                        <div className="ot-logo">
                            <img src={logoMarexpress} alt="" />
                            <strong>MAREXPRESS</strong>
                        </div>
                        <div>
                            <span>ORDEN DE TRANSPORTE</span>
                            <strong>{orden.numeroOT}</strong>
                        </div>
                    </header>
                    <CodigoBarras valor={orden.numeroOT} alto={40} />

                    <h3>Remitente</h3>
                    <p><strong>{orden.cliente?.razonSocial}</strong></p>
                    <p>RUT {orden.cliente?.rut}</p>
                    <p>{orden.direccionOrigen}</p>
                    <p>{etiquetaComuna(origen)}</p>
                    <p>{orden.contactoOrigen} {orden.telefonoOrigen}</p>

                    <h3>Destinatario</h3>
                    <p><strong>{orden.destinatario?.nombreRazonSocial || orden.contactoDestino}</strong></p>
                    {orden.destinatario?.rut ? <p>RUT {orden.destinatario.rut}</p> : null}
                    <p>{orden.direccionDestino}</p>
                    <p>{etiquetaComuna(destino)}</p>
                    <p>{orden.telefonoDestino}</p>
                    {orden.referenciaEntrega ? <p>Ref: {orden.referenciaEntrega}</p> : null}

                    <h3>Pago</h3>
                    <p>{pago?.pagadoPor || "—"} · {pago?.tipoPago || "—"}{pago?.metodoPago ? ` / ${pago.metodoPago}` : ""}</p>
                    <p>{pago?.estadoPago || "—"} · {formatearCLP(orden.valorTotal)}</p>

                    <h3>Cobro</h3>
                    <p>{orden.tarifa?.nombreTarifa || "Tarifa"} · {orden.tipoCobro === "VOLUMEN" ? "m³" : "kg"}</p>
                    <p>{orden.pesoTotal} kg · {orden.volumenTotalM3} m³</p>

                    <h3>Bultos</h3>
                    {bultos.length === 0 ? (
                        <p>Sin bultos</p>
                    ) : bultos.map((bulto) => (
                        <p key={bulto.idBulto || bulto.codigoBulto} className="ot-ticket-linea">
                            <strong>{bulto.codigoBulto}</strong>
                            <span>{bulto.tipo || "Bulto"} · {bulto.descripcion || "—"}</span>
                            <span>{bulto.peso ? `${bulto.peso} kg` : "—"} · {medidas(bulto)}</span>
                        </p>
                    ))}

                    <p className="ot-ticket-total">TOTAL {formatearCLP(orden.valorTotal)}</p>
                    <p className="ot-ticket-pie">MAREXPRESS · {bultos.length} bulto{bultos.length === 1 ? "" : "s"}</p>
                </section>
            ) : (
                <section className="ot-etiquetas">
                    {bultos.length === 0 ? (
                        <p className="mx-note">Esta OT no tiene bultos generados.</p>
                    ) : bultos.map((bulto, indice) => (
                        <article key={bulto.idBulto || bulto.codigoBulto} className="ot-etiqueta">
                            <header className="ot-etiqueta-cabeza">
                                <div className="ot-logo">
                                    <img src={logoMarexpress} alt="" />
                                    <strong>MAREXPRESS</strong>
                                </div>
                                <div>
                                    <span>ETIQUETA {indice + 1}/{bultos.length}</span>
                                    <strong>{orden.numeroOT}</strong>
                                </div>
                            </header>
                            <CodigoBarras valor={bulto.codigoBulto || orden.numeroOT} alto={32} />
                            <p className="ot-etiqueta-codigo">{bulto.codigoBulto}</p>
                            <div className="ot-etiqueta-cuerpo">
                                <p><span>Destino</span><strong>{orden.destinatario?.nombreRazonSocial || orden.contactoDestino}</strong></p>
                                <p><span>Dirección</span><strong>{orden.direccionDestino}</strong></p>
                                <p><span>Comuna</span><strong>{etiquetaComuna(destino)}</strong></p>
                                <p><span>Tipo</span><strong>{bulto.tipo || "—"}</strong></p>
                                <p><span>Peso</span><strong>{bulto.peso ? `${bulto.peso} kg` : "—"}</strong></p>
                                <p><span>Medidas</span><strong>{medidas(bulto)}</strong></p>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </div>
    );
}
