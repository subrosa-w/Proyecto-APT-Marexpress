import prisma from "../../config/prisma.js";

export const obtenerTarifasTrayecto = async () => {
    return await prisma.tarifa_trayecto.findMany({
        include: {
            comuna_tarifa_trayecto_idComunaOrigenTocomuna: {
                select: {
                    idComuna: true,
                    nombreComuna: true
                }
            },
            comuna_tarifa_trayecto_idComunaDestinoTocomuna: {
                select: {
                    idComuna: true,
                    nombreComuna: true
                }
            },
            tarifa: {
                select: {
                    idTarifa: true,
                    nombreTarifa: true,
                    estado: true
                }
            }
        },
        orderBy: {
            idTarifaTrayecto: "desc"
        }
    });
};
export const crearTarifaTrayecto = async (datos) => {
    const idTarifa = Number(datos.idTarifa);
    const idComunaOrigen = Number(datos.idComunaOrigen);
    const idComunaDestino = Number(datos.idComunaDestino);

    const tarifa = await prisma.tarifa.findUnique({
        where: {
            idTarifa
        }
    });

    if (!tarifa || tarifa.estado !== true) {
        throw new Error("La tarifa indicada no existe o está inactiva");
    }

    const comunaOrigen = await prisma.comuna.findUnique({
        where: {
            idComuna: idComunaOrigen
        }
    });

    if (!comunaOrigen || comunaOrigen.estado !== true) {
        throw new Error("La comuna de origen no existe o está inactiva");
    }

    const comunaDestino = await prisma.comuna.findUnique({
        where: {
            idComuna: idComunaDestino
        }
    });

    if (!comunaDestino || comunaDestino.estado !== true) {
        throw new Error("La comuna de destino no existe o está inactiva");
    }

    const existente = await prisma.tarifa_trayecto.findFirst({
        where: {
            idTarifa,
            idComunaOrigen,
            idComunaDestino
        }
    });

    if (existente) {
        throw new Error("Ya existe una tarifa para este trayecto");
    }

    return await prisma.tarifa_trayecto.create({
        data: {
            idTarifa,
            idComunaOrigen,
            idComunaDestino,
            valorFijo: Number(datos.valorFijo),
            valorKg: Number(datos.valorKg),
            valorM3: Number(datos.valorM3),
            estado: true
        }
    });
};
export const actualizarTarifaTrayecto = async (idTarifaTrayecto, datos) => {
    const id = Number(idTarifaTrayecto);

    const existente = await prisma.tarifa_trayecto.findUnique({
        where: {
            idTarifaTrayecto: id
        }
    });

    if (!existente) {
        throw new Error("La tarifa por trayecto no existe");
    }

    return await prisma.tarifa_trayecto.update({
        where: {
            idTarifaTrayecto: id
        },
        data: {
            valorFijo: Number(datos.valorFijo),
            valorKg: Number(datos.valorKg),
            valorM3: Number(datos.valorM3)
        }
    });
};
export const cambiarEstadoTarifaTrayecto = async (idTarifaTrayecto, estado) => {
    const id = Number(idTarifaTrayecto);

    const existente = await prisma.tarifa_trayecto.findUnique({
        where: {
            idTarifaTrayecto: id
        }
    });

    if (!existente) {
        throw new Error("La tarifa por trayecto no existe");
    }

    return await prisma.tarifa_trayecto.update({
        where: {
            idTarifaTrayecto: id
        },
        data: {
            estado: Boolean(estado)
        }
    });
};