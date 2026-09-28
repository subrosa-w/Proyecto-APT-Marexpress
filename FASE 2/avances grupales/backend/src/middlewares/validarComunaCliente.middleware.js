import { obtenerComunaPorId } from "../services/comunas.service.js";

export const validarComunaCliente = async (req, res, next) => {
    try {
        const comuna = await obtenerComunaPorId(req.body.idComuna);

        if (!comuna) {
            return res.status(400).json({
                mensaje: "La comuna seleccionada no existe o se encuentra inactiva"
            });
        }

        next();
    } catch (error) {
        console.error("Error al validar comuna:", error);

        res.status(500).json({
            mensaje: "Error interno al validar la comuna"
        });
    }
};
