import {
    obtenerManifiestosPeoneta,
    registrarEntregaPeoneta
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

export const registrarEntrega = async (req, res) => {
    try {
        const manifiestos = await registrarEntregaPeoneta({
            idUsuario: req.user?.idUsuario,
            numeroOT: req.body?.numeroOT,
            resultado: req.body?.resultado,
            observacion: req.body?.observacion,
            nombreReceptor: req.body?.nombreReceptor,
            metodoPago: req.body?.metodoPago
        });
        return res.json({
            ok: true,
            mensaje: "Resultado de entrega guardado",
            data: manifiestos
        });
    } catch (error) {
        const status = error.status || 400;
        if (status >= 500) {
            console.error("Error al registrar la entrega del peoneta:", error);
        }
        return res.status(status).json({
            ok: false,
            mensaje: error.message || "No fue posible registrar la entrega"
        });
    }
};