import {
    listarAlertas,
    marcarAlertaLeida,
    marcarAlertasLeidas
} from "./alertas.service.js";

export const listarAlertasController = async (req, res) => {
    try {
        const alertas = await listarAlertas();
        res.json({ alertas });
    } catch (error) {
        console.error("Error al listar alertas:", error);
        res.status(500).json({
            mensaje: "No fue posible obtener las alertas"
        });
    }
};

export const marcarAlertaLeidaController = async (req, res) => {
    try {
        await marcarAlertaLeida(req.params.id);
        res.json({ mensaje: "Alerta marcada como leída" });
    } catch (error) {
        console.error("Error al marcar la alerta:", error);
        res.status(error.status || 400).json({
            mensaje: error.message || "No fue posible marcar la alerta"
        });
    }
};

export const marcarAlertasLeidasController = async (req, res) => {
    try {
        await marcarAlertasLeidas();
        res.json({ mensaje: "Alertas marcadas como leídas" });
    } catch (error) {
        console.error("Error al marcar las alertas:", error);
        res.status(500).json({
            mensaje: "No fue posible marcar las alertas"
        });
    }
};
