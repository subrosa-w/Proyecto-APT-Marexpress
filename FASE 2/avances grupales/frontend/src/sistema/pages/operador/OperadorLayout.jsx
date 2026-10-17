/*
  VISTA: menú del operador
  RUTA: /operador y todas sus pantallas hijas
  CSS: sistema.css y RoleLayout
  FUNCIONES: arma el menú de recepción, OT, bodega, manifiestos y pagos
*/
import { Outlet, useLocation } from "react-router";
import RoleLayout from "../../components/RoleLayout.jsx";

// Título de la barra según la ruta.
const titulos = {
    "/operador": ["PANEL OPERACIONAL", "Resumen de operaciones"],
    "/operador/recepcion": ["INGRESO DE CARGA", "Recepción"],
    "/operador/ordenes": ["ÓRDENES", "Nueva orden de transporte"],
    "/operador/ordenes-listado": ["ÓRDENES", "Órdenes de transporte"],
    "/operador/clientes": ["MAESTROS", "Clientes"],
    "/operador/bodega": ["OPERACIÓN", "Bodega"],
    "/operador/manifiestos": ["OPERACIÓN", "Manifiestos"],
    "/operador/despacho": ["OPERACIÓN", "Pronto despacho"],
    "/operador/seguimiento": ["OPERACIÓN", "Seguimiento"],
    "/operador/pagos": ["OPERACIÓN", "Pago de OT"],
    "/operador/caja": ["OPERACIÓN", "Caja y retiro"],
    "/operador/comprobantes": ["OPERACIÓN", "Pago de OT"]
};

// Menú del operador, del ingreso de carga al cobro.
const items = [
    { to: "/operador", label: "Inicio", end: true },
    { to: "/operador/recepcion", label: "Recepción" },
    { to: "/operador/ordenes", label: "Nueva OT" },
    { to: "/operador/ordenes-listado", label: "Órdenes de transporte" },
    { to: "/operador/clientes", label: "Clientes" },
    { to: "/operador/bodega", label: "Bodega" },
    { to: "/operador/manifiestos", label: "Manifiestos" },
    { to: "/operador/despacho", label: "Pronto despacho" },
    { to: "/operador/seguimiento", label: "Seguimiento" },
    { to: "/operador/pagos", label: "Pago de OT" },
    { to: "/operador/caja", label: "Caja y retiro" }
];

export default function OperadorLayout() {
    const { pathname } = useLocation();
    const [etiqueta, titulo] = titulos[pathname] || ["OPERACIONES", "Operador"];

    return (
        <div className="operador-body">
            <RoleLayout
                prefijo="operador"
                subtitulo="Operaciones"
                etiqueta={etiqueta}
                titulo={titulo}
                items={items}
            >
                <Outlet />
            </RoleLayout>
        </div>
    );
}
