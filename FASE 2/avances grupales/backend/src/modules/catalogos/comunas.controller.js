import { obtenerComunas } from "./comunas.service.js";

export const listarComunas = async (req, res) => {
    try {
        const comunas = await obtenerComunas();

        res.json(comunas);
    } catch (error) {
        console.error("Error al listar comunas:", error);

        res.status(500).json({
            mensaje: "Error interno al obtener las comunas"
        });
    }
};
