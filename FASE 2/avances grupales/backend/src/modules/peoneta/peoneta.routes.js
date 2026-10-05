import { Router } from "express";

import {
    listarMisManifiestos
} from "./peoneta.controller.js";

import {
    autenticar
} from "../../common/middlewares/auth.middleware.js";

import {
    autorizarRoles
} from "../../common/middlewares/roles.middleware.js";

const router = Router();

/*
 * ============================================================
 * MAREXPRESS - RUTAS PEONETA
 * ============================================================
 *
 * Reglas:
 *
 * PEONETA:
 * - Solo puede ver sus propios manifiestos asignados.
 *
 * ADMINISTRADOR:
 * - Puede acceder para supervisión.
 *
 * OPERADOR:
 * - No usa esta ruta específica del peoneta.
 *
 * CLIENTE:
 * - Sin acceso.
 *
 * El idUsuario NO se recibe desde la URL ni desde el body.
 * Se obtiene exclusivamente desde el JWT autenticado.
 * ============================================================
 */

router.use(autenticar);


/*
 * ============================================================
 * LISTAR MIS MANIFIESTOS
 * ============================================================
 *
 * GET /api/peoneta/manifiestos
 */
router.get(
    "/manifiestos",
    autorizarRoles(
        "PEONETA",
        "ADMINISTRADOR"
    ),
    listarMisManifiestos
);


export default router;