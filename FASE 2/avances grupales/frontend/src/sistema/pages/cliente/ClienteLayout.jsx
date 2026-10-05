import { Outlet, useLocation } from "react-router";
import RoleLayout from "../../components/RoleLayout.jsx";

const titulos = {
    "/cliente": ["PORTAL CLIENTE", "Inicio"],
    "/cliente/ordenes": ["ENVÍOS", "Mis órdenes"],
    "/cliente/seguimiento": ["ENVÍOS", "Seguimiento"],
    "/cliente/documentos": ["CUENTA", "Documentos"],
    "/cliente/pagos": ["CUENTA", "Pagos"],
    "/cliente/evidencias": ["ENVÍOS", "Evidencias"],
    "/cliente/perfil": ["CUENTA", "Mi perfil"]
};

const items = [
    { to: "/cliente", label: "Inicio", end: true },
    { to: "/cliente/ordenes", label: "Mis órdenes" },
    { to: "/cliente/seguimiento", label: "Seguimiento" },
    { to: "/cliente/documentos", label: "Documentos" },
    { to: "/cliente/pagos", label: "Pagos" },
    { to: "/cliente/evidencias", label: "Evidencias" },
    { to: "/cliente/perfil", label: "Mi perfil" }
];

export default function ClienteLayout() {
    const { pathname } = useLocation();
    const [etiqueta, titulo] = titulos[pathname] || ["PORTAL", "Cliente"];

    return (
        <div className="cliente-body">
            <RoleLayout
                prefijo="cliente"
                subtitulo="Portal Cliente"
                etiqueta={etiqueta}
                titulo={titulo}
                items={items}
            >
                <Outlet />
            </RoleLayout>
        </div>
    );
}
