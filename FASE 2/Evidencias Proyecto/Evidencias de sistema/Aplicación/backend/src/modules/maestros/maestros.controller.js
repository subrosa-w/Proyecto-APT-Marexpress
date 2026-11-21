import {
    crearTarifa,
    obtenerConductores,
    obtenerRegiones,
    obtenerTarifas,
    obtenerUsuarios,
    obtenerVehiculos,
    obtenerPeonetas,
    asegurarRoles,
    cambiarRolUsuario,
    crearConductor,
    crearVehiculo,
    listarTiposRecargo,
    crearTipoRecargo,
    editarTipoRecargo
} from "./maestros.service.js";
import {
    actualizarTarifa,
    cambiarEstadoTarifa,
    obtenerHistorialTarifa,
    obtenerHistorialPrecios
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

export const listarHistorialPrecios = async (req, res) => {
    try {
        const historial = await obtenerHistorialPrecios();
        return res.json({ historial });
    } catch (error) {
        return responderError(res, error, "Error interno al obtener el historial de precios");
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

const responderValidacion = (res, error, mensaje) => {
    if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({ mensaje: error.message });
    }
    return responderError(res, error, mensaje);
};

export const listarRoles = async (req, res) => {
    try {
        const roles = await asegurarRoles();
        return res.json({ roles });
    } catch (error) {
        return responderError(res, error, "Error interno al obtener los roles");
    }
};

export const asignarRolUsuario = async (req, res) => {
    try {
        const usuario = await cambiarRolUsuario(req.params.id, req.body?.idRol);
        return res.json({
            mensaje: `Rol actualizado a ${usuario.rol?.nombreRol}`,
            usuario
        });
    } catch (error) {
        return responderValidacion(res, error, "Error interno al cambiar el rol");
    }
};

export const registrarConductor = async (req, res) => {
    try {
        const conductor = await crearConductor(req.body);
        return res.status(201).json({
            mensaje: "Conductor añadido a la flota",
            conductor
        });
    } catch (error) {
        return responderValidacion(res, error, "Error interno al crear el conductor");
    }
};

export const registrarVehiculo = async (req, res) => {
    try {
        const vehiculo = await crearVehiculo(req.body);
        return res.status(201).json({
            mensaje: "Camión añadido a la flota",
            vehiculo
        });
    } catch (error) {
        return responderValidacion(res, error, "Error interno al crear el vehículo");
    }
};

export const listarRecargos = async (req, res) => {
    try {
        const recargos = await listarTiposRecargo();
        return res.json({ recargos });
    } catch (error) {
        return responderError(res, error, "Error interno al obtener los recargos");
    }
};

export const registrarRecargo = async (req, res) => {
    try {
        const recargo = await crearTipoRecargo(req.body || {});
        return res.status(201).json({
            mensaje: "Recargo creado",
            recargo
        });
    } catch (error) {
        return responderValidacion(res, error, "Error interno al crear el recargo");
    }
};

export const actualizarRecargo = async (req, res) => {
    try {
        const recargo = await editarTipoRecargo(req.params.id, req.body || {});
        return res.json({
            mensaje: "Recargo actualizado",
            recargo
        });
    } catch (error) {
        return responderValidacion(res, error, "Error interno al actualizar el recargo");
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
