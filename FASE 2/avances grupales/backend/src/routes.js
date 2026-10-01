import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import comunasRoutes from "./modules/catalogos/comunas.routes.js";
import clientesRoutes from "./modules/clientes/clientes.routes.js";
import clienteUbicacionRoutes from "./modules/clientes/clienteUbicacion.routes.js";
import destinatariosRoutes from "./modules/destinatarios/destinatarios.routes.js";
import tarifasTrayectoRoutes from "./modules/tarifas/tarifasTrayecto.routes.js";
import ordenesTransporteRoutes from "./modules/ordenes/ordenesTransporte.routes.js";
import bultoRoutes from "./modules/bultos/bulto.routes.js";
import peonetaRoutes from "./modules/peoneta/peoneta.routes.js";
import maestrosRoutes from "./modules/maestros/maestros.routes.js";
import manifiestosRoutes from "./modules/manifiestos/manifiestos.routes.js";
import pagosRoutes from "./modules/pagos/pagos.routes.js";
import { actualizarTarifaCliente } from "./modules/clientes/clientes.controller.js";
import { anularOrdenTransporteController } from "./modules/ordenes/ordenesTransporte.controller.js";
import { autenticar } from "./common/middlewares/auth.middleware.js";
import { autorizarRoles } from "./common/middlewares/roles.middleware.js";

export const registrarRutas = (app) => {
    const asignarTarifaCliente = [
        autenticar,
        autorizarRoles("ADMINISTRADOR", "OPERADOR"),
        actualizarTarifaCliente
    ];
    const anularOt = [
        autenticar,
        autorizarRoles("ADMINISTRADOR", "OPERADOR"),
        anularOrdenTransporteController
    ];

    app.put("/api/clientes/:id/tarifa", ...asignarTarifaCliente);
    app.post("/api/clientes/:id/tarifa", ...asignarTarifaCliente);
    app.patch("/api/clientes/:id/tarifa", ...asignarTarifaCliente);
    app.post("/api/ordenes-transporte/anular", ...anularOt);
    app.post("/api/ordenes-transporte/anular/:id", ...anularOt);
    app.post("/api/ordenes-transporte/:id/anular", ...anularOt);
    app.delete("/api/ordenes-transporte/:id", ...anularOt);

    app.use("/api/health", healthRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/comunas", comunasRoutes);
    app.use("/api/clientes", clientesRoutes);
    app.use("/api/clientes", clienteUbicacionRoutes);
    app.use("/api/destinatarios", destinatariosRoutes);
    app.use("/api/tarifas-trayecto", tarifasTrayectoRoutes);
    app.use("/api/ordenes-transporte", ordenesTransporteRoutes);
    app.use("/api/bultos", bultoRoutes);
    app.use("/api/peoneta", peonetaRoutes);
    app.use("/api/maestros", maestrosRoutes);
    app.use("/api/manifiestos", manifiestosRoutes);
    app.use("/api/pagos", pagosRoutes);
};
