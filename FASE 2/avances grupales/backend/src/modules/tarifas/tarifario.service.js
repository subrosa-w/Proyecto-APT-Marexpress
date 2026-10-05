import prisma from "../../config/prisma.js";

const incluirTarifa = {
    tipo_tarifa: true,
    tarifa_tramo: {
        orderBy: { kgDesde: "asc" }
    }
};

const numero = (valor, fallback = 0) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : fallback;
};

const texto = (valor) => {
    if (valor == null) {
        return "";
    }
    if (typeof valor === "object") {
        return JSON.stringify(valor);
    }
    return String(valor);
};

export const normalizarTramos = (lista) => {
    if (!Array.isArray(lista)) {
        return [];
    }
    return lista
        .map((item) => ({
            kgDesde: numero(item.kgDesde),
            kgHasta: numero(item.kgHasta),
            valorFijo: item.valorFijo === "" || item.valorFijo == null ? null : numero(item.valorFijo),
            valorKg: item.valorKg === "" || item.valorKg == null ? null : numero(item.valorKg)
        }))
        .filter((item) => item.kgHasta > 0)
        .sort((a, b) => a.kgDesde - b.kgDesde);
};

const snapshot = (tarifa) => ({
    nombreTarifa: tarifa.nombreTarifa,
    valorBase: numero(tarifa.valorBase),
    valorKg: numero(tarifa.valorKg),
    valorM3: numero(tarifa.valorM3),
    valorRetiro: numero(tarifa.valorRetiro),
    valorRetiroMediano: numero(tarifa.valorRetiroMediano),
    valorRetiroGrande: numero(tarifa.valorRetiroGrande),
    valorZonaUrbana: numero(tarifa.valorZonaUrbana),
    valorZonaLejana: numero(tarifa.valorZonaLejana),
    estado: Boolean(tarifa.estado),
    tramos: (tarifa.tarifa_tramo || []).map((item) => ({
        kgDesde: numero(item.kgDesde),
        kgHasta: numero(item.kgHasta),
        valorFijo: item.valorFijo == null ? null : numero(item.valorFijo),
        valorKg: item.valorKg == null ? null : numero(item.valorKg)
    }))
});

const variacion = (antes, despues) => {
    const a = Number(antes);
    const b = Number(despues);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) {
        return null;
    }
    return Number((((b - a) / a) * 100).toFixed(2));
};

const registrarCambio = async (tx, { idTarifa, idUsuario, tipoCambio, campo, valorAnterior, valorNuevo }) => {
    await tx.historial_tarifa.create({
        data: {
            idTarifa,
            idUsuario: idUsuario || null,
            tipoCambio,
            campo: campo || null,
            valorAnterior: texto(valorAnterior) || null,
            valorNuevo: texto(valorNuevo) || null,
            variacionPct: variacion(valorAnterior, valorNuevo)
        }
    });
};

const asegurarTipoTarifa = async (idTipoTarifa) => {
    let id = Number(idTipoTarifa);
    if (Number.isInteger(id) && id > 0) {
        return id;
    }
    let tipo = await prisma.tipo_tarifa.findFirst({ orderBy: { idTipoTarifa: "asc" } });
    if (!tipo) {
        tipo = await prisma.tipo_tarifa.create({
            data: { nombreTipoTarifa: "GENERAL", descripcion: "Tarifario general" }
        });
    }
    return tipo.idTipoTarifa;
};

const datosCabecera = (datos, idTipoTarifa) => ({
    nombreTarifa: String(datos.nombreTarifa || "").trim(),
    valorBase: numero(datos.valorBase),
    valorKg: numero(datos.valorKg),
    valorM3: numero(datos.valorM3),
    valorRetiro: numero(datos.valorRetiro),
    valorRetiroMediano: numero(datos.valorRetiroMediano),
    valorRetiroGrande: numero(datos.valorRetiroGrande),
    valorZonaUrbana: numero(datos.valorZonaUrbana),
    valorZonaLejana: numero(datos.valorZonaLejana),
    idTipoTarifa
});

export const obtenerTarifas = async () => {
    return prisma.tarifa.findMany({
        include: incluirTarifa,
        orderBy: { nombreTarifa: "asc" }
    });
};

export const obtenerTarifaPorId = async (idTarifa) => {
    const tarifa = await prisma.tarifa.findUnique({
        where: { idTarifa: Number(idTarifa) },
        include: incluirTarifa
    });
    if (!tarifa) {
        throw new Error("El tarifario no existe");
    }
    return tarifa;
};

