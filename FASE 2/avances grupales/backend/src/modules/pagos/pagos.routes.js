import { Router } from "express";
import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";
import {
    consultarPago,
    iniciarWebpay,
    listarPendientesPago,
    obtenerAmbienteWebpay,
    retornoWebpay,
    retornoWebpayCliente,
    verCaja,
    listarCaja,
    cobrarCaja
} from "./pagos.controller.js";

const router = Router();

router.get("/webpay/retorno", retornoWebpay);
router.post("/webpay/retorno", retornoWebpay);
router.get("/webpay/retorno-cliente", retornoWebpayCliente);
router.post("/webpay/retorno-cliente", retornoWebpayCliente);

router.use(autenticar, autorizarRoles("ADMINISTRADOR", "OPERADOR"));

router.get("/webpay/ambiente", obtenerAmbienteWebpay);
router.get("/pendientes", listarPendientesPago);
router.get("/caja", listarCaja);
router.get("/caja/:codigo", verCaja);
router.post("/caja", cobrarCaja);
router.get("/ot/:numeroOT", consultarPago);
router.post("/webpay/iniciar", iniciarWebpay);

export default router;
