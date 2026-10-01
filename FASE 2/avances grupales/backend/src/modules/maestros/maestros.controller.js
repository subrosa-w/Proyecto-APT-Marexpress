import {
    crearTarifa,
    obtenerConductores,
    obtenerRegiones,
    obtenerTarifas,
    obtenerUsuarios,
    obtenerVehiculos,
    obtenerPeonetas
} from "./maestros.service.js";
import {
    actualizarTarifa,
    cambiarEstadoTarifa,
    obtenerHistorialTarifa
} from "../tarifas/tarifario.service.js";

const responderError = (res, error, mensaje) => {
    console.error(mensaje, error);
    return res.status(500).json({
        ok: false,
        mensaje
    });
};

export const listarTarifas = async (req, res) => {
    try {
        const tarifas = await obtenerTarifas();
        return res.json(tarifas);
    } catch (error) {
        return responderError(res, error, "Error interno al obtener las tarifas");
    }
};

export const registrarTarifa = async (req, res) => {
    try {
        const tarifa = await crearTarifa(req.body, req.user?.idUsuario);
        return res.status(201).json({
            mensaje: "Tarifario creado correctamente",
            tarifa
        });
    } catch (error) {
        if (error.message === "El nombre del tarifario es obligatorio") {
            return res.status(400).json({
                ok: false,
                mensaje: error.message
            });
        }
        return responderError(res, error, "Error interno al crear el tarifario");
    }
};

export const editarTarifa = async (req, res) => {
    try {
        const tarifa = await actualizarTarifa(req.params.id, req.body, req.user?.idUsuario);
        return res.json({
            mensaje: "Tarifario actualizado. El cambio quedó en el historial.",
            tarifa
        });
    } catch (error) {
        if (error.message === "El tarifario no existe" || error.message === "El nombre del tarifario es obligatorio") {
            return res.status(error.message === "El tarifario no existe" ? 404 : 400).json({
                ok: false,
                mensaje: error.message
            });
        }
        return responderError(res, error, "Error interno al actualizar el tarifario");
    }
};

export const cambiarEstadoTarifario = async (req, res) => {
    try {
        const tarifa = await cambiarEstadoTarifa(req.params.id, req.body?.estado, req.user?.idUsuario);
        return res.json({
            mensaje: tarifa.estado ? "Tarifario activado" : "Tarifario desactivado",
            tarifa
        });
    } catch (error) {
        if (error.message === "El tarifario no existe") {
            return res.status(404).json({ ok: false, mensaje: error.message });
        }
        return responderError(res, error, "Error interno al cambiar el estado del tarifario");
    }
};

export const listarHistorialTarifa = async (req, res) => {
    try {
        const historial = await obtenerHistorialTarifa(req.params.id);
        return res.json({ historial });
    } catch (error) {
        if (error.message === "El tarifario no existe") {
            return res.status(404).json({ ok: false, mensaje: error.message });
        }
        return responderError(res, error, "Error interno al obtener el historial de precios");
    }
};

export const listarConductores = async (req, res) => {
    try {
        const conductores = await obtenerConductores();
        return res.json(conductores);
    } catch (error) {
        return responderError(res, error, "Error interno al obtener los conductores");
    }
};

export const listarVehiculos = async (req, res) => {
    try {
        const vehiculos = await obtenerVehiculos();
        return res.json(vehiculos);
    } catch (error) {
        return responderError(res, error, "Error interno al obtener los vehículos");
    }
};

export const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await obtenerUsuarios();
        return res.json(usuarios);
    } catch (error) {
        return responderError(res, error, "Error interno al obtener los usuarios");
    }
};

export const listarPeonetas = async (req, res) => {
    try {
        const peonetas = await obtenerPeonetas();
        return res.json(peonetas);
    } catch (error) {
        return responderError(res, error, "Error interno al obtener los peonetas");
    }
};

export const listarRegiones = async (req, res) => {
    try {
        const regiones = await obtenerRegiones();
        return res.json(regiones);
    } catch (error) {
        return responderError(res, error, "Error interno al obtener las regiones");
    }
};
