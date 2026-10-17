import express from "express";

import {
    listarOrdenesTransporte,
    obtenerDetalleOrdenTransporte,
    obtenerDetalleOrdenTransportePorNumero,
    consultaPublicaSeguimientoController,
    registrarOrdenTransporte,
    calcularOrdenTransporteController,
    actualizarOrdenTransporteController,
    anularOrdenTransporteController,
    reingresarOtBodegaController,
    confirmarDevolucionController,
    listarEstadosOtController,
    cambiarEstadoOrdenController
} from "./ordenesTransporte.controller.js";

import {
    validarNuevaOrdenTransporte
} from "./validarNuevaOrdenTransporte.middleware.js";

import {
    autenticar
} from "../../common/middlewares/auth.middleware.js";

import {
    autorizarRoles
} from "../../common/middlewares/roles.middleware.js";

const router = express.Router();

/*
 * ============================================================
 * MAREXPRESS - Órdenes de Transporte
 * ============================================================
 *
 * ADMINISTRADOR:
 * - Acceso total.
 *
 * OPERADOR:
 * - Registrar OT.
 * - Consultar OT.
 * - Ver detalle.
 * - Modificar OT (se agregará su endpoint).
 * - Seguimiento de entregas.
 * - Gestión operativa.
 *
 * CLIENTE:
 * - Tendrá endpoints propios y filtrados
 *   únicamente a sus OT.
 *
 * PEONETA:
 * - Tendrá endpoints propios limitados
 *   a OT incluidas en sus manifiestos asignados.
 *
 * ============================================================
 */


/*
 * Listado general de OT.
 * Solo personal interno.
 */
router.get(
    "/",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    listarOrdenesTransporte
);

router.get(
    "/estados",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    listarEstadosOtController
);

router.post(
    "/anular",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    anularOrdenTransporteController
);

router.post(
    "/reingreso-bodega",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    reingresarOtBodegaController
);

router.post(
    "/devolver-cliente",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    confirmarDevolucionController
);

router.post(
    "/anular/:id",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    anularOrdenTransporteController
);

router.post(
    "/calcular",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    validarNuevaOrdenTransporte,
    calcularOrdenTransporteController
);

/*
 * Consulta pública del seguimiento. No pide sesión y no entrega datos del cliente.
 * Ejemplo: /api/ordenes-transporte/seguimiento/OT-000029
 */
router.get(
    "/seguimiento/:codigo",
    consultaPublicaSeguimientoController
);

/*
 * Buscar OT por número.
 * Ejemplo: OT-000029
 */
router.get(
    "/numero/:numeroOT",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    obtenerDetalleOrdenTransportePorNumero
);

/*
 * Detalle general de una OT.
 * Solo personal interno.
 */
router.get(
    "/:id",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    obtenerDetalleOrdenTransporte
);

router.put(
    "/:id",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    actualizarOrdenTransporteController
);

router.patch(
    "/:id",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    actualizarOrdenTransporteController
);

router.patch(
    "/:id/estado",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    cambiarEstadoOrdenController
);

router.post(
    "/:id/anular",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    anularOrdenTransporteController
);

router.delete(
    "/:id",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    anularOrdenTransporteController
);

router.post(
    "/",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    validarNuevaOrdenTransporte,
    registrarOrdenTransporte
);

export default router;