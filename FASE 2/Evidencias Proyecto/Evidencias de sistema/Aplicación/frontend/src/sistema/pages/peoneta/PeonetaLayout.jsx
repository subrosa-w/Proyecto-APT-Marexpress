/*
  VISTA: menú del peoneta
  RUTA: /peoneta
  CSS: sistema.css y RoleLayout
  FUNCIONES: ruta del día, entregas, historial y perfil
*/
import { Outlet, useLocation } from "react-router";
import RoleLayout from "../../components/RoleLayout.jsx";

// Título según la ruta. Ruta, entregas e historial usan la misma vista con otro filtro.
const titulos = {
    "/peoneta": ["REPARTO", "Mi ruta"],
    "/peoneta/manifiestos": ["REPARTO", "Mi ruta"],
    "/peoneta/entregas": ["REPARTO", "Entregas"],
    "/peoneta/historial": ["REPARTO", "Historial"],
    "/peoneta/perfil": ["CUENTA", "Mi perfil"]
};

// Menú del peoneta: lo que tiene que repartir, lo ya cerrado y su perfil.
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
