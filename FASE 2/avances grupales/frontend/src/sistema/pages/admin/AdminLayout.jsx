/*
  VISTA: menú del administrador
  RUTA: /administrador y todas sus pantallas hijas
  CSS: sistema.css (barra lateral y contenido) y RoleLayout
  FUNCIONES: arma el menú y el título de la pantalla actual
*/
import { Outlet, useLocation } from "react-router";
import RoleLayout from "../../components/RoleLayout.jsx";

// Título de la barra según la ruta. La primera parte es la etiqueta chica y la segunda el título.
const titulos = {
    "/administrador": ["PANEL ADMINISTRATIVO", "Resumen operacional"],
    "/administrador/ordenes": ["OPERACIONES", "Órdenes de transporte"],
    "/administrador/nueva-orden": ["ÓRDENES", "Nueva orden de transporte"],
    "/administrador/clientes": ["MAESTROS", "Clientes"],
    "/administrador/tarifas": ["MAESTROS", "Tarifas por trayecto"],
    "/administrador/maestros": ["MAESTROS", "Conductores y vehículos"],
    "/administrador/usuarios": ["ACCESOS", "Usuarios"],
    "/administrador/manifiestos": ["OPERACIONES", "Manifiestos"],
    "/administrador/bodega": ["OPERACIONES", "Bodega"],
    "/administrador/seguimiento": ["OPERACIONES", "Seguimiento"],
    "/administrador/cuentas": ["COMERCIAL", "Cuentas corrientes"],
    "/administrador/reportes": ["GESTIÓN", "Reportes"]
};

// Ítems del menú lateral, en el orden en que se recorre el trabajo del administrador.
const items = [
    { to: "/administrador", label: "Inicio", end: true },
    { to: "/administrador/ordenes", label: "Órdenes de transporte" },
    { to: "/administrador/nueva-orden", label: "Crear orden de transporte" },
    { to: "/administrador/clientes", label: "Clientes" },
    { to: "/administrador/tarifas", label: "Tarifas" },
    { to: "/administrador/maestros", label: "Conductores y vehículos" },
    { to: "/administrador/usuarios", label: "Usuarios" },
    { to: "/administrador/manifiestos", label: "Manifiestos" },
    { to: "/administrador/bodega", label: "Bodega" },
    { to: "/administrador/seguimiento", label: "Seguimiento" },
    { to: "/administrador/cuentas", label: "Cuenta corriente" },
    { to: "/administrador/reportes", label: "Reportes" }
];

export default function AdminLayout() {
    const { pathname } = useLocation();
    const [etiqueta, titulo] = titulos[pathname] || ["ADMINISTRACIÓN", "Administrador"];

    return (
        <div className="admin-body">
            <RoleLayout
                prefijo="admin"
                subtitulo="Administración"
                etiqueta={etiqueta}
                titulo={titulo}
                items={items}
            >
                <Outlet />
            </RoleLayout>
        </div>
    );
}
