import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { generarCodigoAcceso } from "./verificacionAcceso.service.js";

/*
 * ============================================================
 * MAREXPRESS - Servicio de Login
 * ============================================================
 *
 * Etapa 1:
 * - Permite iniciar con correo o nombre de usuario.
 * - Verifica contraseña con bcrypt.
 * - Valida que la cuenta esté activa.
 * - Genera y envía OTP por correo.
 * - Devuelve challengeId, NO idUsuario.
 *
 * © 2026 MAREXPRESS. Todos los derechos reservados.
 * ============================================================
 */

export const iniciarLogin = async ({
    identificador,
    password
}) => {
    const identificadorNormalizado = String(
        identificador ?? ""
    )
        .trim()
        .toLowerCase();

    const passwordIngresada = String(
        password ?? ""
    );

    if (
        !identificadorNormalizado ||
        !passwordIngresada
    ) {
        throw new Error(
            "Credenciales inválidas"
        );
    }

    const usuario = await prisma.usuario.findFirst({
        where: {
            OR: [
                {
                    correo:
                        identificadorNormalizado
                },
                {
                    nombreUsuario:
                        identificadorNormalizado
                }
            ]
        },
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            correo: true,
            nombreUsuario: true,
            password: true,
            estado: true,
            idRol: true
        }
    });

    /*
     * Mensaje genérico para no revelar
     * si el correo o usuario existe.
     */
    if (!usuario || !usuario.estado) {
        throw new Error(
            "Credenciales inválidas"
        );
    }

    const passwordCorrecta =
        await bcrypt.compare(
            passwordIngresada,
            usuario.password
        );

    if (!passwordCorrecta) {
        throw new Error(
            "Credenciales inválidas"
        );
    }

    /*
     * Credenciales correctas:
     * se genera el desafío OTP LOGIN.
     */
    const resultadoOtp =
        await generarCodigoAcceso(
            usuario.idUsuario,
            "LOGIN"
        );

    /*
     * IMPORTANTE:
     * No devolvemos:
     * - idUsuario
     * - contraseña
     * - hash
     * - código OTP
     */
    return {
        requiereOtp: true,
        mensaje:
            "Código de verificación enviado al correo registrado",
        challengeId:
            resultadoOtp.challengeId,
        expiraEn:
            resultadoOtp.expiraEn
    };
};