import { Router } from "express";
import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";
import {
    consultarPago,
    iniciarWebpay,
    listarPendientesPago,
    obtenerAmbienteWebpay,
    retornoWebpay
} from "./pagos.controller.js";

const router = Router();

router.get("/webpay/retorno", retornoWebpay);
router.post("/webpay/retorno", retornoWebpay);

router.use(autenticar, autorizarRoles("ADMINISTRADOR", "OPERADOR"));

router.get("/webpay/ambiente", obtenerAmbienteWebpay);
router.get("/pendientes", listarPendientesPago);
router.get("/ot/:numeroOT", consultarPago);
router.post("/webpay/iniciar", iniciarWebpay);

export default router;