export const obtenerHistorialTarifa = async (idTarifa) => {
    await obtenerTarifaPorId(idTarifa);
    return prisma.historial_tarifa.findMany({
        where: { idTarifa: Number(idTarifa) },
        include: {
            usuario: {
                select: {
                    idUsuario: true,
                    nombre: true,
                    apellido: true,
                    nombreUsuario: true
                }
            }
        },
        orderBy: { fechaCambio: "desc" }
    });
};

export const crearTarifa = async (datos, idUsuario) => {
    const nombreTarifa = String(datos.nombreTarifa || "").trim();
    if (!nombreTarifa) {
        throw new Error("El nombre del tarifario es obligatorio");
    }
    const idTipoTarifa = await asegurarTipoTarifa(datos.idTipoTarifa);
    const tramos = normalizarTramos(datos.tramos);

    return prisma.$transaction(async (tx) => {
        const tarifa = await tx.tarifa.create({
            data: {
                ...datosCabecera({ ...datos, nombreTarifa }, idTipoTarifa),
                estado: true,
                tarifa_tramo: tramos.length
                    ? { create: tramos }
                    : undefined
            },
            include: incluirTarifa
        });
        await registrarCambio(tx, {
            idTarifa: tarifa.idTarifa,
            idUsuario,
            tipoCambio: "CREACION",
            campo: "tarifario",
            valorAnterior: "",
            valorNuevo: snapshot(tarifa)
        });
        return tarifa;
    });
};

export const actualizarTarifa = async (idTarifa, datos, idUsuario) => {
    const actual = await obtenerTarifaPorId(idTarifa);
    const nombreTarifa = String(datos.nombreTarifa || "").trim();
    if (!nombreTarifa) {
        throw new Error("El nombre del tarifario es obligatorio");
    }
    const tramos = normalizarTramos(datos.tramos);
    const antes = snapshot(actual);

    return prisma.$transaction(async (tx) => {
        await tx.tarifa_tramo.deleteMany({ where: { idTarifa: actual.idTarifa } });
        const tarifa = await tx.tarifa.update({
            where: { idTarifa: actual.idTarifa },
            data: {
                ...datosCabecera({ ...datos, nombreTarifa }, actual.idTipoTarifa),
                tarifa_tramo: tramos.length ? { create: tramos } : undefined
            },
            include: incluirTarifa
        });
        const despues = snapshot(tarifa);
        const campos = [
            "nombreTarifa",
            "valorBase",
            "valorKg",
            "valorM3",
            "valorRetiro",
            "valorRetiroMediano",
            "valorRetiroGrande",
            "valorZonaUrbana",
            "valorZonaLejana"
        ];
        for (const campo of campos) {
            if (String(antes[campo]) !== String(despues[campo])) {
                await registrarCambio(tx, {
                    idTarifa: tarifa.idTarifa,
                    idUsuario,
                    tipoCambio: "ACTUALIZACION",
                    campo,
                    valorAnterior: antes[campo],
                    valorNuevo: despues[campo]
                });
            }
        }
        if (JSON.stringify(antes.tramos) !== JSON.stringify(despues.tramos)) {
            await registrarCambio(tx, {
                idTarifa: tarifa.idTarifa,
                idUsuario,
                tipoCambio: "TRAMOS",
                campo: "tramos",
                valorAnterior: antes.tramos,
                valorNuevo: despues.tramos
            });
        }
        return tarifa;
    });
};

export const cambiarEstadoTarifa = async (idTarifa, estado, idUsuario) => {
    const actual = await obtenerTarifaPorId(idTarifa);
    const activo = estado === true || estado === "true" || estado === 1 || estado === "1";
    const tarifa = await prisma.$transaction(async (tx) => {
        const actualizado = await tx.tarifa.update({
            where: { idTarifa: actual.idTarifa },
            data: { estado: activo },
            include: incluirTarifa
        });
        await registrarCambio(tx, {
            idTarifa: actual.idTarifa,
            idUsuario,
            tipoCambio: "ESTADO",
            campo: "estado",
            valorAnterior: actual.estado ? "Activa" : "Inactiva",
            valorNuevo: activo ? "Activa" : "Inactiva"
        });
        return actualizado;
    });
    return tarifa;
};
