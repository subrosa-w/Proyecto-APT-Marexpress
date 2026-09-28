import prisma from "../config/prisma.js";

export const obtenerComunas = async () => {
    return await prisma.comuna.findMany({
        where: {
            estado: true
        },
        include: {
            region: true
        },
        orderBy: {
            nombreComuna: "asc"
        }
    });
};

export const obtenerComunaPorId = async (idComuna) => {
    return await prisma.comuna.findFirst({
        where: {
            idComuna: Number(idComuna),
            estado: true
        }
    });
};
