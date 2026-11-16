import { Navigate } from "react-router";
import { useCliente } from "./clienteContexto.jsx";

// Protege las vistas exclusivas del cliente con cuenta corriente.
// Un cliente normal que entre por URL vuelve al inicio de su portal.
export default function SoloCuentaCorriente({ children }) {
    const { tieneCuentaCorriente } = useCliente();

    if (!tieneCuentaCorriente) {
        return <Navigate to="/cliente" replace />;
    }

    return children;
}
