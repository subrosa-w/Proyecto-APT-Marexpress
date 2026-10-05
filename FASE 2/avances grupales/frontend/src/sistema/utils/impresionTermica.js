import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";

const ANCHO_ETIQUETA_MM = 100;
const ALTO_ETIQUETA_MM = 70;
const ANCHO_OT_MM = 88;

const zplTexto = (texto, max = 60) =>
    String(texto ?? "")
        .replace(/[\^~\\]/g, " ")
        .slice(0, max);

const barcodePng = (valor, { alto = 80, anchoBarra = 2 } = {}) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, valor, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: alto,
        width: anchoBarra,
        lineColor: "#000000",
        background: "#ffffff"
    });
    return canvas.toDataURL("image/png");
};

const descargarArchivo = (blob, nombre) => {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
};

const imprimirBlob = (blob, nombre) =>
    new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const ventana = window.open(url, "_blank");
        if (!ventana) {
            descargarArchivo(blob, nombre);
            resolve();
            return;
        }

        let listo = false;
        const terminar = () => {
            if (listo) {
                return;
            }
            listo = true;
            try {
                ventana.focus();
                ventana.print();
            } catch {
                descargarArchivo(blob, nombre);
            }
            resolve();
        };

        ventana.addEventListener("load", () => window.setTimeout(terminar, 400));
        window.setTimeout(terminar, 1200);
    });

