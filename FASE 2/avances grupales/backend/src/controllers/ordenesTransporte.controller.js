import {
    obtenerOrdenesTransporte,
    obtenerOrdenTransportePorId,
    obtenerOrdenTransportePorNumero,
    crearOrdenTransporte,
    calcularOrdenTransporte,
    
} from "../services/ordenesTransporte.service.js";

import {
    formatearFechaHoraChile
} from "../utils/fechaChile.js";

const prepararOrden = (orden) => {
    if (!orden) {
        return orden;
    }

    return {
        ...orden,
        fechaCreacionChile: formatearFechaHoraChile(orden.fechaCreacion)
    };
};

export const listarOrdenesTransporte = async (req, res) => {
    try {
        const ordenes = await obtenerOrdenesTransporte();

        res.json(
            ordenes.map(prepararOrden)
        );
    } catch (error) {
        console.error("Error al listar órdenes de transporte:", error);

        res.status(500).json({
            mensaje: "Error interno al obtener las órdenes de transporte"
        });
    }
};

export const obtenerDetalleOrdenTransporte = async (req, res) => {
    try {
        const idOrden = Number(req.params.id);

        if (!Number.isInteger(idOrden) || idOrden <= 0) {
            return res.status(400).json({
                mensaje: "El ID de la orden no es válido"
            });
        }

        const orden = await obtenerOrdenTransportePorId(idOrden);

        if (!orden) {
            return res.status(404).json({
                mensaje: "Orden de transporte no encontrada"
            });
        }

        res.json(
            prepararOrden(orden)
        );
    } catch (error) {
        console.error("Error al obtener la orden de transporte:", error);

        res.status(500).json({
            mensaje: "Error interno al obtener la orden de transporte"
        });
    }
};

export const obtenerDetalleOrdenTransportePorNumero = async (req, res) => {
    try {

        const numeroOT =
            req.params.numeroOT?.trim();

        if (!numeroOT) {
            return res.status(400).json({
                mensaje: "El número de OT es obligatorio"
            });
        }

        const orden =
            await obtenerOrdenTransportePorNumero(
                numeroOT
            );

        if (!orden) {
            return res.status(404).json({
                mensaje: "Orden de transporte no encontrada"
            });
        }

        return res.json(
            prepararOrden(orden)
        );

    } catch (error) {

        console.error(
            "Error al buscar la orden por número:",
            error
        );

        return res.status(500).json({
            mensaje:
                "Error interno al buscar la orden de transporte"
        });
    }
};

export const registrarOrdenTransporte = async (req, res) => {
    try {
        
        const orden = await crearOrdenTransporte(
            req.body,
            req.user.idUsuario
        );

        res.status(201).json({
            mensaje: "Orden de transporte creada correctamente",
            orden: prepararOrden(orden)
        });
    } catch (error) {
        console.error("Error al crear la orden de transporte:", error);

        if (
            error.message ===
            "No existe una tarifa activa para el trayecto indicado"
        ) {
            return res.status(400).json({
                mensaje: error.message
            });
        }

        res.status(500).json({
            mensaje: "Error interno al crear la orden de transporte"
        });
    }
};

export const calcularOrdenTransporteController = async (req, res) => {
    try {
        const calculo =
            await calcularOrdenTransporte(
                req.body
            );

        res.json({
            mensaje: "Cálculo realizado correctamente",
            calculo
        });

    } catch (error) {
        console.error(
            "Error al crear la orden de transporte:",
            error
        );

        const erroresNegocio = [
            "No existe una tarifa activa para el trayecto indicado",
            "Debe seleccionar una cuenta corriente.",
            "La cuenta corriente seleccionada no existe.",
            "La cuenta corriente seleccionada está inactiva.",
            "La cuenta corriente no pertenece al cliente seleccionado."
        ];

        if (
            erroresNegocio.includes(error.message) ||
            error.message.startsWith(
                "La cuenta corriente no tiene crédito suficiente."
            )
        ) {
            return res.status(400).json({
                mensaje: error.message
            });
        }

        return res.status(500).json({
            mensaje:
                "Error interno al crear la orden de transporte"
        });
    }
};