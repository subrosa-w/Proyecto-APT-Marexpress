import { Router } from "express";

import {
    listarBultosSucursal,
    recibirBulto,
    trasladarBulto,
    listarTiposBulto,
    listarInventarioBodega,
    listarSucursalesBodega,
    listarProntoDespacho
} from "./bulto.controller.js";

import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";

const router = Router();

router.get(
    "/tipos",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarTiposBulto
);

router.get(
    "/pronto-despacho",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarProntoDespacho
);

router.get(
    "/bodega",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarInventarioBodega
);

router.get(
    "/sucursales",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarSucursalesBodega
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