import prisma from "../../config/prisma.js";
import { fechaHoyChile } from "../../common/utils/fechaChile.js";

const incluirCliente = {
    comuna: {
        include: {
            region: true
        }
    },
    cuenta_corriente: true,
    tarifa: {
        include: {
            tipo_tarifa: true,
            tarifa_tramo: true
        }
    }
};

const nombreTarifaNormalizado = (nombre) =>
    String(nombre || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

export const obtenerTarifaPorDefecto = async (db = prisma) => {
    const tarifas = await db.tarifa.findMany({
        where: { estado: true },
        include: { tarifa_tramo: true },
        orderBy: { idTarifa: "asc" }
    });

    const porNombre = (predicado) => tarifas.find((item) => predicado(nombreTarifaNormalizado(item.nombreTarifa)));

    return porNombre((nombre) => nombre.includes("puerto montt") || nombre.includes("osorno"))
        || porNombre((nombre) => nombre.includes("tarifa kv") || nombre === "kv" || /\bkv\b/.test(nombre) || nombre.includes("k/v"))
        || porNombre((nombre) => nombre.includes("normal"))
        || tarifas[0]
        || null;
};

const idTarifaODefecto = async (idTarifa, db = prisma) => {
    const indicado = Number(idTarifa);
    if (Number.isInteger(indicado) && indicado > 0) {
        return indicado;
    }

    const tarifa = await obtenerTarifaPorDefecto(db);
    if (!tarifa) {
        throw new Error("No hay un tarifario KV / normal configurado");
    }

    return tarifa.idTarifa;
};

export const asegurarTarifaCliente = async (idCliente, db = prisma) => {
    const cliente = await db.cliente.findUnique({
        where: { idCliente: Number(idCliente) },
        include: incluirCliente
    });

    if (!cliente) {
        throw new Error("El cliente indicado no existe");
    }

    if (cliente.tarifa?.estado) {
        return cliente;
    }

    const tarifa = await obtenerTarifaPorDefecto(db);
    if (!tarifa) {
        throw new Error("No hay un tarifario KV / normal configurado");
    }

    return db.cliente.update({
        where: { idCliente: cliente.idCliente },
        data: { idTarifa: tarifa.idTarifa },
        include: incluirCliente
    });
};

const crearCuentaSiCorresponde = async (tx, idCliente, datosCliente) => {
    if (!datosCliente.crearCuentaCorriente) {
        return;
    }

    const existente = await tx.cuenta_corriente.findUnique({
        where: { idCliente }
    });

    if (existente) {
        return existente;
    }

    return tx.cuenta_corriente.create({
        data: {
            idCliente,
            fechaApertura: fechaHoyChile(),
            limiteCredito: datosCliente.limiteCredito ?? 0,
            saldoActual: 0,
            estado: true
        }
    });
};

export const asegurarClienteConCuenta = async (tx, datosCliente) => {
    let cliente = await tx.cliente.findUnique({
        where: { rut: datosCliente.rut }
    });

    if (!cliente) {
        cliente = await tx.cliente.create({
            data: {
                rut: datosCliente.rut,
                razonSocial: datosCliente.razonSocial,
                nombreFantasia: datosCliente.nombreFantasia || null,
                giro: datosCliente.giro || null,
                direccion: datosCliente.direccion,
                telefono: datosCliente.telefono || null,
                correo: datosCliente.correo || null,
                idComuna: Number(datosCliente.idComuna),
                idTarifa: await idTarifaODefecto(datosCliente.idTarifa, tx),
                estado: true
            }
        });
    }

        await crearCuentaSiCorresponde(tx, cliente.idCliente, datosCliente);

        if (!cliente.idTarifa) {
            cliente = await tx.cliente.update({
                where: { idCliente: cliente.idCliente },
                data: { idTarifa: await idTarifaODefecto(datosCliente.idTarifa, tx) }
            });
        }

        return cliente;
};

export const obtenerClientes = async () => {
    const tarifaDefecto = await obtenerTarifaPorDefecto();
    if (tarifaDefecto) {
        await prisma.cliente.updateMany({
            where: { idTarifa: null },
            data: { idTarifa: tarifaDefecto.idTarifa }
        });
    }

    return prisma.cliente.findMany({
        include: incluirCliente
    });
};

export const buscarClientes = async (termino) => {
    return await prisma.cliente.findMany({
        where: {
            OR: [
                { rut: { contains: termino } },
                { razonSocial: { contains: termino } },
                { nombreFantasia: { contains: termino } }
            ]
        },
        include: incluirCliente
    });
};

export const crearCliente = async (datosCliente) => {
    return prisma.$transaction(async (tx) => {
        const cliente = await tx.cliente.create({
            data: {
                rut: datosCliente.rut,
                razonSocial: datosCliente.razonSocial,
                nombreFantasia: datosCliente.nombreFantasia || null,
                giro: datosCliente.giro || null,
                direccion: datosCliente.direccion,
                telefono: datosCliente.telefono || null,
                correo: datosCliente.correo || null,
                idComuna: Number(datosCliente.idComuna),
                idTarifa: await idTarifaODefecto(datosCliente.idTarifa, tx),
                estado: true
            }
        });

        await crearCuentaSiCorresponde(tx, cliente.idCliente, datosCliente);

        return tx.cliente.findUnique({
            where: { idCliente: cliente.idCliente },
            include: incluirCliente
        });
    });
};

export const obtenerClientePorRut = async (rut) => {
    return await prisma.cliente.findUnique({
        where: {
            rut: rut
        }
    });
};

export const asignarTarifaCliente = async (idCliente, idTarifa) => {
    const tarifa = await prisma.tarifa.findUnique({
        where: { idTarifa: Number(idTarifa) }
    });

    if (!tarifa || !tarifa.estado) {
        throw new Error("El tarifario indicado no existe o está inactivo");
    }

    return prisma.cliente.update({
        where: { idCliente: Number(idCliente) },
        data: { idTarifa: Number(idTarifa) },
        include: incluirCliente
    });
};

export const obtenerCuentaCorrientePorCliente = async (idCliente) => {
    return await prisma.cuenta_corriente.findUnique({
        where: {
            idCliente: Number(idCliente)
        }
    });
};