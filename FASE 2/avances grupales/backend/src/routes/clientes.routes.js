import express from "express";

import {
    listarClientes,
    buscarCliente,
    registrarCliente,
    obtenerCuentaCorrienteCliente
} from "../controllers/clientes.controller.js";

import {
    validarCliente
} from "../middlewares/validarCliente.middleware.js";

import {
    validarComunaCliente
} from "../middlewares/validarComunaCliente.middleware.js";

import {
    validarRutDuplicado
} from "../middlewares/validarRutDuplicado.middleware.js";

import {
    autenticar
} from "../middlewares/auth.middleware.js";

import {
    autorizarRoles
} from "../middlewares/roles.middleware.js";

const router = express.Router();

/*
 * ============================================================
 * MAREXPRESS - Clientes
 * ============================================================
 *
 * ADMINISTRADOR:
 * - Listar clientes.
 * - Buscar clientes.
 * - Crear clientes.
 * - Gestionar accesos empresariales.
 *
 * OPERADOR:
 * - Listar clientes.
 * - Buscar clientes.
 * - Crear clientes.
 *
 * CLIENTE:
 * - No utiliza estas rutas generales.
 * - Tendrá endpoints propios para consultar
 *   únicamente su empresa y sus datos.
 *
 * PEONETA:
 * - Sin acceso a administración de clientes.
 *
 * ============================================================
 */

router.get(
    "/buscar",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    buscarCliente
);

router.get(
    "/",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    listarClientes
);


router.get(
    "/:id/cuenta-corriente",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    obtenerCuentaCorrienteCliente
);
 
router.post(
    "/",
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    validarCliente,
    validarComunaCliente,
    validarRutDuplicado,
    registrarCliente
);



export default router;