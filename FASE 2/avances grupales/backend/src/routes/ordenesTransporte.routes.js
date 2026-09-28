import express from "express";

import {
    listarOrdenesTransporte,
    obtenerDetalleOrdenTransporte,
    obtenerDetalleOrdenTransportePorNumero,
    registrarOrdenTransporte,
    calcularOrdenTransporteController
} from "../controllers/ordenesTransporte.controller.js";

import {
    validarNuevaOrdenTransporte
} from "../middlewares/validarNuevaOrdenTransporte.middleware.js";

import {
    autenticar
} from "../middlewares/auth.middleware.js";

import {
    autorizarRoles
} from "../middlewares/roles.middleware.js";

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


/*
 * Crear OT.
 * ADMINISTRADOR y OPERADOR.
 */
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