export const crearPdfOrden = ({ orden, bultos, origen, destino, pago, medidas, formatearCLP, etiquetaComuna }) => {
    const alto = Math.max(180, 118 + bultos.length * 14);
    const doc = new jsPDF({ unit: "mm", format: [ANCHO_OT_MM, alto], orientation: "portrait" });
    const margen = 4;
    let y = 6;

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("MAREXPRESS", margen, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("ORDEN DE TRANSPORTE", ANCHO_OT_MM - margen, y, { align: "right" });
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(orden.numeroOT, ANCHO_OT_MM / 2, y, { align: "center" });
    y += 4;

    const barcode = barcodePng(orden.numeroOT, { alto: 70, anchoBarra: 2 });
    doc.addImage(barcode, "PNG", margen, y, ANCHO_OT_MM - margen * 2, 14);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(orden.numeroOT, ANCHO_OT_MM / 2, y, { align: "center" });
    y += 6;

    const bloque = (titulo, lineas) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(titulo.toUpperCase(), margen, y);
        doc.setLineWidth(0.2);
        doc.line(margen, y + 1, ANCHO_OT_MM - margen, y + 1);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        lineas.filter(Boolean).forEach((linea) => {
            const filas = doc.splitTextToSize(String(linea), ANCHO_OT_MM - margen * 2);
            doc.text(filas, margen, y);
            y += filas.length * 4;
        });
        y += 2;
    };

    bloque("Remitente", [
        orden.cliente?.razonSocial,
        orden.cliente?.rut ? `RUT ${orden.cliente.rut}` : "",
        orden.direccionOrigen,
        etiquetaComuna(origen),
        [orden.contactoOrigen, orden.telefonoOrigen].filter(Boolean).join(" ")
    ]);

    bloque("Destinatario", [
        orden.destinatario?.nombreRazonSocial || orden.contactoDestino,
        orden.destinatario?.rut ? `RUT ${orden.destinatario.rut}` : "",
        orden.direccionDestino,
        etiquetaComuna(destino),
        orden.telefonoDestino,
        orden.referenciaEntrega ? `Ref: ${orden.referenciaEntrega}` : ""
    ]);

    bloque("Pago", [
        [pago?.pagadoPor, pago?.tipoPago, pago?.metodoPago].filter(Boolean).join(" · "),
        `${pago?.estadoPago || "—"} · ${formatearCLP(orden.valorTotal)}`
    ]);

    bloque("Cobro", [
        `${orden.tarifa?.nombreTarifa || "Tarifa"} · ${orden.tipoCobro === "VOLUMEN" ? "m³" : "kg"}`,
        `${orden.pesoTotal} kg · ${orden.volumenTotalM3} m³`
    ]);

    bloque("Bultos", bultos.length ? bultos.map((bulto) =>
        `${bulto.codigoBulto}  ${bulto.tipo || "Bulto"} · ${bulto.descripcion || "—"} · ${bulto.peso ? `${bulto.peso} kg` : "—"} · ${medidas(bulto)}`
    ) : ["Sin bultos"]);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL ${formatearCLP(orden.valorTotal)}`, ANCHO_OT_MM / 2, y + 2, { align: "center" });

    return doc.output("blob");
};

const dibujarEtiquetaPdf = (doc, { orden, bulto, indice, total, destino, medidas, etiquetaComuna }) => {
    const m = 4;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("MAREXPRESS", m, 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`ETIQUETA ${indice + 1}/${total}`, ANCHO_ETIQUETA_MM - m, 7, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(orden.numeroOT, m, 14);

    const codigo = bulto.codigoBulto || orden.numeroOT;
    const barcode = barcodePng(codigo, { alto: 64, anchoBarra: 2 });
    doc.addImage(barcode, "PNG", m, 16, ANCHO_ETIQUETA_MM - m * 2, 16);
    doc.setFontSize(10);
    doc.text(codigo, ANCHO_ETIQUETA_MM / 2, 36, { align: "center" });

    const campos = [
        ["DESTINO", orden.destinatario?.nombreRazonSocial || orden.contactoDestino || "—"],
        ["DIRECCIÓN", orden.direccionDestino || "—"],
        ["COMUNA", etiquetaComuna(destino) || "—"],
        ["TIPO", bulto.tipo || "—"],
        ["PESO", bulto.peso ? `${bulto.peso} kg` : "—"],
        ["MEDIDAS", medidas(bulto)]
    ];

    let y = 41;
    const col = (ANCHO_ETIQUETA_MM - m * 2 - 3) / 2;
    campos.forEach((campo, i) => {
        const x = m + (i % 2) * (col + 3);
        if (i % 2 === 0 && i > 0) {
            y += 9;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.text(campo[0], x, y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        const lineas = doc.splitTextToSize(String(campo[1]), col);
        doc.text(lineas.slice(0, 2), x, y + 3.5);
    });
};

export const crearPdfEtiquetas = ({ orden, bultos, destino, medidas, etiquetaComuna }) => {
    const doc = new jsPDF({
        unit: "mm",
        format: [ANCHO_ETIQUETA_MM, ALTO_ETIQUETA_MM],
        orientation: "landscape",
        compress: true
    });
    doc.internal.pageSize.width = ANCHO_ETIQUETA_MM;
    doc.internal.pageSize.height = ALTO_ETIQUETA_MM;

    bultos.forEach((bulto, indice) => {
        if (indice > 0) {
            doc.addPage([ANCHO_ETIQUETA_MM, ALTO_ETIQUETA_MM], "landscape");
            doc.internal.pageSize.width = ANCHO_ETIQUETA_MM;
            doc.internal.pageSize.height = ALTO_ETIQUETA_MM;
        }
        dibujarEtiquetaPdf(doc, {
            orden,
            bulto,
            indice,
            total: bultos.length,
            destino,
            medidas,
            etiquetaComuna
        });
    });

    return doc.output("blob");
};

const generarZplEtiquetas = ({ orden, bultos, destino, medidas, etiquetaComuna }) => {
    const mm = (valor) => Math.round((valor * 203) / 25.4);
    const ancho = mm(ANCHO_ETIQUETA_MM);
    const alto = mm(ALTO_ETIQUETA_MM);

    return bultos.map((bulto, indice) => {
        const codigo = zplTexto(bulto.codigoBulto || orden.numeroOT, 40);
        const destinoNombre = zplTexto(orden.destinatario?.nombreRazonSocial || orden.contactoDestino, 42);
        const direccion = zplTexto(orden.direccionDestino, 48);
        const comuna = zplTexto(etiquetaComuna(destino), 42);

        return `^XA
^CI28
^PW${ancho}
^LL${alto}
^LH0,0
^PR4
^MD20
^FO24,16^A0N,28,28^FDMAREXPRESS^FS
^FO520,18^A0N,22,22^FDETIQUETA ${indice + 1}/${bultos.length}^FS
^FO24,48^A0N,40,40^FD${zplTexto(orden.numeroOT, 20)}^FS
^FO40,100^BY2,2,90
^BCN,90,Y,N,N^FD${codigo}^FS
^FO24,230^A0N,16,16^FDDESTINO^FS
^FO24,250^A0N,24,24^FB360,2,0,L,0^FD${destinoNombre}^FS
^FO410,230^A0N,16,16^FDTIPO^FS
^FO410,250^A0N,24,24^FD${zplTexto(bulto.tipo || "Bulto", 20)}^FS
^FO24,300^A0N,16,16^FDDIRECCION^FS
^FO24,320^A0N,22,22^FB360,2,0,L,0^FD${direccion}^FS
^FO410,300^A0N,16,16^FDPESO^FS
^FO410,320^A0N,24,24^FD${zplTexto(bulto.peso ? `${bulto.peso} kg` : "-", 16)}^FS
^FO24,380^A0N,16,16^FDCOMUNA^FS
^FO24,400^A0N,22,22^FB360,2,0,L,0^FD${comuna}^FS
^FO410,380^A0N,16,16^FDMEDIDAS^FS
^FO410,400^A0N,22,22^FD${zplTexto(medidas(bulto), 20)}^FS
^XZ`;
    }).join("\n");
};

const enviarZplZebra = async (zpl) => {
    try {
        const defecto = await fetch("http://127.0.0.1:9100/default?type=printer");
        if (!defecto.ok) {
            return false;
        }
        const device = await defecto.json();
        const envio = await fetch("http://127.0.0.1:9100/write", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device, data: zpl })
        });
        return envio.ok;
    } catch {
        return false;
    }
};

export const imprimirOrdenTermica = async (datos) => {
    const blob = crearPdfOrden(datos);
    await imprimirBlob(blob, `OT-${datos.orden.numeroOT}.pdf`);
};

export const descargarZplEtiquetas = (datos) => {
    const zpl = generarZplEtiquetas(datos);
    descargarArchivo(
        new Blob([zpl], { type: "text/plain;charset=utf-8" }),
        `etiquetas-${datos.orden.numeroOT}.zpl`
    );
};

export const imprimirEtiquetasZebra = async (datos) => {
    const zpl = generarZplEtiquetas(datos);
    const enviado = await enviarZplZebra(zpl);
    if (enviado) {
        return "zebra";
    }

    const blob = crearPdfEtiquetas(datos);
    await imprimirBlob(blob, `etiquetas-${datos.orden.numeroOT}.pdf`);
    return "pdf";
};
