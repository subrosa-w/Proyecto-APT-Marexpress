import prisma from "../config/prisma.js";


// =========================================================
// LISTAR DESTINATARIOS
// =========================================================

export const obtenerDestinatarios = async () => {

    return await prisma.destinatario.findMany({

        where: {
            estado: true
        },

        orderBy: {
            nombreRazonSocial: "asc"
        }
    });
};


// =========================================================
// CREAR DESTINATARIO
// =========================================================

export const crearDestinatario = async (datos) => {

    const {
        rut,
        nombreRazonSocial,
        direccion,
        telefono,
        correo,
        referencia,
        idComuna
    } = datos;


    if (!nombreRazonSocial?.trim()) {

        throw new Error(
            "El nombre o razón social es obligatorio"
        );
    }


    if (!direccion?.trim()) {

        throw new Error(
            "La dirección es obligatoria"
        );
    }


    if (!Number(idComuna)) {

        throw new Error(
            "La comuna es obligatoria"
        );
    }


    return await prisma.destinatario.create({

        data: {

            rut:
                rut?.trim() || null,

            nombreRazonSocial:
                nombreRazonSocial.trim(),

            direccion:
                direccion.trim(),

            telefono:
                telefono?.trim() || null,

            correo:
                correo?.trim() || null,

            referencia:
                referencia?.trim() || null,

            idComuna:
                Number(idComuna),

            estado:
                true
        }
    });
};