import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import { empresa } from "../empresa.js";

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

let logoListo = null;
const logoPdf = async () => {
    if (logoListo) {
        return logoListo;
    }
    try {
        const modulo = await import("../assets/logo-marexpress.png");
        const respuesta = await fetch(modulo.default);
        const blob = await respuesta.blob();
        logoListo = await new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onload = () => resolve(lector.result);
            lector.onerror = () => reject(lector.error);
            lector.readAsDataURL(blob);
        });
        return logoListo;
    } catch {
        return null;
    }
};

const descargarArchivo = (blob, nombre) => {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
};

/*
  IMPRESIÓN
  crearPdfOrden         ticket de la OT en 80 mm
  crearPdfEtiquetas     etiquetas de 100×70 mm
  imprimirOrdenTermica  abre el ticket para imprimir
  descargarZplEtiquetas archivo ZPL para una Zebra
  imprimirEtiquetasZebra envía las etiquetas a 127.0.0.1:9100
*/
export const crearPdfOrden = async ({ orden, origen, destino, pago, formatearCLP, etiquetaComuna }) => {
    const cargas = orden.detalle_carga || [];
    const alto = Math.max(220, 190 + cargas.length * 6);
    const doc = new jsPDF({ unit: "mm", format: [ANCHO_OT_MM, alto], orientation: "portrait" });
    const margen = 4;
    let y = 5;
    const logo = await logoPdf();
    if (logo) {
        doc.addImage(logo, "PNG", margen, y, 34, 12);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    empresa.lineas.forEach((linea, indice) => {
        doc.text(linea, ANCHO_OT_MM - margen, y + 3 + indice * 3.2, { align: "right" });
    });
    y += 16;

    const fila = (etiqueta, valor) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(String(etiqueta), margen, y);
        doc.setFont("helvetica", "normal");
        const texto = doc.splitTextToSize(String(valor || "—"), 46);
        doc.text(texto, ANCHO_OT_MM - margen, y, { align: "right" });
        y += Math.max(4, texto.length * 3.4);
    };
    const titulo = (texto) => {
        y += 1;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(texto, ANCHO_OT_MM / 2, y, { align: "center" });
        doc.setLineWidth(0.2);
        doc.line(margen, y + 1, ANCHO_OT_MM - margen, y + 1);
        y += 5;
    };

    const momento = orden.fechaCreacion ? new Date(orden.fechaCreacion) : new Date();
    const recargos = Array.isArray(orden.recargo) ? orden.recargo : [];
    const totalRecargo = recargos.reduce((suma, item) => suma + Number(item.monto || 0), 0);
    const usuario = [...(orden.historial_ot || [])].at(-1)?.usuario;
    const creador = usuario
        ? [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.nombreUsuario
        : "";

    fila("N° DE TRANSPORTE", orden.numeroOT);
    const barcode = barcodePng(orden.numeroOT, { alto: 70, anchoBarra: 2 });
    doc.addImage(barcode, "PNG", margen, y, ANCHO_OT_MM - margen * 2, 12);
    y += 15;
    fila("FECHA", momento.toLocaleDateString("es-CL"));
    fila("HORA", momento.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    fila("ORIGEN", etiquetaComuna(origen));
    fila("DESTINO", etiquetaComuna(destino));
    fila("TIPO ENTREGA", orden.direccionDestino ? "DOMICILIO" : "SUCURSAL");

    titulo("DATOS REMITENTE");
    fila("NOMBRE", orden.cliente?.razonSocial);
    fila("RUT", orden.cliente?.rut);
    fila("CIUDAD", etiquetaComuna(origen));
    fila("FONO", orden.telefonoOrigen || orden.cliente?.telefono);

    titulo("DATOS DESTINATARIO");
    fila("NOMBRE", orden.destinatario?.nombreRazonSocial || orden.contactoDestino);
    fila("RUT", orden.destinatario?.rut);
    fila("CIUDAD ENTREGA", etiquetaComuna(destino));
    fila("DIRECCION ENTREGA", orden.direccionDestino);
    fila("FONO", orden.telefonoDestino || orden.destinatario?.telefono);

    titulo("CONTENIDO");
    fila("OBSERVACION", orden.referenciaEntrega || "SIN OBSERVACIONES");
    fila("GUIA", orden.numeroDocumento);

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("Encar  Cant  Peso  Largo  Ancho  Alto  M3  Valor", margen, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    (cargas.length ? cargas : [{ tipo_bulto: { nombreTipo: "Sin carga" } }]).forEach((carga, indice) => {
        const linea = [
            carga.tipo_bulto?.nombreTipo || "Bulto",
            carga.cantidad ?? "—",
            carga.pesoTotal ?? carga.pesoUnitario ?? "—",
            carga.largoCm ?? "—",
            carga.anchoCm ?? "—",
            carga.altoCm ?? "—",
            carga.volumenM3 ?? "—",
            indice === 0 ? formatearCLP(orden.valorCargaAplicado) : "—"
        ].join("  ");
        const filas = doc.splitTextToSize(linea, ANCHO_OT_MM - margen * 2);
        doc.text(filas, margen, y);
        y += filas.length * 3.2;
    });
    y += 2;

    fila("FORMA DE PAGO", [pago?.tipoPago, pago?.pagadoPor].filter(Boolean).join(" "));
    fila("METODO DE PAGO", pago?.metodoPago);
    fila("ESTADO DE PAGO", pago?.estadoPago || "PENDIENTE");
    fila("VENTA", formatearCLP(orden.valorCargaAplicado));
    fila("RETIRO", formatearCLP(orden.valorRetiroAplicado));
    fila("RECARGO", formatearCLP(totalRecargo));
    fila("IVA 19%", formatearCLP(orden.valorIva));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`TOTAL A PAGAR  ${formatearCLP(orden.valorTotal)}`, margen, y + 2);
    y += 8;

    titulo("RECEPCION CONFORME");
    fila("FECHA", " ");
    fila("HORA", " ");
    fila("NOMBRE", " ");
    fila("RUT", " ");
    fila("OBSERVACIONES", " ");
    doc.setFontSize(7);
    doc.text(`Creado por usuario${creador ? ` : ${creador}` : ""}`, ANCHO_OT_MM / 2, y, { align: "center" });

    return doc.output("blob");
};

const dibujarEtiquetaPdf = (doc, { orden, bulto, indice, total, origen, destino, medidas, etiquetaComuna, logo }) => {
    const m = 4;
    doc.setTextColor(0, 0, 0);
    if (logo) {
        doc.addImage(logo, "PNG", m, 2, 32, 11);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`ETIQUETA ${indice + 1}/${total}`, ANCHO_ETIQUETA_MM - m, 6, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(orden.numeroOT, ANCHO_ETIQUETA_MM - m, 11, { align: "right" });

    const codigo = bulto.codigoBulto || orden.numeroOT;
    const barcode = barcodePng(codigo, { alto: 64, anchoBarra: 2 });
    doc.addImage(barcode, "PNG", m, 13, ANCHO_ETIQUETA_MM - m * 2, 14);
    doc.setFontSize(9);
    doc.text(codigo, ANCHO_ETIQUETA_MM / 2, 31, { align: "center" });
    doc.setFontSize(11);
    doc.text(String(etiquetaComuna(destino) || "DESTINO"), ANCHO_ETIQUETA_MM / 2, 36, { align: "center" });

    const campos = [
        ["DESTINO", orden.destinatario?.nombreRazonSocial || orden.contactoDestino || "—"],
        ["ORIGEN", etiquetaComuna(origen) || "—"],
        ["DIRECCIÓN", orden.direccionDestino || "—"],
        ["TIPO", bulto.tipo || "—"],
        ["PESO", bulto.peso ? `${bulto.peso} kg` : "—"],
        ["MEDIDAS", medidas(bulto)]
    ];

    let y = 40;
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

export const crearPdfEtiquetas = async ({ orden, bultos, origen, destino, medidas, etiquetaComuna }) => {
    const logo = await logoPdf();
    const doc = new jsPDF({
        unit: "mm",
        format: [ANCHO_ETIQUETA_MM, ALTO_ETIQUETA_MM],
        orientation: "portrait",
        compress: true
    });

    bultos.forEach((bulto, indice) => {
        if (indice > 0) {
            doc.addPage([ANCHO_ETIQUETA_MM, ALTO_ETIQUETA_MM], "portrait");
        }
        dibujarEtiquetaPdf(doc, {
            orden,
            bulto,
            indice,
            total: bultos.length,
            origen,
            destino,
            medidas,
            etiquetaComuna,
            logo
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

const escaparHtml = (valor) => String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const imprimirDocumento = (html) => new Promise((resolve) => {
    const ventana = window.open("", "_blank");
    if (!ventana) {
        resolve();
        return;
    }
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    let listo = false;
    const lanzar = () => {
        if (listo) {
            return;
        }
        listo = true;
        try {
            ventana.focus();
            ventana.print();
        } catch {
            /* el navegador puede bloquear la impresión automática */
        }
        resolve();
    };
    ventana.addEventListener("load", () => window.setTimeout(lanzar, 250));
    window.setTimeout(lanzar, 900);
});

const htmlOrden = async ({ orden, origen, destino, pago, formatearCLP, etiquetaComuna }) => {
    const logo = await logoPdf();
    const cargas = orden.detalle_carga || [];
    const momento = orden.fechaCreacion ? new Date(orden.fechaCreacion) : new Date();
    const recargos = Array.isArray(orden.recargo) ? orden.recargo : [];
    const totalRecargo = recargos.reduce((suma, item) => suma + Number(item.monto || 0), 0);
    const usuario = [...(orden.historial_ot || [])].at(-1)?.usuario;
    const creador = usuario
        ? [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.nombreUsuario
        : "";
    const barcode = barcodePng(orden.numeroOT, { alto: 70, anchoBarra: 2 });
    const alto = 210 + cargas.length * 8;
    const fila = (etiqueta, valor) => `<p><span>${escaparHtml(etiqueta)}</span><strong>${escaparHtml(valor || " ")}</strong></p>`;
    const filasCarga = (cargas.length ? cargas : [{ tipo_bulto: { nombreTipo: "Sin carga" } }]).map((carga, indice) => `
        <tr>
            <td>${escaparHtml(carga.tipo_bulto?.nombreTipo || "Bulto")}</td>
            <td>${escaparHtml(carga.cantidad ?? "—")}</td>
            <td>${escaparHtml(carga.pesoTotal ?? carga.pesoUnitario ?? "—")}</td>
            <td>${escaparHtml(carga.volumenM3 ?? "—")}</td>
            <td>${escaparHtml(indice === 0 ? formatearCLP(orden.valorCargaAplicado) : "—")}</td>
        </tr>
    `).join("");

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escaparHtml(orden.numeroOT)}</title>
<style>
  @page { size: 80mm ${alto}mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { width: 80mm; padding: 3mm; font-family: "Courier New", Courier, monospace; font-size: 9px; line-height: 1.25; }
  header { display: flex; justify-content: space-between; gap: 2mm; align-items: flex-start; }
  header img { width: 28mm; height: auto; }
  header div { text-align: right; font-size: 7px; }
  .codigo { width: 100%; height: 16mm; object-fit: contain; margin: 1mm 0; }
  p { display: flex; justify-content: space-between; gap: 2mm; margin: 0; border-bottom: 1px dotted #999; }
  p span { font-weight: 700; }
  p strong { font-weight: 400; text-align: right; }
  h2 { margin: 2mm 0 1mm; border-top: 1px solid #000; border-bottom: 1px solid #000; text-align: center; font-size: 9px; }
  table { width: 100%; border-collapse: collapse; font-size: 7px; margin: 1mm 0; }
  th, td { border: 1px solid #000; padding: 0.4mm; text-align: center; }
  .total { border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: 700; font-size: 11px; }
  .pie { display: block; text-align: center; border: 0; margin-top: 2mm; }
</style>
</head>
<body>
  <header>
    ${logo ? `<img src="${logo}" alt="Marexpress" />` : "<strong>MAREXPRESS</strong>"}
    <div>${empresa.lineas.map((linea) => `<div>${escaparHtml(linea)}</div>`).join("")}</div>
  </header>
  ${fila("N° DE TRANSPORTE", orden.numeroOT)}
  <img class="codigo" src="${barcode}" alt="" />
  ${fila("FECHA", momento.toLocaleDateString("es-CL"))}
  ${fila("HORA", momento.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))}
  ${fila("ORIGEN", etiquetaComuna(origen))}
  ${fila("DESTINO", etiquetaComuna(destino))}
  ${fila("TIPO ENTREGA", orden.direccionDestino ? "DOMICILIO" : "SUCURSAL")}
  <h2>DATOS REMITENTE</h2>
  ${fila("NOMBRE", orden.cliente?.razonSocial)}
  ${fila("RUT", orden.cliente?.rut)}
  ${fila("CIUDAD", etiquetaComuna(origen))}
  ${fila("FONO", orden.telefonoOrigen || orden.cliente?.telefono)}
  <h2>DATOS DESTINATARIO</h2>
  ${fila("NOMBRE", orden.destinatario?.nombreRazonSocial || orden.contactoDestino)}
  ${fila("RUT", orden.destinatario?.rut)}
  ${fila("CIUDAD ENTREGA", etiquetaComuna(destino))}
  ${fila("DIRECCIÓN", orden.direccionDestino)}
  ${fila("FONO", orden.telefonoDestino || orden.destinatario?.telefono)}
  <h2>CONTENIDO</h2>
  ${fila("OBSERVACIÓN", orden.referenciaEntrega || "SIN OBSERVACIONES")}
  ${fila("GUÍA", orden.numeroDocumento)}
  <table>
    <thead><tr><th>Encar</th><th>Cant</th><th>Peso</th><th>M3</th><th>Valor</th></tr></thead>
    <tbody>${filasCarga}</tbody>
  </table>
  ${fila("FORMA DE PAGO", [pago?.tipoPago, pago?.pagadoPor].filter(Boolean).join(" "))}
  ${fila("MÉTODO DE PAGO", pago?.metodoPago)}
  ${fila("ESTADO DE PAGO", pago?.estadoPago || "PENDIENTE")}
  ${fila("VENTA", formatearCLP(orden.valorCargaAplicado))}
  ${fila("RETIRO", formatearCLP(orden.valorRetiroAplicado))}
  ${fila("RECARGO", formatearCLP(totalRecargo))}
  ${fila("IVA 19%", formatearCLP(orden.valorIva))}
  <p class="total"><span>TOTAL A PAGAR</span><strong>${escaparHtml(formatearCLP(orden.valorTotal))}</strong></p>
  <h2>RECEPCIÓN CONFORME</h2>
  ${fila("FECHA", " ")}
  ${fila("HORA", " ")}
  ${fila("NOMBRE", " ")}
  ${fila("RUT", " ")}
  ${fila("OBSERVACIONES", " ")}
  <p class="pie">Creado por usuario${creador ? ` : ${escaparHtml(creador)}` : ""}</p>
</body>
</html>`;
};

const htmlEtiquetas = async ({ orden, bultos, origen, destino, medidas, etiquetaComuna }) => {
    const logo = await logoPdf();
    const piezas = bultos.map((bulto, indice) => {
        const codigo = bulto.codigoBulto || orden.numeroOT;
        const barcode = barcodePng(codigo, { alto: 64, anchoBarra: 1.6 });
        const campos = [
            ["Destino", orden.destinatario?.nombreRazonSocial || orden.contactoDestino || "—"],
            ["Origen", etiquetaComuna(origen) || "—"],
            ["Dirección", orden.direccionDestino || "—"],
            ["Tipo", bulto.tipo || "Bulto"],
            ["Peso", bulto.peso ? `${bulto.peso} kg` : "—"],
            ["Medidas", medidas(bulto)]
        ];
        return `<article>
          <header>
            ${logo ? `<img src="${logo}" alt="Marexpress" />` : "<strong>MAREXPRESS</strong>"}
            <div><small>${indice + 1} / ${bultos.length}</small><strong>${escaparHtml(orden.numeroOT)}</strong></div>
          </header>
          <img class="codigo" src="${barcode}" alt="" />
          <p class="numero">${escaparHtml(codigo)}</p>
          <p class="ciudad">${escaparHtml(etiquetaComuna(destino) || "Destino")}</p>
          <div class="datos">
            ${campos.map(([titulo, valor]) => `<p><span>${escaparHtml(titulo)}</span><strong>${escaparHtml(valor)}</strong></p>`).join("")}
          </div>
        </article>`;
    }).join("");

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Etiquetas ${escaparHtml(orden.numeroOT)}</title>
<style>
  @page { size: 100mm 70mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  article {
    width: 100mm;
    height: 70mm;
    padding: 3mm 4mm;
    overflow: hidden;
    page-break-after: always;
    font-family: Arial, Helvetica, sans-serif;
  }
  article:last-child { page-break-after: auto; }
  header { display: flex; justify-content: space-between; align-items: center; height: 12mm; }
  header img { height: 10mm; width: auto; }
  header div { text-align: right; }
  header small { display: block; font-size: 8px; }
  header strong { font-size: 13px; }
  .codigo { display: block; width: 92mm; height: 16mm; object-fit: contain; }
  .numero, .ciudad { margin: 0; text-align: center; }
  .numero { font-family: "Courier New", monospace; font-size: 11px; font-weight: 700; }
  .ciudad { font-size: 13px; font-weight: 800; }
  .datos { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 3mm; margin-top: 1mm; }
  .datos p { margin: 0; }
  .datos span { display: block; font-size: 7px; text-transform: uppercase; color: #444; }
  .datos strong { display: block; font-size: 10px; }
</style>
</head>
<body>${piezas}</body>
</html>`;
};

export const imprimirOrdenTermica = async (datos) => {
    await imprimirDocumento(await htmlOrden(datos));
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

    await imprimirDocumento(await htmlEtiquetas(datos));
    return "pdf";
};
