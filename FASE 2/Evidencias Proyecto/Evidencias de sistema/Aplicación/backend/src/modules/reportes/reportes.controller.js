import { obtenerInforme } from "./reportes.service.js";

export const informeController = async (req, res) => {
    try {
        const informe = await obtenerInforme({
            periodo: req.query.periodo,
            fecha: req.query.fecha
        });
        res.json(informe);
    } catch (error) {
        console.error("Error al armar el informe:", error);
        res.status(500).json({
            mensaje: "No fue posible generar el informe"
        });
    }
};
