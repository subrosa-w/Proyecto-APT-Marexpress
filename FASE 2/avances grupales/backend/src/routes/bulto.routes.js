import { Router } from "express";

import {
    listarBultosSucursal,
    recibirBulto,
    trasladarBulto,
    listarTiposBulto
} from "../controllers/bulto.controller.js";

import { autenticar } from "../middlewares/auth.middleware.js";
import { autorizarRoles } from "../middlewares/roles.middleware.js";

const router = Router();

router.get(
    "/tipos",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarTiposBulto
);

router.get(
    "/sucursal/:idSucursal",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarBultosSucursal
);

router.post(
    "/:idBulto/recibir",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    recibirBulto
);

router.post(
    "/:idBulto/trasladar",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    trasladarBulto
);

export default router;