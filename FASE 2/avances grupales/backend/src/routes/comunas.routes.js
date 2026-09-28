import express from "express";

import {
    listarComunas
} from "../controllers/comunas.controller.js";

import {
    autenticar
} from "../middlewares/auth.middleware.js";

import {
    autorizarRoles
} from "../middlewares/roles.middleware.js";

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