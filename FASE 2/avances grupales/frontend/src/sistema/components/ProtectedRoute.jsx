/*
  COMPONENTE: guarda de ruta
  FUNCIONES: deja entrar solo si hay sesión y el rol coincide con la ruta
*/
import { Navigate } from "react-router";
import { useAuth } from "../auth.jsx";

export default function ProtectedRoute({ roles, children }) {
    const { autenticado, usuario, rutaPorRol } = useAuth();

    if (!autenticado || !usuario?.rol) {
        return <Navigate to="/acceso" replace />;
    }

    if (roles?.length && !roles.includes(usuario.rol)) {
        return <Navigate to={rutaPorRol(usuario.rol)} replace />;
    }

    return children;
}
