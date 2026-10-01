import { Outlet, useLocation } from "react-router-dom";
import RoleLayout from "../../components/RoleLayout.jsx";

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
    "/operador/comprobantes": ["OPERACIÓN", "Pago de OT"]
};

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
    { to: "/operador/pagos", label: "Pago de OT" }
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
