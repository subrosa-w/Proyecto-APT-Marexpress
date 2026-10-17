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

const diaChile = (fecha = new Date()) =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(fecha);

const dinero = (valor) => {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
};

const rangoFrecuentes = (periodo, fecha) => {
    const dia = /^\d{4}-\d{2}-\d{2}$/.test(String(fecha || "")) ? fecha : diaChile();
    if (periodo === "dia") {
        const desde = new Date(`${dia}T00:00:00`);
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 1);
        return { desde, hasta, etiqueta: "hoy" };
    }
    if (periodo === "semana") {
        const desde = new Date(`${dia}T00:00:00`);
        const diaSemana = desde.getDay();
        desde.setDate(desde.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 7);
        return { desde, hasta, etiqueta: "esta semana" };
    }
    if (periodo === "anio") {
        const anio = dia.slice(0, 4);
        return {
            desde: new Date(`${anio}-01-01T00:00:00`),
            hasta: new Date(`${Number(anio) + 1}-01-01T00:00:00`),
            etiqueta: `el año ${anio}`
        };
    }
    const mes = dia.slice(0, 7);
    const desde = new Date(`${mes}-01T00:00:00`);
    const hasta = new Date(desde);
    hasta.setMonth(hasta.getMonth() + 1);
    return { desde, hasta, etiqueta: "este mes" };
};

const umbralFrecuente = { dia: 2, semana: 2, mes: 2, anio: 8 };

export const obtenerResumenCuentas = async ({ periodo = "mes", fecha } = {}) => {
    const modo = umbralFrecuente[periodo] ? periodo : "mes";
    const { desde, hasta, etiqueta } = rangoFrecuentes(modo, fecha);
    const cerradas = { nombreEstado: { in: ["ANULADA", "CANCELADA"] } };
    const cuentas = await prisma.cuenta_corriente.findMany({
        include: {
            cliente: {
                select: {
                    idCliente: true,
                    razonSocial: true,
                    rut: true,
                    estado: true,
                    _count: {
                        select: {
                            orden_transporte: {
                                where: {
                                    fechaCreacion: { gte: desde, lt: hasta },
                                    NOT: { estado_ot: cerradas }
                                }
                            }
                        }
                    },
                    orden_transporte: {
                        where: { NOT: { estado_ot: cerradas } },
                        orderBy: { fechaCreacion: "desc" },
                        take: 1,
                        select: { fechaCreacion: true }
                    }
                }
            }
        }
    });
    const haceNoventa = new Date();
    haceNoventa.setDate(haceNoventa.getDate() - 90);
    const minimo = umbralFrecuente[modo];
    const filas = cuentas.map((cuenta) => {
        const cliente = cuenta.cliente || {};
        const saldo = dinero(cuenta.saldoActual);
        const limite = dinero(cuenta.limiteCredito);
        const ultima = cliente.orden_transporte?.[0]?.fechaCreacion || null;
        const motivos = [];
        if (cuenta.estado) {
            if (!ultima || new Date(ultima) < haceNoventa) {
                motivos.push(ultima ? "Sin órdenes en 90 días" : "Nunca ha encargado");
            }
            if (limite > 0 && saldo > limite) {
                motivos.push("Deuda sobre el límite");
            }
            if (cliente.estado === false) {
                motivos.push("Cliente inactivo");
            }
        }
        return {
            idCliente: cliente.idCliente,
            cliente: cliente.razonSocial || "Sin nombre",
            rut: cliente.rut || "—",
            saldo,
            limite,
            ordenes: cliente._count?.orden_transporte || 0,
            ultimaOrden: ultima,
            activa: Boolean(cuenta.estado),
            motivos
        };
    });
    const porNombre = (a, b) => a.cliente.localeCompare(b.cliente, "es");
    return {
        periodo: modo,
        etiqueta,
        umbralFrecuente: minimo,
        deuda: filas.filter((item) => item.saldo > 0).sort((a, b) => b.saldo - a.saldo),
        alDia: filas.filter((item) => item.activa && item.saldo <= 0).sort(porNombre),
        frecuentes: filas.filter((item) => item.ordenes >= minimo).sort((a, b) => b.ordenes - a.ordenes),
        posiblesBaja: filas.filter((item) => item.motivos.length > 0).sort(porNombre)
    };
};