import express from "express";

import {
    listarComunas
} from "./comunas.controller.js";

import {
    autenticar
} from "../../common/middlewares/auth.middleware.js";

import {
    autorizarRoles
} from "../../common/middlewares/roles.middleware.js";

const router = express.Router();

/*
 * ============================================================
 * MAREXPRESS - Comunas
 * ============================================================
 *
 * Catálogo general utilizado por:
 * - Clientes
 * - Sucursales
 * - Ubicaciones
 * - Órdenes de transporte
 *
 * Todos los usuarios autenticados pueden consultarlo.
 * ============================================================
 */

router.get(
    "/",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR",
        "CLIENTE",
        "PEONETA"
    ),
    listarComunas
);

export default router;