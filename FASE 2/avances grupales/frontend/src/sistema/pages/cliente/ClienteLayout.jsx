import { Outlet, useLocation } from "react-router";
import RoleLayout from "../../components/RoleLayout.jsx";
import Message from "../../components/Message.jsx";
import { ClienteProvider, useCliente } from "./clienteContexto.jsx";

const titulos = {
    "/cliente": ["PORTAL CLIENTE", "Inicio"],
    "/cliente/ordenes": ["ENVÍOS", "Mis órdenes"],
    "/cliente/historial": ["ENVÍOS", "Historial de órdenes"],
    "/cliente/pagos": ["CUENTA CORRIENTE", "Pendientes de pago"],
    "/cliente/cotizar": ["CUENTA CORRIENTE", "Cotizar orden de transporte"],
    "/cliente/cotizaciones": ["CUENTA CORRIENTE", "Mis cotizaciones"],
    "/cliente/perfil": ["CUENTA", "Mi perfil"]
};

// Cliente normal: solo revisa sus órdenes y su historial
const itemsNormal = [
    { to: "/cliente", label: "Inicio", end: true },
    { to: "/cliente/ordenes", label: "Mis órdenes" },
    { to: "/cliente/historial", label: "Historial" },
    { to: "/cliente/perfil", label: "Mi perfil" }
];

// Cliente con cuenta corriente: órdenes, pagos pendientes, cotizar e informe de cotizaciones
const itemsCuentaCorriente = [
    { to: "/cliente", label: "Inicio", end: true },
    { to: "/cliente/ordenes", label: "Mis órdenes" },
    { to: "/cliente/pagos", label: "Pendientes de pago" },
    { to: "/cliente/cotizar", label: "Cotizar OT" },
    { to: "/cliente/cotizaciones", label: "Mis cotizaciones" },
    { to: "/cliente/perfil", label: "Mi perfil" }
];

// Aviso del modo ejemplo + selector para probar los dos portales
function AvisoEjemplo() {
    const { tipoEjemplo, cambiarTipoEjemplo } = useCliente();

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 md:flex-row md:items-center md:justify-between">
            <p>
                <strong>Datos de ejemplo:</strong> el backend todavía no tiene las rutas <code>/api/cliente</code>.
                Los datos y pagos de esta vista son simulados.
            </p>
            <div className="flex shrink-0 gap-1 rounded-lg bg-white p-1 ring-1 ring-amber-200" role="group" aria-label="Tipo de cliente a simular">
                {[
                    ["normal", "Cliente normal"],
                    ["cuenta", "Con cuenta corriente"]
                ].map(([valor, texto]) => (
                    <button
                        key={valor}
                        type="button"
                        aria-pressed={tipoEjemplo === valor}
                        onClick={() => cambiarTipoEjemplo(valor)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                            tipoEjemplo === valor ? "bg-marino text-white" : "text-marino hover:bg-slate-100"
                        }`}
                    >
                        {texto}
                    </button>
                ))}
            </div>
        </div>
    );
}

function PortalCliente() {
    const { pathname } = useLocation();
    const { cargando, error, tieneCuentaCorriente, modoEjemplo } = useCliente();
    const [etiqueta, titulo] = titulos[pathname] || ["PORTAL", "Cliente"];

    return (
        <div className="cliente-body">
            <RoleLayout
                prefijo="cliente"
                subtitulo={tieneCuentaCorriente ? "Cliente cuenta corriente" : "Portal Cliente"}
                etiqueta={etiqueta}
                titulo={titulo}
                items={tieneCuentaCorriente ? itemsCuentaCorriente : itemsNormal}
            >
                {modoEjemplo ? <AvisoEjemplo /> : null}
                {cargando ? (
                    <p className="mx-note">Cargando tu información...</p>
                ) : error ? (
                    <Message texto={error} tipo="error" />
                ) : (
                    <Outlet />
                )}
            </RoleLayout>
        </div>
    );
}

export default function ClienteLayout() {
    return (
        <ClienteProvider>
            <PortalCliente />
        </ClienteProvider>
    );
}
