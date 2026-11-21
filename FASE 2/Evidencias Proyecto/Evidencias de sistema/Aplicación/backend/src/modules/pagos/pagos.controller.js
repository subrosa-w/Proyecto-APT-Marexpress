import {
    ambienteWebpay,
    consultarPagoOt,
    ErrorPago,
    finalizarRetornoWebpay,
    finalizarRetornoWebpayCliente,
    iniciarWebpayOt,
    listarOtsPendientesPago,
    consultarCaja,
    cobrarEnCaja,
    listarCajaBodega
} from "./pagos.service.js";

const cuerpo = (req) =>
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};

const responderError = (res, error) => {
    if (error instanceof ErrorPago) {
        return res.status(error.status).json({
            ok: false,
            mensaje: error.message
        });
    }

    console.error("Error en pagos Webpay:", error);
    return res.status(500).json({
        ok: false,
        mensaje: error?.message || "No fue posible procesar el pago"
    });
};

export const obtenerAmbienteWebpay = (_req, res) => {
    return res.json({
        ok: true,
        ...ambienteWebpay()
    });
};

export const listarPendientesPago = async (_req, res) => {
    try {
        const ordenes = await listarOtsPendientesPago();
        return res.json({ ok: true, ordenes });
    } catch (error) {
        return responderError(res, error);
    }
};

export const consultarPago = async (req, res) => {
    try {
        const pago = await consultarPagoOt({
            numeroOT: req.params.numeroOT,
            idOrden: req.query.idOrden
        });
        return res.json({ ok: true, ...pago });
    } catch (error) {
        return responderError(res, error);
    }
};

export const iniciarWebpay = async (req, res) => {
    try {
        const datos = cuerpo(req);
        const resultado = await iniciarWebpayOt({
            idOrden: datos.idOrden,
            numeroOT: datos.numeroOT,
            idUsuario: req.user?.idUsuario
        });
        return res.json({ ok: true, ...resultado });
    } catch (error) {
        return responderError(res, error);
    }
};

export const retornoWebpay = async (req, res) => {
    try {
        const datos = { ...cuerpo(req), ...req.query };
        const destino = await finalizarRetornoWebpay({
            tokenWs: datos.token_ws,
            tbkToken: datos.TBK_TOKEN
        });
        return res.redirect(302, destino);
    } catch (error) {
        console.error("Error al confirmar Webpay:", error);
        const frontend = String(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
        return res.redirect(302, `${frontend}/operador/pagos?estado=error`);
    }
};

// Retorno de Webpay para los pagos que hace el cliente con cuenta corriente
export const retornoWebpayCliente = async (req, res) => {
    try {
        const datos = { ...cuerpo(req), ...req.query };
        const destino = await finalizarRetornoWebpayCliente({
            tokenWs: datos.token_ws,
            tbkToken: datos.TBK_TOKEN
        });
        return res.redirect(302, destino);
    } catch (error) {
        console.error("Error al confirmar Webpay del cliente:", error);
        const frontend = String(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
        return res.redirect(302, `${frontend}/cliente/pagos?estado=error`);
    }
};

export const listarCaja = async (req, res) => {
    try {
        const ordenes = await listarCajaBodega(req.query.idComuna);
        return res.json({ ok: true, ordenes });
    } catch (error) {
        return responderError(res, error);
    }
};

export const verCaja = async (req, res) => {
    try {
        const orden = await consultarCaja(req.params.codigo);
        return res.json({ ok: true, orden });
    } catch (error) {
        return responderError(res, error);
    }
};

export const cobrarCaja = async (req, res) => {
    try {
        const orden = await cobrarEnCaja({
            codigo: cuerpo(req).numeroOT,
            metodoPago: cuerpo(req).metodoPago,
            idUsuario: req.user?.idUsuario
        });
        return res.json({ ok: true, mensaje: `${orden.numeroOT} quedó pagada en caja.`, orden });
    } catch (error) {
        return responderError(res, error);
    }
};
