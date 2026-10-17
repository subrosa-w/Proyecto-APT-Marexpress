import { Router } from "express";
import {
    listarAlertasController,
    marcarAlertaLeidaController,
    marcarAlertasLeidasController
} from "./alertas.controller.js";
import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";

const router = Router();

router.use(autenticar);
router.use(autorizarRoles("ADMINISTRADOR", "OPERADOR"));

router.get("/", listarAlertasController);
router.patch("/leidas", marcarAlertasLeidasController);
router.patch("/:id/leida", marcarAlertaLeidaController);

export default router;
