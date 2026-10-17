/*
  Arma un archivo .xlsx de la planilla de cuenta corriente.
  El libro se guarda sin comprimir, que es un Excel válido, para no depender de otra librería.
*/

const encoder = new TextEncoder();

const tablaCrc = new Uint32Array(256);
for (let indice = 0; indice < 256; indice += 1) {
    let valor = indice;
    for (let bit = 0; bit < 8; bit += 1) {
        valor = (valor & 1) ? (0xedb88320 ^ (valor >>> 1)) : (valor >>> 1);
    }
    tablaCrc[indice] = valor >>> 0;
}

const crc32 = (bytes) => {
    let valor = 0xffffffff;
    for (let indice = 0; indice < bytes.length; indice += 1) {
        valor = tablaCrc[(valor ^ bytes[indice]) & 0xff] ^ (valor >>> 8);
    }
    return (valor ^ 0xffffffff) >>> 0;
};

const unir = (partes) => {
    const total = partes.reduce((suma, parte) => suma + parte.length, 0);
    const salida = new Uint8Array(total);
    let cursor = 0;
    partes.forEach((parte) => {
        salida.set(parte, cursor);
        cursor += parte.length;
    });
    return salida;
};

const u16 = (valor) => {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, valor, true);
    return bytes;
};

const u32 = (valor) => {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, valor, true);
    return bytes;
};

const zip = (archivos) => {
    const ahora = new Date();
    const hora = (ahora.getHours() << 11) | (ahora.getMinutes() << 5) | (ahora.getSeconds() >> 1);
    const fecha = ((ahora.getFullYear() - 1980) << 9) | ((ahora.getMonth() + 1) << 5) | ahora.getDate();
    const locales = [];
    const centrales = [];
    let desplazamiento = 0;

    archivos.forEach((archivo) => {
        const nombre = encoder.encode(archivo.nombre);
        const datos = encoder.encode(archivo.contenido);
        const suma = crc32(datos);
        const local = unir([
            u32(0x04034b50),
            u16(20),
            u16(0),
            u16(0),
            u16(hora),
            u16(fecha),
            u32(suma),
            u32(datos.length),
            u32(datos.length),
            u16(nombre.length),
            u16(0),
            nombre,
            datos
        ]);
        const central = unir([
            u32(0x02014b50),
            u16(20),
            u16(20),
            u16(0),
            u16(0),
            u16(hora),
            u16(fecha),
            u32(suma),
            u32(datos.length),
            u32(datos.length),
            u16(nombre.length),
            u16(0),
            u16(0),
            u16(0),
            u16(0),
            u32(0),
            u32(desplazamiento),
            nombre
        ]);
        locales.push(local);
        centrales.push(central);
        desplazamiento += local.length;
    });

    const directorio = unir(centrales);
    const cierre = unir([
        u32(0x06054b50),
        u16(0),
        u16(0),
        u16(archivos.length),
        u16(archivos.length),
        u32(directorio.length),
        u32(desplazamiento),
        u16(0)
    ]);
    return unir([...locales, directorio, cierre]);
};

const xml = (valor) => String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const columna = (numero) => {
    let resto = numero;
    let texto = "";
    while (resto > 0) {
        const letra = (resto - 1) % 26;
        texto = String.fromCharCode(65 + letra) + texto;
        resto = Math.floor((resto - 1) / 26);
    }
    return texto;
};

const celdaTexto = (fila, indice, valor, estilo = 0) => {
    const ref = `${columna(indice)}${fila}`;
    return `<c r="${ref}" t="inlineStr" s="${estilo}"><is><t>${xml(valor)}</t></is></c>`;
};

const celdaNumero = (fila, indice, valor, estilo) => {
    const ref = `${columna(indice)}${fila}`;
    return `<c r="${ref}" s="${estilo}"><v>${Number(valor) || 0}</v></c>`;
};

const encabezados = [
    "Cliente",
    "OT",
    "Fecha",
    "Estado",
    "Método",
    "Valor flete",
    "Valor retiro",
    "Valor recargo",
    "Valor neto",
    "Valor IVA",
    "Valor total"
];

const fechaPlanilla = (valor) => {
    if (!valor) {
        return "";
    }
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
        return "";
    }
    return new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(fecha);
};

const hoja = (planilla) => {
    const filas = planilla?.filas || [];
    const lineas = [
        `<row r="1">${encabezados.map((titulo, indice) => celdaTexto(1, indice + 1, titulo, 1)).join("")}</row>`
    ];
    filas.forEach((fila, indice) => {
        const numero = indice + 2;
        const textos = [fila.cliente, fila.numeroOT, fechaPlanilla(fila.fecha), fila.estado, fila.metodo];
        const montos = [fila.flete, fila.retiro, fila.recargo, fila.neto, fila.iva, fila.total];
        const celdas = [
            ...textos.map((valor, columnaTexto) => celdaTexto(numero, columnaTexto + 1, valor)),
            ...montos.map((valor, columnaMonto) => celdaNumero(numero, columnaMonto + 6, valor, 2))
        ];
        lineas.push(`<row r="${numero}">${celdas.join("")}</row>`);
    });
    const totales = planilla?.totales || {};
    const filaTotal = filas.length + 2;
    const celdasTotal = [
        celdaTexto(filaTotal, 1, "Total del mes", 1),
        ...["flete", "retiro", "recargo", "neto", "iva", "total"].map((campo, indice) => celdaNumero(filaTotal, indice + 6, totales[campo], 3))
    ];
    lineas.push(`<row r="${filaTotal}">${celdasTotal.join("")}</row>`);
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="32" customWidth="1"/>
    <col min="2" max="5" width="18" customWidth="1"/>
    <col min="6" max="11" width="16" customWidth="1"/>
  </cols>
  <sheetData>${lineas.join("")}</sheetData>
</worksheet>`;
};

const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
  </cellXfs>
</styleSheet>`;

export const libroPlanillaExcel = (planilla) => {
    const mes = planilla?.mes || "mes";
    return zip([
        {
            nombre: "[Content_Types].xml",
            contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
        },
        {
            nombre: "_rels/.rels",
            contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
        },
        {
            nombre: "xl/workbook.xml",
            contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Cuenta corriente ${xml(mes)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
        },
        {
            nombre: "xl/_rels/workbook.xml.rels",
            contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
        },
        { nombre: "xl/styles.xml", contenido: estilos },
        { nombre: "xl/worksheets/sheet1.xml", contenido: hoja(planilla) }
    ]);
};

export const descargarPlanillaExcel = (planilla) => {
    const mes = planilla?.mes || "mes";
    const blob = new Blob([libroPlanillaExcel(planilla)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `planilla-cuenta-corriente-${mes}.xlsx`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
};
