const COMUNAS_CHILOE = new Set([
    "ancud",
    "castro",
    "chonchi",
    "curaco de velez",
    "dalcahue",
    "puqueldon",
    "queilen",
    "quellon",
    "quemchi",
    "quinchao",
    "chiloe"
]);

export const RETIRO_OFICIAL = {
    PEQUENO: 30000,
    MEDIANO: 60000,
    GRANDE: 120000
};

export const NOMBRE_TARIFA_PM = "Santiago - Puerto Montt / Osorno";
export const NOMBRE_TARIFA_CHILOE = "Santiago - Chiloé";

const normalizar = (texto) =>
    String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

export const esComunaChiloe = (comuna) => {
    const nombre = normalizar(comuna?.nombreComuna);
    const region = normalizar(comuna?.region?.nombreRegion);
    if (COMUNAS_CHILOE.has(nombre) || nombre.includes("chiloe")) {
        return true;
    }
    return region.includes("chiloe");
};

export const esRegionMetropolitana = (comuna) => {
    const region = normalizar(comuna?.region?.nombreRegion);
    const nombre = normalizar(comuna?.nombreComuna);
    return region.includes("metropolitana") || nombre === "santiago";
};

export const esZonaPuertoMonttOsorno = (comuna) => {
    if (!comuna || esComunaChiloe(comuna)) {
        return false;
    }
    const region = normalizar(comuna?.region?.nombreRegion);
    const nombre = normalizar(comuna?.nombreComuna);
    return region.includes("los lagos")
        || region.includes("los rios")
        || nombre.includes("puerto montt")
        || nombre.includes("osorno")
        || nombre.includes("puerto varas");
};

export const zonaTarifaria = (origen, destino) => {
    const haySantiago = esRegionMetropolitana(origen) || esRegionMetropolitana(destino);
    const hayChiloe = esComunaChiloe(origen) || esComunaChiloe(destino);
    const hayPm = esZonaPuertoMonttOsorno(origen) || esZonaPuertoMonttOsorno(destino);
    if (haySantiago && hayChiloe) {
        return "CHILOE";
    }
    if (haySantiago && hayPm) {
        return "PUERTO_MONTT";
    }
    if (hayChiloe) {
        return "CHILOE";
    }
    if (hayPm) {
        return "PUERTO_MONTT";
    }
    return null;
};

export const cobroPorTramoPeso = (peso, tramos = []) => {
    const kg = Number(peso) || 0;
    if (kg <= 0 || !tramos.length) {
        return { precio: 0, tramo: null };
    }

    const ordenados = [...tramos].sort(
        (a, b) => Number(a.kgDesde) - Number(b.kgDesde)
    );
    const tramo = [...ordenados].reverse().find((item) => kg >= Number(item.kgDesde))
        || ordenados[0];

    if (tramo.valorFijo != null && Number(tramo.valorFijo) > 0) {
        return {
            precio: Number(Number(tramo.valorFijo).toFixed(2)),
            tramo
        };
    }

    const valorKg = Number(tramo.valorKg || 0);
    return {
        precio: Number((kg * valorKg).toFixed(2)),
        tramo
    };
};

export const valorRetiroOficial = (tipoRetiro, tarifa) => {
    const tipo = String(tipoRetiro || "PEQUENO").toUpperCase();
    if (tipo === "MEDIANO") {
        const valor = Number(tarifa?.valorRetiroMediano);
        return valor > 0 ? valor : RETIRO_OFICIAL.MEDIANO;
    }
    if (tipo === "GRANDE") {
        const valor = Number(tarifa?.valorRetiroGrande);
        return valor > 0 ? valor : RETIRO_OFICIAL.GRANDE;
    }
    if (tarifa?.valorRetiro != null && Number(tarifa.valorRetiro) > 0) {
        return Number(tarifa.valorRetiro);
    }
    return RETIRO_OFICIAL.PEQUENO;
};

export const resolverTarifaPorZona = async (db, zona) => {
    if (!zona) {
        return null;
    }
    const nombre = zona === "CHILOE" ? NOMBRE_TARIFA_CHILOE : NOMBRE_TARIFA_PM;
    return db.tarifa.findFirst({
        where: { nombreTarifa: nombre, estado: true },
        include: { tarifa_tramo: true, tipo_tarifa: true }
    });
};
