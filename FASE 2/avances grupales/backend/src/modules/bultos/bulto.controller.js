import {
    trasladarBultoEntreSucursales,
    obtenerBultosPorSucursal,
    recibirBultoEnSucursal,
    obtenerTiposBulto,
    obtenerInventarioBodega,
    obtenerSucursalesBodega,
    obtenerProntoDespacho
} from "./bulto.service.js";

export async function listarProntoDespacho(req, res) {
    try {
        const datos = await obtenerProntoDespacho({
            diasMinimos: req.query.dias
        });
        return res.status(200).json({
            ok: true,
            ...datos
        });
    } catch (error) {
        return responderErrorBulto(res, error);
    }
}

export async function listarInventarioBodega(req, res) {
    try {
        const inventario = await obtenerInventarioBodega({
            estado: req.query.estado,
            idSucursal: req.query.idSucursal,
            busqueda: req.query.q
        });

        return res.status(200).json({
            ok: true,
            total: inventario.bultos.length,
            resumen: inventario.resumen,
            bultos: inventario.bultos
        });
    } catch (error) {
        return responderErrorBulto(res, error);
    }
}

export async function listarSucursalesBodega(req, res) {
    try {
        const sucursales = await obtenerSucursalesBodega();
        return res.status(200).json({
            ok: true,
            sucursales
        });
    } catch (error) {
        return responderErrorBulto(res, error);
    }
}

export async function listarTiposBulto(req, res) {
    try {
        const tipos = await obtenerTiposBulto();

        return res.status(200).json({
            ok: true,
            total: tipos.length,
            tipos
        });
    } catch (error) {
        console.error(
            "Error al listar tipos de bulto:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "No fue posible obtener los tipos de bulto"
        });
    }
}

export async function trasladarBulto(req, res) {
    try {
        const { idBulto } = req.params;
        const {
            idSucursalOrigen,
            idSucursalDestino,
            observacion = null
        } = req.body ?? {};

        const idUsuario = req.user?.idUsuario;

        if (!idUsuario) {
            return res.status(401).json({
                ok: false,
                mensaje: "Usuario no autenticado"
            });
        }

        if (!idSucursalOrigen || !idSucursalDestino) {
            return res.status(400).json({
                ok: false,
                mensaje: "Debe indicar sucursal de origen y destino"
            });
        }

        const movimiento = await trasladarBultoEntreSucursales({
            idBulto,
            idSucursalOrigen,
            idSucursalDestino,
            idUsuario,
            observacion
        });

        return res.status(201).json({
            ok: true,
            mensaje: "Bulto enviado a traslado correctamente",
            movimiento
        });
    } catch (error) {
        return responderErrorBulto(res, error);
    }
}

export async function listarBultosSucursal(req, res) {
    try {
        const { idSucursal } = req.params;
        const bultos = await obtenerBultosPorSucursal(idSucursal);

        return res.status(200).json({
            ok: true,
            total: bultos.length,
            bultos
        });
    } catch (error) {
        return responderErrorBulto(res, error);
    }
}

export async function recibirBulto(req, res) {
    try {
        const { idBulto } = req.params;
        const {
            idSucursal,
            observacion = null
        } = req.body ?? {};

        const idUsuario = req.user?.idUsuario;

        if (!idUsuario) {
            return res.status(401).json({
                ok: false,
                mensaje: "Usuario no autenticado"
            });
        }

        const resultado = await recibirBultoEnSucursal({
            idBulto,
            idSucursal,
            idUsuario,
            observacion
        });

        return res.status(201).json({
            ok: true,
            mensaje: "Bulto recibido correctamente en sucursal",
            movimiento: resultado.movimiento,
            bulto: resultado.bulto
        });
    } catch (error) {
        return responderErrorBulto(res, error);
    }
}

function responderErrorBulto(res, error) {
    const mensaje = typeof error?.message === "string"
        ? error.message
        : "";

    const erroresControlados = new Map([
        ["Bulto no encontrado", 404],
        ["Sucursal no encontrada", 404],
        ["Sucursal no encontrada o inactiva", 400],
        ["Sucursal de origen no encontrada o inactiva", 400],
        ["Sucursal de destino no encontrada o inactiva", 400],
        ["Usuario no encontrado o inactivo", 401],
        ["El ID de sucursal debe ser un entero positivo", 400],
        ["idBulto debe ser un entero positivo", 400],
        ["idSucursal debe ser un entero positivo", 400],
        ["idUsuario debe ser un entero positivo", 400],
        ["La observación debe ser texto de máximo 200 caracteres", 400],
        ["El bulto ya está recibido en esta sucursal", 400],
        ["El bulto está en otra sucursal; debe trasladarse primero", 400]
    ]);

    if (erroresControlados.has(mensaje)) {
        return res.status(erroresControlados.get(mensaje)).json({
            ok: false,
            mensaje
        });
    }

    const estadosBloqueados = [
        "ASIGNADO_MANIFIESTO",
        "EN_TRANSITO",
        "ENTREGADO"
    ];

    if (estadosBloqueados.some(
        estado => mensaje ===
            `No se puede recibir un bulto con estado ${estado}`
    )) {
        return res.status(400).json({
            ok: false,
            mensaje
        });
    }

    // Devuelve únicamente textos fijos de reglas conocidas.
    const reglasConocidas = [
        "El bulto debe ingresar en la sucursal destino del traslado",
        "El bulto no se encuentra en la sucursal de origen indicada",
        "La sucursal de origen y destino deben ser diferentes"
    ];

    const regla = reglasConocidas.find(texto =>
        mensaje.includes(texto)
    );

    if (regla) {
        return res.status(400).json({
            ok: false,
            mensaje: regla
        });
    }

    console.error("Error interno en módulo de bultos:", error);

    return res.status(500).json({
        ok: false,
        mensaje: "No fue posible completar la operación"
    });
}