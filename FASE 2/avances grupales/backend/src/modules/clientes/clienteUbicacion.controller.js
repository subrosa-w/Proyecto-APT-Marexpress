import {
    listarUbicacionesCliente,
    crearUbicacionCliente,
    modificarUbicacionCliente
} from "./clienteUbicacion.service.js";

/*
 * ============================================================
 * MAREXPRESS - Controller ubicaciones de clientes
 * ============================================================
 *
 * IMPORTANTE:
 * Estas ubicaciones representan instalaciones propias
 * del cliente: sucursales, bodegas, casa matriz, etc.
 *
 * NO representan automáticamente el origen ni destino
 * de una Orden de Transporte.
 * ============================================================
 */

export const listarUbicaciones = async (req, res) => {
    try {
        const ubicaciones =
            await listarUbicacionesCliente(
                req.params.idCliente
            );

        return res.status(200).json({
            ok: true,
            data: ubicaciones
        });

    } catch (error) {
        if (
            error.message === "Cliente inválido" ||
            error.message === "Cliente no encontrado"
        ) {
            return res.status(404).json({
                ok: false,
                mensaje: error.message
            });
        }

        console.error(
            "Error listando ubicaciones:",
            error.message
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible obtener las ubicaciones"
        });
    }
};


export const registrarUbicacion = async (
    req,
    res
) => {
    try {
        const ubicacion =
            await crearUbicacionCliente(
                req.params.idCliente,
                req.body
            );

        return res.status(201).json({
            ok: true,
            mensaje:
                "Ubicación registrada correctamente",
            data: ubicacion
        });

    } catch (error) {
        const erroresValidacion = [
            "Cliente inválido",
            "Cliente no encontrado",
            "Comuna inválida",
            "Comuna no disponible",
            "El nombre de la ubicación es obligatorio",
            "La dirección es obligatoria",
            "Tipo de ubicación inválido"
        ];

        if (
            erroresValidacion.includes(
                error.message
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: error.message
            });
        }

        console.error(
            "Error registrando ubicación:",
            error.message
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible registrar la ubicación"
        });
    }
};


export const actualizarUbicacion = async (
    req,
    res
) => {
    try {
        const ubicacion =
            await modificarUbicacionCliente(
                req.params.idUbicacion,
                req.body
            );

        return res.status(200).json({
            ok: true,
            mensaje:
                "Ubicación actualizada correctamente",
            data: ubicacion
        });

    } catch (error) {
        const erroresValidacion = [
            "Ubicación inválida",
            "Ubicación no encontrada",
            "Comuna inválida",
            "Comuna no disponible",
            "El nombre de la ubicación es obligatorio",
            "La dirección es obligatoria",
            "Tipo de ubicación inválido"
        ];

        if (
            erroresValidacion.includes(
                error.message
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: error.message
            });
        }

        console.error(
            "Error actualizando ubicación:",
            error.message
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "No fue posible actualizar la ubicación"
        });
    }
};