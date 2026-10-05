import { Navigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function ProtectedRoute({ roles, children }) {
    const { autenticado, usuario } = useAuth();

    if (!autenticado) {
        return <Navigate to="/" replace />;
    }

    if (roles?.length && !roles.includes(usuario.rol)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
