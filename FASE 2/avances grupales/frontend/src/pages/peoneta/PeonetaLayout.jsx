import { Outlet, useLocation } from "react-router-dom";
import RoleLayout from "../../components/RoleLayout.jsx";

const titulos = {
    "/peoneta": ["REPARTO", "Mi ruta"],
    "/peoneta/manifiestos": ["REPARTO", "Mi ruta"],
    "/peoneta/entregas": ["REPARTO", "Entregas"],
    "/peoneta/historial": ["REPARTO", "Historial"],
    "/peoneta/perfil": ["CUENTA", "Mi perfil"]
};

const items = [
    { to: "/peoneta", label: "Mi ruta", end: true },
    { to: "/peoneta/entregas", label: "Entregas" },
    { to: "/peoneta/historial", label: "Historial" },
    { to: "/peoneta/perfil", label: "Mi perfil" }
];

export default function PeonetaLayout() {
    const { pathname } = useLocation();
    const [etiqueta, titulo] = titulos[pathname] || ["REPARTO", "Peoneta"];

    return (
        <div className="peoneta-body">
            <RoleLayout
                prefijo="peoneta"
                subtitulo="Reparto"
                etiqueta={etiqueta}
                titulo={titulo}
                items={items}
            >
                <Outlet />
            </RoleLayout>
        </div>
    );
}
