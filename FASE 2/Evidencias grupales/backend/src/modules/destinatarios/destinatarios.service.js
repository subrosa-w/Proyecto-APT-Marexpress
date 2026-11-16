import prisma from "../../config/prisma.js";
import { formatearRut, validarRut } from "../../common/utils/rut.js";
import { correoValido, normalizarTelefono } from "../../common/utils/contacto.js";
import { asegurarClienteConCuenta } from "../clientes/clientes.service.js";

export const obtenerDestinatarios = async () => {
    return prisma.destinatario.findMany({
        where: {
            estado: true
        },
        orderBy: {
            nombreRazonSocial: "asc"
        }
    });
};

export const crearDestinatario = async (datos) => {
    const {
        rut,
        nombreRazonSocial,
        direccion,
        telefono,
        correo,
        referencia,
        idComuna,
        crearCuentaCorriente,
        limiteCredito
    } = datos;

    if (!nombreRazonSocial?.trim()) {
        throw new Error("El nombre o razón social es obligatorio");
    }

    if (!direccion?.trim()) {
        throw new Error("La dirección es obligatoria");
    }

    if (!Number(idComuna)) {
        throw new Error("La comuna es obligatoria");
    }

    const rutNormalizado = rut?.trim() ? formatearRut(rut) : null;
    const telefonoNormalizado = normalizarTelefono(telefono);
    const correoNormalizado = correo?.trim().toLowerCase() || null;
    if (telefono?.trim() && telefonoNormalizado === "") {
        throw new Error("El teléfono debe incluir un código conocido, por ejemplo +569");
    }
    if (correoNormalizado && !correoValido(correoNormalizado)) {
        throw new Error("El correo no tiene un formato válido");
    }
    const quiereCuenta = [true, "true", "SI", "si", 1, "1"].includes(crearCuentaCorriente);

    if (rutNormalizado && !validarRut(rutNormalizado)) {
        throw new Error("El RUT no es válido");
    }

    if (quiereCuenta && !rutNormalizado) {
        throw new Error("El RUT es obligatorio para abrir cuenta corriente");
    }

    if (quiereCuenta && !Number(datos.idTarifa)) {
        throw new Error("Debe seleccionar un tarifario para el destinatario con cuenta corriente");
    }

    return prisma.$transaction(async (tx) => {
        if (quiereCuenta) {
            await asegurarClienteConCuenta(tx, {
                rut: rutNormalizado,
                razonSocial: nombreRazonSocial.trim(),
                direccion: direccion.trim(),
                telefono: telefonoNormalizado,
                correo: correoNormalizado,
                idComuna: Number(idComuna),
                crearCuentaCorriente: true,
                limiteCredito: Number.isFinite(Number(limiteCredito))
                    ? Number(limiteCredito)
                    : 0,
                idTarifa: datos.idTarifa
            });
        }

        if (rutNormalizado) {
            const limpio = rutNormalizado.replace(/\./g, "").replace(/-/g, "");
            const repetidos = await tx.$queryRaw`
                SELECT idDestinatario
                FROM destinatario
                WHERE REPLACE(REPLACE(UPPER(rut), '.', ''), '-', '') = ${limpio}
                LIMIT 1
            `;
            if (repetidos.length) {
                throw new Error("Ya existe un destinatario con ese RUT");
            }
        }

        return tx.destinatario.create({
            data: {
                rut: rutNormalizado,
                nombreRazonSocial: nombreRazonSocial.trim(),
                direccion: direccion.trim(),
                telefono: telefonoNormalizado,
                correo: correoNormalizado,
                referencia: referencia?.trim() || null,
                idComuna: Number(idComuna),
                estado: true
            }
        });
    }).catch((error) => {
        if (error.code === "P2002") {
            throw new Error("Ya existe un destinatario con ese RUT");
        }
        throw error;
    });
};
