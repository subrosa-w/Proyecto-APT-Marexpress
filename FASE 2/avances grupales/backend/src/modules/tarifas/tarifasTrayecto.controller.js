import { obtenerTarifasTrayecto, crearTarifaTrayecto, actualizarTarifaTrayecto, cambiarEstadoTarifaTrayecto } from "./tarifasTrayecto.service.js";

export const listarTarifasTrayecto = async (req, res) => {
    try {
        const tarifas = await obtenerTarifasTrayecto();

        res.json(tarifas);
    } catch (error) {
        console.error("Error al listar tarifas por trayecto:", error);

        res.status(500).json({
            mensaje: "Error interno al obtener las tarifas por trayecto"
        });
    }
};
export const registrarTarifaTrayecto = async (req, res) => {
    try {
        const tarifa = await crearTarifaTrayecto(req.body);

        res.status(201).json({
            mensaje: "Tarifa por trayecto creada correctamente",
            tarifa
        });
    } catch (error) {
        console.error("Error al crear tarifa por trayecto:", error);

        const erroresValidacion = [
            "La tarifa indicada no existe o está inactiva",
            "La comuna de origen no existe o está inactiva",
            "La comuna de destino no existe o está inactiva",
            "Ya existe una tarifa para este trayecto"
        ];

        if (erroresValidacion.includes(error.message)) {
            return res.status(400).json({
                mensaje: error.message
            });
        }

        if (error.code === "P2002") {
            return res.status(409).json({
                mensaje: "Ya existe una tarifa para este trayecto"
            });
        }

        res.status(500).json({
            mensaje: "Error interno al crear la tarifa por trayecto"
        });
    }
};
export const modificarTarifaTrayecto = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: "El id de la tarifa por trayecto debe ser válido"
            });
        }

        const tarifa = await actualizarTarifaTrayecto(
            id,
            req.body
        );

        res.json({
            mensaje: "Tarifa por trayecto actualizada correctamente",
            tarifa
        });
    } catch (error) {
        console.error("Error al actualizar tarifa por trayecto:", error);

        if (error.message === "La tarifa por trayecto no existe") {
            return res.status(404).json({
                mensaje: error.message
            });
        }

        res.status(500).json({
            mensaje: "Error interno al actualizar la tarifa por trayecto"
        });
    }
};
export const modificarEstadoTarifaTrayecto = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: "El id de la tarifa por trayecto debe ser válido"
            });
        }

        if (typeof estado !== "boolean") {
            return res.status(400).json({
                mensaje: "El estado debe ser true o false"
            });
        }

        const tarifa = await cambiarEstadoTarifaTrayecto(
            id,
            estado
        );

        res.json({
            mensaje: estado
                ? "Tarifa por trayecto activada correctamente"
                : "Tarifa por trayecto desactivada correctamente",
            tarifa
        });
    } catch (error) {
        console.error("Error al cambiar estado de tarifa por trayecto:", error);

        if (error.message === "La tarifa por trayecto no existe") {
            return res.status(404).json({
                mensaje: error.message
            });
        }

        res.status(500).json({
            mensaje: "Error interno al cambiar el estado de la tarifa por trayecto"
        });
    }
};