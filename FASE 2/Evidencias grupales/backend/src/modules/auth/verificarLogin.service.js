import prisma from "../../config/prisma.js";
import { validarCodigoAcceso } from "./verificacionAcceso.service.js";
import { generarTokenAcceso } from "../../common/token.service.js";

/*
 * ============================================================
 * MAREXPRESS - Verificación final del Login
 * ============================================================
 *
 * Etapa 2:
 * - Recibe challengeId + código OTP.
 * - Valida el OTP con propósito LOGIN.
 * - Obtiene internamente al usuario.
 * - Comprueba que siga activo.
 * - Genera JWT solo después del OTP correcto.
 *
 * © 2026 MAREXPRESS. Todos los derechos reservados.
 * ============================================================
 */

export const verificarLogin = async ({
    challengeId,
    codigo
}) => {
    const challengeNormalizado = String(
        challengeId ?? ""
    ).trim();

    if (
        !/^[a-f0-9]{64}$/.test(
            challengeNormalizado
        )
    ) {
        throw new Error(
            "Solicitud de verificación inválida"
        );
    }

    /*
     * validarCodigoAcceso ahora devuelve
     * internamente el idUsuario asociado
     * al challengeId válido.
     */
    const resultadoVerificacion =
        await validarCodigoAcceso(
            challengeNormalizado,
            codigo,
            "LOGIN"
        );

    const usuario = await prisma.usuario.findUnique({
        where: {
            idUsuario:
                resultadoVerificacion.idUsuario
        },
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            correo: true,
            nombreUsuario: true,
            estado: true,
            idRol: true,
            rol: {
                select: {
                    nombreRol: true
                }
            }
        }
    });

    if (!usuario || !usuario.estado) {
        throw new Error(
            "Solicitud de verificación inválida"
        );
    }

    const token = generarTokenAcceso({
        idUsuario: usuario.idUsuario,
        idRol: usuario.idRol,
        rol: usuario.rol?.nombreRol ?? null
    });

    return {
        autenticado: true,
        token,
        expiresIn: 28800, // 8 horas en segundos
        usuario: {
            idUsuario: usuario.idUsuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            nombreUsuario: usuario.nombreUsuario,
            idRol: usuario.idRol,
            rol: usuario.rol?.nombreRol ?? null
        }
    };
};