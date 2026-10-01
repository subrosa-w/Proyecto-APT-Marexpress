import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";
import { generarCodigoAcceso } from "./verificacionAcceso.service.js";

const MENSAJE_NO_DISPONIBLE =
    "No fue posible reenviar el código con los datos proporcionados";

export const reenviarOtpRegistro = async ({
    identificador,
    password
} = {}) => {
    if (
        typeof identificador !== "string" ||
        !identificador.trim() ||
        typeof password !== "string" ||
        !password
    ) {
        throw new Error(MENSAJE_NO_DISPONIBLE);
    }

    const identificadorNormalizado = identificador
        .trim()
        .toLowerCase();

    if (
        identificadorNormalizado.length > 150 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        throw new Error(MENSAJE_NO_DISPONIBLE);
    }

    const candidatos = await prisma.usuario.findMany({
        where: {
            OR: [
                { correo: identificadorNormalizado },
                { nombreUsuario: identificadorNormalizado }
            ]
        },
        select: {
            idUsuario: true,
            password: true,
            estado: true,
            registroPendiente: true,
            correoVerificadoEn: true,
            rol: {
                select: {
                    nombreRol: true
                }
            }
        },
        take: 2
    });

    // Evita elegir una cuenta arbitrariamente si un identificador
    // coincide con el correo de una y el usuario de otra.
    if (candidatos.length !== 1) {
        throw new Error(MENSAJE_NO_DISPONIBLE);
    }

    const usuario = candidatos[0];

    const passwordCorrecta = await bcrypt.compare(
        password,
        usuario.password
    );

    if (
        !passwordCorrecta ||
        usuario.estado ||
        !usuario.registroPendiente ||
        usuario.correoVerificadoEn !== null ||
        usuario.rol?.nombreRol !== "CLIENTE"
    ) {
        throw new Error(MENSAJE_NO_DISPONIBLE);
    }

    try {
        // El servicio OTP vuelve a comprobar el estado del usuario
        // e invalida los códigos anteriores de REGISTRO.
        const resultado = await generarCodigoAcceso(
            usuario.idUsuario,
            "REGISTRO"
        );

        return {
            enviado: true,
            challengeId: resultado.challengeId,
            expiraEn: resultado.expiraEn
        };
    } catch (error) {
        if (error.message === "Usuario no disponible") {
            throw new Error(MENSAJE_NO_DISPONIBLE);
        }

        throw error;
    }
};