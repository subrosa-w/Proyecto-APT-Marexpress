import jwt from "jsonwebtoken";
import "dotenv/config";

/*
 * ============================================================
 * MAREXPRESS - Servicio de Tokens JWT
 * ============================================================
 *
 * - Firma tokens de acceso.
 * - Expiración corta.
 * - Incluye issuer y audience.
 * - Valida firma y expiración.
 *
 * IMPORTANTE:
 * - JWT_SECRET se obtiene desde .env
 * - Nunca se imprime ni se devuelve.
 *
 * © 2026 MAREXPRESS. Todos los derechos reservados.
 * ============================================================
 */

const JWT_SECRET = process.env.JWT_SECRET;

const JWT_ISSUER = "marexpress-backend";
const JWT_AUDIENCE = "marexpress-web";
const JWT_EXPIRACION = "8h"; // 8 horas

if (!JWT_SECRET) {
    throw new Error(
        "JWT_SECRET no está configurado"
    );
}

export const generarTokenAcceso = (usuario) => {
    if (!usuario?.idUsuario || !usuario?.idRol) {
        throw new Error(
            "No se puede generar el token"
        );
    }

    return jwt.sign(
        {
            sub: String(usuario.idUsuario),
            idRol: usuario.idRol,
            rol: usuario.rol ?? null
        },
        JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: JWT_EXPIRACION,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        }
    );
};

export const verificarTokenAcceso = (token) => {
    if (!token) {
        throw new Error(
            "Token no proporcionado"
        );
    }

    return jwt.verify(
        token,
        JWT_SECRET,
        {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        }
    );
};