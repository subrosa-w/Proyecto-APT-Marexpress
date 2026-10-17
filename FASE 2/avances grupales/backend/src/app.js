import express from "express";
import cors from "cors";
import { registrarRutas } from "./routes.js";
import { bloquearInyeccion } from "./common/middlewares/bloquearInyeccion.middleware.js";

const app = express();

app.use(
    cors({
        origin: [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:5173",
            "http://localhost:5173"
        ]
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bloquearInyeccion);

app.use((req, res, next) => {
    const enviar = res.json.bind(res);
    res.json = (body) => {
        if (
            res.statusCode >= 500 &&
            body &&
            typeof body === "object" &&
            !Array.isArray(body) &&
            !body.ruta
        ) {
            body.ruta = `${req.method} ${req.originalUrl}`;
        }
        return enviar(body);
    };
    next();
});

app.get("/", (req, res) => {
    res.json({
        mensaje: "MAREXPRESS API funcionando"
    });
});

registrarRutas(app);

app.use((req, res) => {
    res.status(404).json({
        mensaje: "No existe esa ruta en el servidor",
        ruta: `${req.method} ${req.originalUrl}`
    });
});

app.use((error, req, res, next) => {
    const ruta = `${req.method} ${req.originalUrl}`;
    const codigo = `ERR-${Date.now().toString(36)}`;
    console.error(`[${codigo}] Fallo en ${ruta}`, error);
    if (res.headersSent) {
        return next(error);
    }
    res.status(error.status || 500).json({
        mensaje: "El sistema falló en esta ruta. El detalle quedó en el registro del servidor.",
        ruta,
        codigo
    });
});

export default app;
