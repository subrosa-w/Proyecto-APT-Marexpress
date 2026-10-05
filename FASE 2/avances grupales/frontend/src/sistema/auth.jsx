import { createContext, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router";

const AuthContext = createContext(null);

const rutaPorRol = (rol) => {
    switch (rol) {
        case "ADMINISTRADOR":
            return "/administrador";
        case "OPERADOR":
            return "/operador";
        case "PEONETA":
            return "/peoneta";
        case "CLIENTE":
            return "/cliente";
        default:
            return "/acceso";
    }
};

const leerUsuario = () => {
    try {
        const raw = sessionStorage.getItem("marexpress_usuario");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [token, setToken] = useState(
        () => sessionStorage.getItem("marexpress_token")
    );
    const [usuario, setUsuario] = useState(leerUsuario);

    const guardarSesion = (nuevoToken, nuevoUsuario) => {
        sessionStorage.setItem("marexpress_token", nuevoToken);
        sessionStorage.setItem(
            "marexpress_usuario",
            JSON.stringify(nuevoUsuario)
        );
        setToken(nuevoToken);
        setUsuario(nuevoUsuario);
        navigate(rutaPorRol(nuevoUsuario.rol), { replace: true });
    };

    const cerrarSesion = () => {
        sessionStorage.removeItem("marexpress_token");
        sessionStorage.removeItem("marexpress_usuario");
        setToken(null);
        setUsuario(null);
        navigate("/acceso", { replace: true });
    };

    const valor = useMemo(
        () => ({
            token,
            usuario,
            autenticado: Boolean(token && usuario),
            guardarSesion,
            cerrarSesion,
            rutaPorRol
        }),
        [token, usuario]
    );

    return (
        <AuthContext.Provider value={valor}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const contexto = useContext(AuthContext);

    if (!contexto) {
        throw new Error("useAuth debe usarse dentro de AuthProvider");
    }

    return contexto;
}
