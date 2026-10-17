import { Router } from "express";

import {
    listarConductores,
    listarRegiones,
    listarTarifas,
    listarUsuarios,
    listarVehiculos,
    listarPeonetas,
    listarRoles,
    asignarRolUsuario,
    registrarConductor,
    registrarVehiculo,
    listarRecargos,
    registrarRecargo,
    actualizarRecargo,
    registrarTarifa,
    editarTarifa,
    cambiarEstadoTarifario,
    listarHistorialPrecios,
    listarHistorialTarifa
} from "./maestros.controller.js";

import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";

const router = Router();

router.use(autenticar);

router.get(
    "/tarifas",
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarTarifas
);

router.post(
    "/tarifas",
    autorizarRoles("ADMINISTRADOR"),
    registrarTarifa
);

router.put(
    "/tarifas/:id",
    autorizarRoles("ADMINISTRADOR"),
    editarTarifa
);

router.patch(
    "/tarifas/:id/estado",
    autorizarRoles("ADMINISTRADOR"),
    cambiarEstadoTarifario
);

router.get(
    "/tarifas/historial",
    autorizarRoles("ADMINISTRADOR"),
    listarHistorialPrecios
);

router.get(
    "/tarifas/:id/historial",
    autorizarRoles("ADMINISTRADOR"),
    listarHistorialTarifa
);

router.get(
    "/regiones",
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarRegiones
);

router.get(
    "/conductores",
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarConductores
);

router.get(
    "/vehiculos",
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarVehiculos
);

router.get(
    "/peonetas",
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarPeonetas
);

router.get(
    "/usuarios",
    autorizarRoles("ADMINISTRADOR"),
    listarUsuarios
);

router.get(
    "/roles",
    autorizarRoles("ADMINISTRADOR"),
    listarRoles
);

router.patch(
    "/usuarios/:id/rol",
    autorizarRoles("ADMINISTRADOR"),
    asignarRolUsuario
);

router.post(
    "/conductores",
    autorizarRoles("ADMINISTRADOR"),
    registrarConductor
);

router.post(
    "/vehiculos",
    autorizarRoles("ADMINISTRADOR"),
    registrarVehiculo
);

router.get(
    "/recargos",
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarRecargos
);

router.post(
    "/recargos",
    autorizarRoles("ADMINISTRADOR"),
    registrarRecargo
);

router.patch(
    "/recargos/:id",
    autorizarRoles("ADMINISTRADOR"),
    actualizarRecargo
);

export default router;
