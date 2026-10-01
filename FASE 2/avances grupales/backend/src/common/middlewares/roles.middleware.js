/*
 * ============================================================
 * MAREXPRESS - Middleware de autorización por roles
 * ============================================================
 *
 * Este middleware se utiliza DESPUÉS de autenticar.
 *
 * Ejemplo:
 * router.post(
 *     "/",
 *     autenticar,
 *     autorizarRoles("ADMINISTRADOR", "OPERADOR"),
 *     controlador
 * );
 *
 * ============================================================
 */

export const autorizarRoles = (...rolesPermitidos) => {

    return (req, res, next) => {

        /*
         * auth.middleware.js debe ejecutarse primero
         * y crear req.user.
         */
        if (!req.user) {
            return res.status(401).json({
                ok: false,
                mensaje: "Acceso no autorizado"
            });
        }

        const rolUsuario = req.user.rol;

        if (!rolUsuario) {
            return res.status(403).json({
                ok: false,
                mensaje: "Acceso denegado"
            });
        }

        /*
         * El rol actual debe estar expresamente
         * autorizado para utilizar la ruta.
         */
        if (!rolesPermitidos.includes(rolUsuario)) {
            return res.status(403).json({
                ok: false,
                mensaje:
                    "No tienes permisos para realizar esta acción"
            });
        }

        next();
    };
};