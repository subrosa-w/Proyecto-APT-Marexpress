import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./auth.jsx";
import { BodegaTrabajoProvider } from "./bodegaTrabajo.jsx";
import "./styles/styles.css";
import "./styles/registro.css";
import "./styles/operador.css";
import "./styles/administrador.css";
import "./styles/cliente.css";
import "./styles/peoneta.css";
import "./styles/ordenes.css";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <BodegaTrabajoProvider>
                    <App />
                </BodegaTrabajoProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
