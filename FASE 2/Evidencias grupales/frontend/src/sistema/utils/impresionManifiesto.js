import { jsPDF } from "jspdf";

const dinero = (valor) => Number(valor || 0).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const medida = (valor, decimales) => Number(valor || 0).toLocaleString("es-CL", { maximumFractionDigits: decimales, minimumFractionDigits: 0 });

const nombreMedio = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSBANK: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
    CHEQUE: "Cheque"
};

const textoPago = (pago) => {
    if (!pago) {
        return "Sin pago";
    }
    const tipo = String(pago.tipoPago || "").toUpperCase();
    const estado = String(pago.estadoPago || "").toUpperCase();
    const medio = nombreMedio[String(pago.metodoPago || "").toUpperCase()] || "";
    if (tipo === "CUENTA_CORRIENTE") {
        return "Cuenta corriente";
    }
    if (estado === "PAGADO") {
        return medio ? `${medio} pagado` : "Pagada";
    }
    if (estado === "POR_CUADRAR") {
        return medio ? `${medio} por cuadrar` : "Por cuadrar";
    }
    return "Por pagar";
};

const filasDe = (manifiesto) => (manifiesto?.manifiesto_ot || []).map((item) => {
    const orden = item.orden_transporte || {};
    const pago = orden.pago?.[0];
    return {
        numero: orden.numeroOT || "—",
        destino: orden.destinatario?.nombreRazonSocial || orden.contactoDestino || "—",
        telefono: orden.telefonoDestino || orden.destinatario?.telefono || "—",
        direccion: `${orden.direccionDestino || "—"}, ${orden.comuna_orden_transporte_idComunaDestinoTocomuna?.nombreComuna || "—"}`,
        bultos: (item.manifiesto_carga || []).reduce((suma, carga) => suma + (carga.manifiesto_bulto || []).length, 0),
        kilos: Number(orden.pesoTotal) || 0,
        volumen: Number(orden.volumenTotalM3) || 0,
        total: Number(orden.valorTotal) || 0,
        pago: textoPago(pago),
        grupo: textoPago(pago)
    };
});

const totalesPorMedio = (filas) => {
    const grupos = new Map();
    filas.forEach((fila) => {
        grupos.set(fila.grupo, (grupos.get(fila.grupo) || 0) + fila.total);
    });
    return [...grupos.entries()];
};

export const imprimirManifiesto = (manifiesto, opciones = {}) => {
    if (!manifiesto?.numeroManifiesto) {
        return;
    }
    const filas = filasDe(manifiesto);
    const traspaso = manifiesto.tipo === "TRASPASO";
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const patente = manifiesto.vehiculo?.patente || "—";
    const conductor = manifiesto.conductor
        ? `${manifiesto.conductor.nombre || ""} ${manifiesto.conductor.apellido || ""}`.trim()
        : "—";
    const peonetas = (manifiesto.manifiesto_usuario || [])
        .map((item) => `${item.usuario?.nombre || ""} ${item.usuario?.apellido || ""}`.trim())
        .filter(Boolean)
        .join(", ") || "—";
    const columnas = traspaso
        ? [
            { titulo: "OT", ancho: 28, valor: (fila) => fila.numero },
            { titulo: "Destino", ancho: 48, valor: (fila) => fila.destino },
            { titulo: "Telefono", ancho: 32, valor: (fila) => fila.telefono },
            { titulo: "Direccion", ancho: 78, valor: (fila) => fila.direccion },
            { titulo: "Bultos", ancho: 18, valor: (fila) => String(fila.bultos) },
            { titulo: "Kg", ancho: 22, valor: (fila) => medida(fila.kilos, 1) },
            { titulo: "m3", ancho: 22, valor: (fila) => medida(fila.volumen, 2) },
            { titulo: "Valor", ancho: 28, valor: (fila) => dinero(fila.total) }
        ]
        : [
            { titulo: "OT", ancho: 26, valor: (fila) => fila.numero },
            { titulo: "Destino", ancho: 40, valor: (fila) => fila.destino },
            { titulo: "Telefono", ancho: 28, valor: (fila) => fila.telefono },
            { titulo: "Direccion", ancho: 62, valor: (fila) => fila.direccion },
            { titulo: "Bultos", ancho: 16, valor: (fila) => String(fila.bultos) },
            { titulo: "Kg", ancho: 18, valor: (fila) => medida(fila.kilos, 1) },
            { titulo: "m3", ancho: 18, valor: (fila) => medida(fila.volumen, 2) },
            { titulo: "Valor", ancho: 26, valor: (fila) => dinero(fila.total) },
            { titulo: "Pago", ancho: 36, valor: (fila) => fila.pago }
        ];

    const dibujarEncabezado = () => {
        doc.setFontSize(16);
        doc.text("MAREXPRESS", 12, 14);
        doc.setFontSize(11);
        doc.text(`${manifiesto.numeroManifiesto} · ${traspaso ? "Traspaso" : "Reparto"} · ${manifiesto.comuna?.nombreComuna || "Sin ciudad"}`, 12, 21);
        doc.setFontSize(9);
        doc.text(`Camion ${patente} · Conductor ${conductor} · Peoneta ${peonetas}`, 12, 27);
        if (opciones.cuadre) {
            doc.text("Cuadre del regreso", 12, 32);
        }
    };

    let y = opciones.cuadre ? 40 : 34;
    const dibujarTitulos = () => {
        doc.setFontSize(8);
        let x = 12;
        columnas.forEach((columna) => {
            doc.text(columna.titulo, x, y);
            x += columna.ancho;
        });
        y += 2;
        doc.line(12, y, 285, y);
        y += 5;
    };

    dibujarEncabezado();
    dibujarTitulos();
    doc.setFontSize(8);
    if (!filas.length) {
        doc.text("Este manifiesto no tiene ordenes.", 12, y);
    }
    filas.forEach((fila) => {
        const celdas = columnas.map((columna) => doc.splitTextToSize(String(columna.valor(fila)), columna.ancho - 2));
        const alto = Math.max(...celdas.map((lineas) => lineas.length)) * 4;
        if (y + alto > 190) {
            doc.addPage();
            y = 16;
            dibujarTitulos();
        }
        let x = 12;
        celdas.forEach((lineas, indice) => {
            doc.text(lineas, x, y);
            x += columnas[indice].ancho;
        });
        y += alto + 2;
    });

    const totales = filas.reduce((suma, fila) => ({
        bultos: suma.bultos + fila.bultos,
        kilos: suma.kilos + fila.kilos,
        volumen: suma.volumen + fila.volumen,
        total: suma.total + fila.total
    }), { bultos: 0, kilos: 0, volumen: 0, total: 0 });
    if (y > 180) {
        doc.addPage();
        y = 16;
    }
    y += 4;
    doc.setFontSize(9);
    doc.text(`Totales: ${totales.bultos} bultos · ${medida(totales.kilos, 1)} kg · ${medida(totales.volumen, 2)} m3 · ${dinero(totales.total)}`, 12, y);
    if (!traspaso && opciones.cuadre) {
        y += 6;
        const medios = totalesPorMedio(filas).map(([grupo, monto]) => `${grupo}: ${dinero(monto)}`).join(" · ");
        doc.text(`Por medio: ${medios || "Sin pagos"}`, 12, y);
    }
    if (traspaso) {
        y += 6;
        doc.text("Este manifiesto mueve carga entre bodegas y no cuadra pagos.", 12, y);
    }
    doc.save(opciones.cuadre ? `${manifiesto.numeroManifiesto}-cuadrado.pdf` : `${manifiesto.numeroManifiesto}.pdf`);
};
