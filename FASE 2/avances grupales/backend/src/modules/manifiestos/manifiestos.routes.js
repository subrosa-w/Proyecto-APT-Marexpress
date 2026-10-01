import { Router } from "express";
import { autenticar } from "../../common/middlewares/auth.middleware.js";
import { autorizarRoles } from "../../common/middlewares/roles.middleware.js";
import {
    listarManifiestos,
    detalleManifiesto,
    registrarManifiesto,
    editarManifiesto,
    escanearManifiesto,
    quitarBultoManifiesto,
    salirARuta
} from "./manifiestos.controller.js";

const router = Router();
const roles = ["ADMINISTRADOR", "OPERADOR"];

router.use(autenticar);

router.get("/", autorizarRoles(...roles), listarManifiestos);
router.post("/", autorizarRoles(...roles), registrarManifiesto);
router.post("/:id/escanear", autorizarRoles(...roles), escanearManifiesto);
router.post("/:id/salir", autorizarRoles(...roles), salirARuta);
router.delete("/:id/bultos/:idBulto", autorizarRoles(...roles), quitarBultoManifiesto);
router.put("/:id", autorizarRoles(...roles), editarManifiesto);
router.get("/:id", autorizarRoles(...roles), detalleManifiesto);

export default router;
