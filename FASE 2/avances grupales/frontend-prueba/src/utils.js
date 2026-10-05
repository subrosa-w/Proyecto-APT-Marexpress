export const formatearCLP = (valor) => {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(valor) || 0);
};

export const nombreCompleto = (usuario) => {
    if (!usuario) {
        return "";
    }

    return `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim()
        || usuario.nombreUsuario
        || "Usuario";
};

export const etiquetaComuna = (comuna) => {
    if (!comuna) {
        return "";
    }

    const region = comuna.region?.nombreRegion;
    return region ? `${comuna.nombreComuna} - ${region}` : comuna.nombreComuna;
};

export const aInputFechaLocal = (valor) => {
    if (!valor) {
        return "";
    }
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
        return "";
    }
    const pad = (numero) => String(numero).padStart(2, "0");
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
};

export const fechaHoyChile = () =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());

export const diaChile = (fecha) => {
    if (!fecha) {
        return "";
    }
    const texto = String(fecha).trim();
    const localChile = texto.match(/^(\d{4}-\d{2}-\d{2})/);
    if (localChile && !texto.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(texto)) {
        return localChile[1];
    }
    const fechaValor = new Date(fecha);
    if (Number.isNaN(fechaValor.getTime())) {
        return localChile?.[1] || "";
    }
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(fechaValor);
};

export const formatearFechaHora = (valor) => {
    if (!valor) {
        return "—";
    }
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
        return "—";
    }
    return new Intl.DateTimeFormat("es-CL", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(fecha);
};

export const aNumero = (valor) => {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
};

export const volumenPiezaM3 = (item) => {
    const largo = aNumero(item?.largoCm);
    const ancho = aNumero(item?.anchoCm);
    const alto = aNumero(item?.altoCm);
    if (largo <= 0 || ancho <= 0 || alto <= 0) {
        return 0;
    }
    return (largo * ancho * alto) / 1000000;
};

export const etiquetaMedidas = (item) => {
    const largo = aNumero(item?.largoCm);
    const ancho = aNumero(item?.anchoCm);
    const alto = aNumero(item?.altoCm);
    if (!largo && !ancho && !alto) {
        return "—";
    }
    return `${largo} × ${ancho} × ${alto} cm`;
};

export const etiquetaTipoCarga = (nombre) => {
    const texto = String(nombre || "").trim();
    if (!texto) {
        return "Bulto";
    }
    const upper = texto.toUpperCase();
    if (upper.includes("PALLET") || upper.includes("PALET") || upper.includes("PALÉ")) {
        return "Pallet";
    }
    if (upper.includes("SACO")) {
        return "Saco";
    }
    if (upper.includes("BULTO") || upper.includes("CAJA") || upper.includes("PAQUETE")) {
        return "Bulto";
    }
    return texto;
};

export const formatearKg = (valor) =>
    `${aNumero(valor).toLocaleString("es-CL", { maximumFractionDigits: 2 })} kg`;

export const formatearM3 = (valor) =>
    `${aNumero(valor).toLocaleString("es-CL", { minimumFractionDigits: 3, maximumFractionDigits: 4 })} m³`;

const pluralTipo = (tipo, cantidad) => {
    const mapa = {
        Bulto: ["bulto", "bultos"],
        Pallet: ["pallet", "pallets"],
        Saco: ["saco", "sacos"]
    };
    const par = mapa[tipo] || [String(tipo).toLowerCase(), `${String(tipo).toLowerCase()}s`];
    return `${cantidad} ${cantidad === 1 ? par[0] : par[1]}`;
};

export const resumirCarga = (piezas) => {
    const porTipo = {};
    let peso = 0;
    let volumen = 0;
    let cantidad = 0;

    for (const pieza of piezas || []) {
        const unidades = Math.max(1, aNumero(pieza.cantidad) || 1);
        const tipo = etiquetaTipoCarga(pieza.tipo);
        porTipo[tipo] = (porTipo[tipo] || 0) + unidades;
        peso += aNumero(pieza.peso);
        volumen += aNumero(pieza.volumen);
        cantidad += unidades;
    }

    return { porTipo, peso, volumen, cantidad };
};

export const textoResumenTipos = (porTipo) => {
    const claves = Object.keys(porTipo || {});
    if (!claves.length) {
        return "Sin carga";
    }
    const orden = ["Bulto", "Pallet", "Saco"];
    return [...orden.filter((clave) => porTipo[clave]), ...claves.filter((clave) => !orden.includes(clave))]
        .map((clave) => pluralTipo(clave, porTipo[clave]))
        .join(" · ");
};

export const esRechazoEntrega = (valor) => {
    const texto = String(valor || "").toUpperCase();
    return ["RECHAZ", "NO_ENTREG", "NO ENTREG", "FALLID", "DEVUEL", "REHUS"].some((clave) => texto.includes(clave));
};

export const motivoRechazoOrden = (orden) => {
    const entregas = [
        ...(orden?.entrega_ot || []),
        ...(orden?.manifiesto_ot || []).map((item) => item.entrega_ot).filter(Boolean)
    ];
    const rechazo = entregas.find((item) => esRechazoEntrega(item.resultadoEntrega));
    if (rechazo?.motivoResultado) {
        return rechazo.motivoResultado;
    }
    if (rechazo?.observacion) {
        return rechazo.observacion;
    }
    const nota = (orden?.observacion_ot || []).find((item) => esRechazoEntrega(item.observacion));
    if (nota?.observacion) {
        return nota.observacion;
    }
    return (orden?.observacion_ot || [])[0]?.observacion || "";
};

export const ordenAnulada = (orden) => {
    const estado = String(
        orden?.estado_ot?.nombreEstado || orden?.estadoOt || orden?.estado || ""
    ).toUpperCase();
    return estado === "ANULADA" || estado === "CANCELADA";
};

export const bandejaSeguimiento = (orden) => {
    const estado = String(orden?.estado_ot?.nombreEstado || "").toUpperCase();
    if (["ANULADA", "CANCELADA"].includes(estado)) {
        return "anulada";
    }

    if (["EN_BODEGA", "RECEPCIONADA", "EN_ORIGEN"].includes(estado)) {
        return "bodega";
    }

    const entregas = [
        ...(orden?.entrega_ot || []),
        ...(orden?.manifiesto_ot || []).map((item) => item.entrega_ot).filter(Boolean)
    ];
    const fueRechazada = esRechazoEntrega(estado)
        || entregas.some((item) => esRechazoEntrega(item.resultadoEntrega));
    if (fueRechazada) {
        return "rechazadas";
    }

    if (["ENTREGADA", "ENTREGADO"].includes(estado)) {
        return "entregadas";
    }
    const manifiestos = orden?.manifiesto_ot || [];
    const enRuta = manifiestos.some((item) => {
        const manifiesto = item.manifiesto?.estado || "";
        return ["EN_RUTA", "EN_TRANSITO"].includes(String(manifiesto).toUpperCase());
    });
    if (enRuta || ["EN_TRANSITO", "EN_RUTA", "DESPACHADA"].includes(estado)) {
        return "enCurso";
    }
    return "bodega";
};

export const resumirDetallesCarga = (detalles) =>
    resumirCarga((detalles || []).map((detalle) => {
        const cantidad = aNumero(detalle.cantidad) || 1;
        return {
            tipo: detalle.tipo_bulto?.nombreTipo,
            cantidad,
            peso: aNumero(detalle.pesoTotal) || aNumero(detalle.pesoUnitario) * cantidad,
            volumen: aNumero(detalle.volumenM3) || volumenPiezaM3(detalle) * cantidad
        };
    }));

export const lineaTiempoOt = (orden) => {
    const usuarioDe = (item) =>
        `${item.usuario?.nombre ?? ""} ${item.usuario?.apellido ?? ""}`.trim()
        || item.usuario?.nombreUsuario
        || "—";

    const eventos = (orden?.seguimiento_ot || []).length
        ? orden.seguimiento_ot
        : (orden?.historial_ot || []);

    return (eventos || []).map((item) => ({
        id: item.idSeguimiento || item.idHistorial,
        fechaHora: item.fechaHora,
        descripcion: item.descripcion || "—",
        ubicacion: item.ubicacion || "",
        estado: item.estado_ot?.nombreEstado || "—",
        usuario: usuarioDe(item)
    }));
};
