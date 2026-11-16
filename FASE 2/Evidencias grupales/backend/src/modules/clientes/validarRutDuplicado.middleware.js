import { obtenerClientePorRut } from "./clientes.service.js";

export const validarRutDuplicado = async (req, res, next) => {
    try {
        const clienteExistente = await obtenerClientePorRut(req.body.rut);

        if (clienteExistente) {
            return res.status(409).json({
                mensaje: "Ya existe un cliente registrado con ese RUT"
            });
        }

        next();
    } catch (error) {
        console.error("Error al validar RUT duplicado:", error);

        res.status(500).json({
            mensaje: "Error interno al validar el RUT"
        });
    }
};
