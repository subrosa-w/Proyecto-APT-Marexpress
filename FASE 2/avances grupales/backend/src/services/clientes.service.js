import prisma from "../config/prisma.js";

export const obtenerClientes = async () => {
    return await prisma.cliente.findMany({
        include: {
            comuna: {
                include: {
                    region: true
                }
            }
        }
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
        include: {
            comuna: {
                include: {
                    region: true
                }
            }
        }
    });
};

export const crearCliente = async (datosCliente) => {
    return await prisma.cliente.create({
        data: datosCliente,
        include: {
            comuna: {
                include: {
                    region: true
                }
            }
        }
    });
};

export const obtenerClientePorRut = async (rut) => {
    return await prisma.cliente.findUnique({
        where: {
            rut: rut
        }
    });
};

export const obtenerCuentaCorrientePorCliente = async (idCliente) => {
    return await prisma.cuenta_corriente.findUnique({
        where: {
            idCliente: Number(idCliente)
        }
    });
};