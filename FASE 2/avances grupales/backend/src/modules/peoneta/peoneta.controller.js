import {
    obtenerManifiestosPeoneta
} from "./peoneta.service.js";

/*
 * ============================================================
 * MAREXPRESS - CONTROLLER PEONETA
 * ============================================================
 *
 * SEGURIDAD:
 * El idUsuario proviene exclusivamente del JWT.
 *
 * Nunca aceptamos un idUsuario enviado por:
 * - req.body
 * - req.params
 * - req.query
 *
 * De esta forma un peoneta no puede consultar los
 * manifiestos asignados a otro trabajador.
 * ============================================================
 */

export const listarMisManifiestos = async (req, res) => {
    try {

        const idUsuario = req.user?.idUsuario;

        if (!idUsuario) {
            return res.status(401).json({
                ok: false,
                mensaje: "Usuario no autenticado"
            });
        }

        const manifiestos =
            await obtenerManifiestosPeoneta(
                idUsuario
            );

        return res.status(200).json({
            ok: true,
            data: manifiestos
        });

    } catch (error) {

        if (error.message === "Usuario inválido") {
            return res.status(400).json({
                ok: false,
                mensaje: "Solicitud inválida"
            });
        }

        console.error(
            "Error consultando manifiestos del peoneta:",
            error.message
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible obtener los manifiestos asignados"
        });
    }
};