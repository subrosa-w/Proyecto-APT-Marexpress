import {
    obtenerOrdenesTransporte,
    obtenerOrdenTransportePorId,
    obtenerOrdenTransportePorNumero,
    crearOrdenTransporte,
    calcularOrdenTransporte,
    actualizarOrdenTransporte,
    anularOrdenTransporte,
    reingresarOtRechazadaEnBodega
} from "./ordenesTransporte.service.js";

import {
    formatearFechaHoraChile
} from "../../common/utils/fechaChile.js";

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

        const orden = await obtenerOrdenTransportePorId(idOrden, {
            registrarRecepcion: req.query.registrar === "1",
            idUsuario: req.user?.idUsuario,
            ubicacion: "Recepción"
        });

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
                numeroOT,
                {
                    registrarRecepcion: req.query.registrar === "1",
                    idUsuario: req.user?.idUsuario,
                    ubicacion: "Recepción"
                }
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
            "No existe una tarifa activa para el trayecto indicado" ||
            error.message === "El cliente no tiene un tarifario asignado" ||
            error.message === "El tarifario del cliente está inactivo" ||
            error.message === "El cliente indicado no existe" ||
            typeof error.message === "string"
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
            "El cliente indicado no existe",
            "El cliente no tiene un tarifario asignado",
            "El tarifario del cliente está inactivo",
            "No existe una tarifa activa para el trayecto indicado",
            "Debe seleccionar una cuenta corriente.",
            "La cuenta corriente seleccionada no existe.",
            "La cuenta corriente seleccionada está inactiva.",
            "La cuenta corriente no pertenece al cliente seleccionado."
        ];

        if (error?.message) {
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

export const actualizarOrdenTransporteController = async (req, res) => {
    try {
        const idOrden = Number(req.params.id);

        if (!Number.isInteger(idOrden) || idOrden <= 0) {
            return res.status(400).json({
                mensaje: "El ID de la orden no es válido"
            });
        }

        const orden = await actualizarOrdenTransporte(
            idOrden,
            req.body,
            req.user.idUsuario
        );

        res.json({
            mensaje: "Orden de transporte actualizada correctamente",
            orden: prepararOrden(orden)
        });
    } catch (error) {
        console.error("Error al actualizar la orden de transporte:", error);
        res.status(error.status || 400).json({
            mensaje: error.message || "Error interno al actualizar la orden de transporte"
        });
    }
};

export const anularOrdenTransporteController = async (req, res) => {
    try {
        const idOrden = Number(req.params.id || req.body?.idOrden);

        if (!Number.isInteger(idOrden) || idOrden <= 0) {
            return res.status(400).json({
                mensaje: "El ID de la orden no es válido"
            });
        }

        const orden = await anularOrdenTransporte(
            idOrden,
            req.user.idUsuario
        );

        res.json({
            mensaje: "Orden anulada. El registro se conserva en la base de datos.",
            orden: prepararOrden(orden)
        });
    } catch (error) {
        console.error("Error al anular la orden de transporte:", error);
        res.status(error.status || 400).json({
            mensaje: error.message || "Error interno al anular la orden de transporte"
        });
    }
};

export const reingresarOtBodegaController = async (req, res) => {
    try {
        const resultado = await reingresarOtRechazadaEnBodega({
            codigo: req.body?.codigo || req.body?.numeroOT,
            idSucursal: req.body?.idSucursal,
            idUsuario: req.user?.idUsuario
        });

        res.json({
            ok: true,
            mensaje: `Reingreso a ${resultado.sucursal}: ${resultado.ingresados.join(", ")}`,
            ingresados: resultado.ingresados,
            sucursal: resultado.sucursal,
            motivo: resultado.motivo,
            orden: prepararOrden(resultado.orden)
        });
    } catch (error) {
        console.error("Error al reingresar OT rechazada:", error);
        res.status(error.status || 400).json({
            ok: false,
            mensaje: error.message || "No fue posible reingresar la OT a bodega"
        });
    }
};