import { Router } from "express";

import {
    listarUbicaciones,
    registrarUbicacion,
    actualizarUbicacion
} from "./clienteUbicacion.controller.js";

import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";

const router = Router();

/*
 * ============================================================
 * MAREXPRESS - Ubicaciones propias de clientes
 * ============================================================
 *
 * Estas rutas administran:
 * - Casa matriz
 * - Sucursales
 * - Bodegas
 * - Centros de distribución
 * - Otras instalaciones
 *
 * IMPORTANTE:
 * Una ubicación del cliente NO representa automáticamente
 * el origen ni el destino de una Orden de Transporte.
 *
 * Acceso:
 * ADMINISTRADOR -> gestión completa
 * OPERADOR      -> gestión operativa
 * CLIENTE       -> no utiliza estas rutas administrativas
 * PEONETA       -> sin acceso
 * ============================================================
 */

router.use(autenticar);


/*
 * Listar ubicaciones de una empresa
 */
router.get(
    "/:idCliente/ubicaciones",
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    listarUbicaciones
);


/*
 * Registrar una nueva ubicación
 */
router.post(
    "/:idCliente/ubicaciones",
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    registrarUbicacion
);


/*
 * Modificar una ubicación existente
 */
router.put(
    "/ubicaciones/:idUbicacion",
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    actualizarUbicacion
);

export default router;