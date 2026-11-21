import prisma from "../../config/prisma.js";
import { verificarTokenAcceso } from "../token.service.js";

/*
 * ============================================================
 * MAREXPRESS - Middleware de autenticación
 * ============================================================
 *
 * Protege las rutas privadas:
 * - Requiere Authorization: Bearer <token>
 * - Verifica firma y expiración del JWT.
 * - Comprueba que el usuario siga existiendo y activo.
 * - Obtiene el rol actual desde la BD.
 * - Guarda el usuario autenticado en req.user.
 *
 * ============================================================
 */

export const autenticar = async (req, res, next) => {
    try {
        const authorization =
            req.headers.authorization;

        if (
            !authorization ||
            !authorization.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                ok: false,
                mensaje: "Acceso no autorizado"
            });
        }

        const token = authorization
            .slice(7)
            .trim();

        if (!token) {
            return res.status(401).json({
                ok: false,
                mensaje: "Acceso no autorizado"
            });
        }

        let payload;

        try {
            payload = verificarTokenAcceso(token);
        } catch {
            return res.status(401).json({
                ok: false,
                mensaje:
                    "Token inválido o expirado"
            });
        }

        const idUsuario = Number(payload.sub);

        if (
            !Number.isInteger(idUsuario) ||
            idUsuario <= 0
        ) {
            return res.status(401).json({
                ok: false,
                mensaje: "Acceso no autorizado"
            });
        }

        /*
         * No confiamos únicamente en el rol contenido
         * en el JWT. Consultamos el estado y rol actual
         * del usuario en la base de datos.
         */
        const usuario =
            await prisma.usuario.findUnique({
                where: {
                    idUsuario
                },
                select: {
                    idUsuario: true,
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
            return res.status(401).json({
                ok: false,
                mensaje: "Acceso no autorizado"
            });
        }

        req.user = {
            idUsuario: usuario.idUsuario,
            idRol: usuario.idRol,
            rol: usuario.rol.nombreRol
        };

        next();

    } catch (error) {
        console.error(
            "Error en middleware de autenticación:",
            error.message
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible validar la sesión"
        });
    }
};