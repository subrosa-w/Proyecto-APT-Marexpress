import prisma from "../../config/prisma.js";
import {
    crearTarifa as crearTarifario,
    obtenerTarifas as listarTarifarios
} from "../tarifas/tarifario.service.js";

export const obtenerTarifas = listarTarifarios;
export const crearTarifa = crearTarifario;

export const obtenerConductores = async () => {
    return prisma.conductor.findMany({
        orderBy: [
            { apellido: "asc" },
            { nombre: "asc" }
        ]
    });
};

export const obtenerVehiculos = async () => {
    return prisma.vehiculo.findMany({
        orderBy: {
            patente: "asc"
        }
    });
};

export const obtenerUsuarios = async () => {
    return prisma.usuario.findMany({
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            rut: true,
            correo: true,
            telefono: true,
            nombreUsuario: true,
            estado: true,
            registroPendiente: true,
            correoVerificadoEn: true,
            rol: {
                select: {
                    idRol: true,
                    nombreRol: true
                }
            }
        },
        orderBy: {
            idUsuario: "desc"
        }
    });
};

export const obtenerPeonetas = async () => {
    return prisma.usuario.findMany({
        where: {
            estado: true,
            rol: {
                nombreRol: "PEONETA"
            }
        },
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            nombreUsuario: true,
            rut: true,
            telefono: true
        },
        orderBy: [
            { apellido: "asc" },
            { nombre: "asc" }
        ]
    });
};

export const obtenerRegiones = async () => {
    return prisma.region.findMany({
        where: {
            estado: true
        },
        include: {
            comuna: {
                where: {
                    estado: true
                },
                orderBy: {
                    nombreComuna: "asc"
                }
            }
        },
        orderBy: {
            nombreRegion: "asc"
        }
    });
};
