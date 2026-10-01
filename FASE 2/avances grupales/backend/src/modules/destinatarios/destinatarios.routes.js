import { Router } from "express";

import {
    listarDestinatarios,
    guardarDestinatario
} from "./destinatarios.controller.js";

import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";


const router = Router();


// =========================================================
// LISTAR DESTINATARIOS
// =========================================================

router.get(
    "/",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    listarDestinatarios
);


// =========================================================
// CREAR DESTINATARIO
// =========================================================

router.post(
    "/",
    autenticar,
    autorizarRoles("ADMINISTRADOR", "OPERADOR"),
    guardarDestinatario
);


export default router;