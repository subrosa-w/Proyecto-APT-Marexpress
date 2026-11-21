/*
  RUTA: GET /api/reportes?periodo=&fecha=
  ROL: ADMINISTRADOR
  VISTA: /administrador/reportes
  La fecha llega como YYYY-MM-DD. La vista convierte semana, mes y año antes de llamar.
*/
import { Router } from "express";
import { informeController } from "./reportes.controller.js";
import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";

const router = Router();

router.get(
    "/",
    autenticar,
    autorizarRoles("ADMINISTRADOR"),
    informeController
);

export default router;
