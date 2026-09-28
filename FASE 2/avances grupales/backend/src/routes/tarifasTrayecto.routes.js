import { Router } from "express";

import {
    listarTarifasTrayecto,
    registrarTarifaTrayecto,
    modificarTarifaTrayecto,
    modificarEstadoTarifaTrayecto
} from "../controllers/tarifasTrayecto.controller.js";

import {
    validarTarifaTrayecto,
    validarActualizacionTarifaTrayecto
} from "../middlewares/validarTarifaTrayecto.middleware.js";

import {
    autenticar
} from "../middlewares/auth.middleware.js";

import {
    autorizarRoles
} from "../middlewares/roles.middleware.js";

const router = Router();

/*
 * ============================================================
 * MAREXPRESS - Tarifas por trayecto
 * ============================================================
 *
 * ADMINISTRADOR:
 * - Ver tarifas
 * - Crear tarifas
 * - Modificar tarifas
 * - Activar/desactivar tarifas
 *
 * OPERADOR:
 * - Solo consultar tarifas
 *
 * CLIENTE:
 * - Sin acceso a configuración interna
 *
 * PEONETA:
 * - Sin acceso a configuración interna
 *
 * ============================================================
 */


/*
 * Consultar tarifas.
 * ADMINISTRADOR y OPERADOR.
 */
router.get(
    "/",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    listarTarifasTrayecto
);


/*
 * Crear tarifa.
 * Solo ADMINISTRADOR.
 */
router.post(
    "/",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR"
    ),
    validarTarifaTrayecto,
    registrarTarifaTrayecto
);


/*
 * Modificar tarifa.
 * Solo ADMINISTRADOR.
 */
router.put(
    "/:id",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR"
    ),
    validarActualizacionTarifaTrayecto,
    modificarTarifaTrayecto
);


/*
 * Activar/desactivar tarifa.
 * Solo ADMINISTRADOR.
 */
router.patch(
    "/:id/estado",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR"
    ),
    modificarEstadoTarifaTrayecto
);

export default router;