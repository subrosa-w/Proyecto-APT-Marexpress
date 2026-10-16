import { Router } from "express";

import {
    crearNuevaCotizacion,
    iniciarPagoWebpay,
    listarCotizaciones,
    listarOrdenes,
    listarPendientes,
    obtenerOrden,
    obtenerPerfil,
    obtenerTiposBulto
} from "./portalCliente.controller.js";

import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";

const router = Router();

/*
 * ============================================================
 * MAREXPRESS - RUTAS PORTAL CLIENTE (/api/cliente)
 * ============================================================
 * Solo rol CLIENTE. La empresa se obtiene del JWT:
 * usuario → cliente_usuario → cliente.
 *
 * Cliente normal y con cuenta corriente:
 *   GET  /perfil
 *   GET  /ordenes
 *   GET  /ordenes/:id
 *   GET  /tipos-bulto
 *
 * Solo cliente con cuenta corriente (si no, responde 403):
 *   GET  /pagos/pendientes
 *   POST /pagos/webpay/iniciar   body { idOrdenes: [..] }
 *   GET  /cotizaciones
 *   POST /cotizaciones           body { idComunaOrigen, idComunaDestino, bultos: [..] }
 * ============================================================
 */

router.use(autenticar, autorizarRoles("CLIENTE"));

router.get("/perfil", obtenerPerfil);
router.get("/ordenes", listarOrdenes);
router.get("/ordenes/:id", obtenerOrden);
router.get("/tipos-bulto", obtenerTiposBulto);

router.get("/pagos/pendientes", listarPendientes);
router.post("/pagos/webpay/iniciar", iniciarPagoWebpay);

router.get("/cotizaciones", listarCotizaciones);
router.post("/cotizaciones", crearNuevaCotizacion);

export default router;
