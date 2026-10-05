import {
    obtenerManifiestos,
    obtenerManifiestoPorId,
    crearManifiesto,
    actualizarManifiesto,
    escanearCodigoManifiesto,
    quitarBultoDelManifiesto,
    sacarManifiestoARuta
} from "./manifiestos.service.js";

const responder = (res, error) => {
    console.error("Error en manifiestos:", error);
    return res.status(error.status || 400).json({
        ok: false,
        mensaje: error.message || "No fue posible completar la operación"
    });
};

export const listarManifiestos = async (req, res) => {
    try {
        const manifiestos = await obtenerManifiestos();
        res.json({ ok: true, manifiestos });
    } catch (error) {
        responder(res, error);
    }
};

export const detalleManifiesto = async (req, res) => {
    try {
        const manifiesto = await obtenerManifiestoPorId(req.params.id);
        res.json({ ok: true, manifiesto });
    } catch (error) {
        responder(res, error);
    }
};

export const registrarManifiesto = async (req, res) => {
    try {
        const manifiesto = await crearManifiesto(req.body);
        res.status(201).json({
            ok: true,
            mensaje: "Manifiesto creado. Escanea los bultos para cargarlo.",
            manifiesto
        });
    } catch (error) {
        responder(res, error);
    }
};

export const editarManifiesto = async (req, res) => {
    try {
        const manifiesto = await actualizarManifiesto(req.params.id, req.body);
        res.json({ ok: true, mensaje: "Manifiesto actualizado", manifiesto });
    } catch (error) {
        responder(res, error);
    }
};

export const escanearManifiesto = async (req, res) => {
    try {
        const resultado = await escanearCodigoManifiesto(
            req.params.id,
            req.body?.codigo,
            req.user.idUsuario,
            req.body?.idsBulto,
            Boolean(req.body?.listar)
        );
        if (resultado.listar) {
            return res.json({
                ok: true,
                listar: true,
                numeroOT: resultado.numeroOT,
                bultos: resultado.bultos
            });
        }
        res.json({
            ok: true,
            mensaje: `Cargado: ${resultado.agregados.join(", ")}`,
            agregados: resultado.agregados,
            numeroOT: resultado.numeroOT || null,
            manifiesto: resultado.manifiesto
        });
    } catch (error) {
        responder(res, error);
    }
};

export const quitarBultoManifiesto = async (req, res) => {
    try {
        const manifiesto = await quitarBultoDelManifiesto(req.params.id, req.params.idBulto);
        res.json({ ok: true, mensaje: "Bulto quitado del manifiesto", manifiesto });
    } catch (error) {
        responder(res, error);
    }
};

export const salirARuta = async (req, res) => {
    try {
        const manifiesto = await sacarManifiestoARuta(req.params.id, req.user.idUsuario);
        res.json({
            ok: true,
            mensaje: `Manifiesto ${manifiesto.numeroManifiesto} salió a ruta`,
            manifiesto
        });
    } catch (error) {
        responder(res, error);
    }
};
