import { Outlet, useLocation } from "react-router";
import RoleLayout from "../../components/RoleLayout.jsx";

const titulos = {
    "/administrador": ["PANEL ADMINISTRATIVO", "Resumen operacional"],
    "/administrador/ordenes": ["OPERACIONES", "Órdenes de transporte"],
    "/administrador/clientes": ["MAESTROS", "Clientes"],
    "/administrador/tarifas": ["MAESTROS", "Tarifas por trayecto"],
    "/administrador/maestros": ["MAESTROS", "Conductores y vehículos"],
    "/administrador/usuarios": ["ACCESOS", "Usuarios"],
    "/administrador/manifiestos": ["OPERACIONES", "Manifiestos"],
    "/administrador/bodega": ["OPERACIONES", "Bodega"],
    "/administrador/seguimiento": ["OPERACIONES", "Seguimiento"],
    "/administrador/cuentas": ["COMERCIAL", "Cuentas corrientes"],
    "/administrador/facturacion": ["COMERCIAL", "Facturación"],
    "/administrador/reportes": ["GESTIÓN", "Reportes"]
};

const items = [
    { to: "/administrador", label: "Inicio", end: true },
    { to: "/administrador/ordenes", label: "Órdenes de transporte" },
    { to: "/administrador/clientes", label: "Clientes" },
    { to: "/administrador/tarifas", label: "Tarifas" },
    { to: "/administrador/maestros", label: "Conductores y vehículos" },
    { to: "/administrador/usuarios", label: "Usuarios" },
    { to: "/administrador/manifiestos", label: "Manifiestos" },
    { to: "/administrador/bodega", label: "Bodega" },
    { to: "/administrador/seguimiento", label: "Seguimiento" },
    { to: "/administrador/cuentas", label: "Cuenta corriente" },
    { to: "/administrador/facturacion", label: "Facturación" },
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
