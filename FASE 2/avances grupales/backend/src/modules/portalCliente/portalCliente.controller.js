import {
    crearCotizacion,
    ErrorPortal,
    exigirCuentaCorriente,
    listarCotizacionesCliente,
    listarOrdenesCliente,
    listarPendientesCliente,
    listarTiposBulto,
    obtenerContextoCliente,
    obtenerOrdenCliente
} from "./portalCliente.service.js";
import { ErrorPago, iniciarWebpayCliente } from "../pagos/pagos.service.js";

/*
 * ============================================================
 * MAREXPRESS - CONTROLLER PORTAL CLIENTE
 * ============================================================
 * El usuario sale exclusivamente del JWT (req.user).
 * Cada acción carga primero su empresa y su cuenta corriente.
 * ============================================================
 */

const cuerpo = (req) =>
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};

const responderError = (res, error, accion) => {
    if (error instanceof ErrorPortal || error instanceof ErrorPago) {
        return res.status(error.status).json({
            ok: false,
            mensaje: error.message
        });
    }

    console.error(`Error en portal cliente (${accion}):`, error);
    return res.status(500).json({
        ok: false,
        mensaje: `No fue posible ${accion}`
    });
};

// Envuelve cada acción: carga el contexto del cliente y maneja los errores
const conContexto = (accion, manejador) => async (req, res) => {
    try {
        const contexto = await obtenerContextoCliente(req.user?.idUsuario);
        return await manejador(req, res, contexto);
    } catch (error) {
        return responderError(res, error, accion);
    }
};

export const obtenerPerfil = conContexto("obtener tu perfil", (_req, res, contexto) =>
    res.json({ ok: true, ...contexto })
);

export const listarOrdenes = conContexto("obtener tus órdenes", async (_req, res, contexto) => {
    const ordenes = await listarOrdenesCliente(contexto);
    return res.json({ ok: true, ordenes });
});

export const obtenerOrden = conContexto("obtener la orden", async (req, res, contexto) => {
    const orden = await obtenerOrdenCliente(contexto, req.params.id);
    return res.json({ ok: true, orden });
});

export const listarPendientes = conContexto("obtener tus pendientes de pago", async (_req, res, contexto) => {
    const pendientes = await listarPendientesCliente(contexto);
    return res.json({ ok: true, pendientes });
});

export const iniciarPagoWebpay = conContexto("iniciar el pago", async (req, res, contexto) => {
    exigirCuentaCorriente(contexto);

    const resultado = await iniciarWebpayCliente({
        idCliente: contexto.cliente.idCliente,
        idCuenta: contexto.cuentaCorriente.idCuenta,
        idUsuario: contexto.usuario.idUsuario,
        idOrdenes: cuerpo(req).idOrdenes
    });

    return res.json({ ok: true, ...resultado });
});

export const listarCotizaciones = conContexto("obtener tus cotizaciones", async (_req, res, contexto) => {
    const cotizaciones = await listarCotizacionesCliente(contexto);
    return res.json({ ok: true, cotizaciones });
});

export const crearNuevaCotizacion = conContexto("crear la cotización", async (req, res, contexto) => {
    const cotizacion = await crearCotizacion(contexto, cuerpo(req), contexto.usuario.idUsuario);
    return res.status(201).json({ ok: true, ...cotizacion });
});

export const obtenerTiposBulto = async (_req, res) => {
    try {
        const tipos = await listarTiposBulto();
        return res.json({ ok: true, tipos });
    } catch (error) {
        return responderError(res, error, "obtener los tipos de bulto");
    }
};
