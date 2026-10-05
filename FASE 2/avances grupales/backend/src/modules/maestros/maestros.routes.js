import { Router } from "express";

import {
    listarConductores,
    listarRegiones,
    listarTarifas,
    listarUsuarios,
    listarVehiculos,
    listarPeonetas,
    registrarTarifa,
    editarTarifa,
    cambiarEstadoTarifario,
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

export default router;
