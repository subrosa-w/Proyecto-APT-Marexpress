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
import alertasRoutes from "./modules/alertas/alertas.routes.js";
import reportesRoutes from "./modules/reportes/reportes.routes.js";
import { actualizarTarifaCliente } from "./modules/clientes/clientes.controller.js";
import { anularOrdenTransporteController } from "./modules/ordenes/ordenesTransporte.controller.js";
import { autenticar } from "./common/middlewares/auth.middleware.js";
import { autorizarRoles } from "./common/middlewares/roles.middleware.js";

/*
  Rutas del API. Cada módulo vive en src/modules/<nombre> con este orden:
  routes (URL y rol) → controller (responde) → service (consulta o guarda).
  El diseño no está aquí: lo pintan las vistas de frontend/src/sistema.
*/
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

    app.use("/api/health", healthRoutes);                 // estado del servidor
    app.use("/api/auth", authRoutes);                     // login, OTP y registro
    app.use("/api/comunas", comunasRoutes);               // comunas y regiones
    app.use("/api/clientes", clientesRoutes);             // clientes y cuentas corrientes
    app.use("/api/clientes", clienteUbicacionRoutes);     // sucursales del cliente
    app.use("/api/destinatarios", destinatariosRoutes);   // destinatarios de una OT
    app.use("/api/tarifas-trayecto", tarifasTrayectoRoutes); // precio fijo entre comunas
    app.use("/api/ordenes-transporte", ordenesTransporteRoutes); // crear, listar y seguir OT
    app.use("/api/bultos", bultoRoutes);                  // bultos y bodega
    app.use("/api/peoneta", peonetaRoutes);               // ruta y entrega del peoneta
    app.use("/api/maestros", maestrosRoutes);             // conductores, camiones, tarifas, recargos
    app.use("/api/manifiestos", manifiestosRoutes);       // manifiestos de carga
    app.use("/api/pagos", pagosRoutes);                   // cobro de una OT
    app.use("/api/alertas", alertasRoutes);               // avisos del panel
    app.use("/api/reportes", reportesRoutes);             // informes de rentabilidad y camiones
};
