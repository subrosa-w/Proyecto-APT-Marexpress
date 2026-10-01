import express from "express";

import {
    listarClientes,
    buscarCliente,
    registrarCliente,
    obtenerCuentaCorrienteCliente,
    actualizarTarifaCliente
} from "./clientes.controller.js";

import {
    validarCliente
} from "./validarCliente.middleware.js";

import {
    validarComunaCliente
} from "./validarComunaCliente.middleware.js";

import {
    validarRutDuplicado
} from "./validarRutDuplicado.middleware.js";

import {
    autenticar
} from "../../common/middlewares/auth.middleware.js";

import {
    autorizarRoles
} from "../../common/middlewares/roles.middleware.js";

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
 
const asignarTarifa = [
    autenticar,
    autorizarRoles(
        "ADMINISTRADOR",
        "OPERADOR"
    ),
    actualizarTarifaCliente
];

router.put("/:id/tarifa", ...asignarTarifa);
router.post("/:id/tarifa", ...asignarTarifa);
router.patch("/:id/tarifa", ...asignarTarifa);

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