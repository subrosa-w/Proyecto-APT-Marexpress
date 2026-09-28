import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import comunasRoutes from "./routes/comunas.routes.js";
import ordenesTransporteRoutes from "./routes/ordenesTransporte.routes.js";
import tarifasTrayectoRoutes from "./routes/tarifasTrayecto.routes.js";
import authRoutes from "./routes/auth.routes.js";
import clienteUbicacionRoutes from "./routes/clienteUbicacion.routes.js";
import peonetaRoutes from "./routes/peoneta.routes.js";
import bultoRoutes from "./routes/bulto.routes.js";
import destinatariosRoutes from "./routes/destinatarios.routes.js";

const app = express();


// =========================================================
// MIDDLEWARES GENERALES
// =========================================================

app.use(
    cors({
        origin: [
            "http://127.0.0.1:5500",
            "http://localhost:5500"
        ]
    })
);

app.use(express.json());


// =========================================================
// RUTA PRINCIPAL
// =========================================================

app.get("/", (req, res) => {

    res.json({
        mensaje: "MAREXPRESS API funcionando"
    });
});


// =========================================================
// RUTAS API
// =========================================================

app.use("/api/health", healthRoutes);

app.use("/api/clientes", clientesRoutes);

app.use("/api/comunas", comunasRoutes);

app.use(
    "/api/ordenes-transporte",
    ordenesTransporteRoutes
);

app.use(
    "/api/tarifas-trayecto",
    tarifasTrayectoRoutes
);

app.use("/api/auth", authRoutes);

app.use(
    "/api/clientes",
    clienteUbicacionRoutes
);

app.use("/api/peoneta", peonetaRoutes);

app.use("/api/bultos", bultoRoutes);

app.use(
    "/api/destinatarios",
    destinatariosRoutes
);


export default app;