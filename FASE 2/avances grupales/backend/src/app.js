import express from "express";
import cors from "cors";
import { registrarRutas } from "./routes.js";

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

app.get("/", (req, res) => {
    res.json({
        mensaje: "MAREXPRESS API funcionando"
    });
});

registrarRutas(app);


export default app;
