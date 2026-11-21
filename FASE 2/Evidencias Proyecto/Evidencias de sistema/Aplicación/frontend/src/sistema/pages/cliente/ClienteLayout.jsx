
/*
  VISTA: menú del cliente
  RUTA: /cliente
  CSS: sistema.css y RoleLayout
  FUNCIONES: portal cliente normal y cliente cuenta corriente
*/

import { Outlet, useLocation } from "react-router";
import RoleLayout from "../../components/RoleLayout.jsx";
import Message from "../../components/Message.jsx";
import { ClienteProvider, useCliente } from "./clienteContexto.jsx";

// Títulos de las secciones del portal
const titulos = {
    "/cliente": ["PORTAL CLIENTE", "Inicio"],
    "/cliente/ordenes": ["ENVÍOS", "Mis órdenes"],
    "/cliente/historial": ["ENVÍOS", "Historial de órdenes"],
    "/cliente/pagos": ["CUENTA CORRIENTE", "Pendientes de pago"],
    "/cliente/cotizar": ["CUENTA CORRIENTE", "Cotizar orden de transporte"],
    "/cliente/cotizaciones": ["CUENTA CORRIENTE", "Mis cotizaciones"],
    "/cliente/perfil": ["CUENTA", "Mi perfil"]
};

// Menú para clientes normales
const itemsNormal = [
    { to: "/cliente", label: "Inicio", end: true },
    { to: "/cliente/ordenes", label: "Mis órdenes" },
    { to: "/cliente/historial", label: "Historial" },
    { to: "/cliente/perfil", label: "Mi perfil" }
];

// Menú para clientes con cuenta corriente
const itemsCuentaCorriente = [
    { to: "/cliente", label: "Inicio", end: true },
    { to: "/cliente/ordenes", label: "Mis órdenes" },
    { to: "/cliente/pagos", label: "Pendientes de pago" },
    { to: "/cliente/cotizar", label: "Cotizar OT" },
    { to: "/cliente/cotizaciones", label: "Mis cotizaciones" },
    { to: "/cliente/perfil", label: "Mi perfil" }
];

// Aviso para usuarios sin empresa asociada
function AvisoSinEmpresa() {
    return (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Tu cuenta aún no está asociada a una empresa.</strong>{" "}
            Cuando Marexpress la asocie, aquí verás tus órdenes de transporte.
            Si ya eres cliente, contáctanos para activarla.
        </div>
    );
}

function PortalCliente() {
    const { pathname } = useLocation();

    const {
        cargando,
        error,
        cliente,
        tieneCuentaCorriente
    } = useCliente();

    const [etiqueta, titulo] =
        titulos[pathname] || ["PORTAL", "Cliente"];

    const itemsMenu = tieneCuentaCorriente
        ? itemsCuentaCorriente
        : itemsNormal;

    return (
        <div className="cliente-body">
            <RoleLayout
                prefijo="cliente"
                subtitulo={
                    tieneCuentaCorriente
                        ? "Cliente cuenta corriente"
                        : "Portal Cliente"
                }
                etiqueta={etiqueta}
                titulo={titulo}
                items={itemsMenu}
            >
                {!cargando && !error && !cliente ? (
                    <AvisoSinEmpresa />
                ) : null}

                {cargando ? (
                    <p className="mx-note">
                        Cargando tu información...
                    </p>
                ) : error ? (
                    <Message texto={error} tipo="error" />
                ) : (
                    <Outlet />
                )}
            </RoleLayout>
        </div>
    );
}

// Componente principal
export default function ClienteLayout() {
    return (
        <ClienteProvider>
            <PortalCliente />
        </ClienteProvider>
    );
}
