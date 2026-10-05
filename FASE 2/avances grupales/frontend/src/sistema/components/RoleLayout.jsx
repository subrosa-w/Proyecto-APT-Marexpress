import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { useAuth } from "../auth.jsx";
import { useBodegaTrabajo } from "../bodegaTrabajo.jsx";
import { nombreCompleto } from "../utils.js";
import Icono from "../../components/Icono.jsx";
import { FlechasLogo } from "../../components/Logo.jsx";

/*
  Molde común de los 4 paneles (administrador, operador, peoneta y cliente).
  Mismas props y mismo comportamiento que el RoleLayout del front de prueba;
  solo cambia el diseño (barra lateral azul con íconos, encabezado blanco).
*/

// Ícono de cada opción del menú, según su texto
const iconos = {
    "Inicio": "dashboard",
    "Recepción": "move_to_inbox",
    "Nueva OT": "add_box",
    "Órdenes de transporte": "receipt_long",
    "Clientes": "groups",
    "Bodega": "warehouse",
    "Manifiestos": "fact_check",
    "Pronto despacho": "schedule_send",
    "Seguimiento": "route",
    "Pago de OT": "payments",
    "Tarifas": "sell",
    "Conductores y vehículos": "local_shipping",
    "Usuarios": "manage_accounts",
    "Cuenta corriente": "account_balance_wallet",
    "Facturación": "request_quote",
    "Reportes": "monitoring",
    "Mi ruta": "map",
    "Entregas": "inventory",
    "Historial": "history",
    "Mi perfil": "person",
    "Mis órdenes": "receipt_long",
    "Documentos": "description",
    "Pagos": "payments",
    "Evidencias": "photo_camera"
};

export default function RoleLayout({
    prefijo,
    subtitulo,
    etiqueta,
    titulo,
    items,
    children
}) {
    const { usuario, cerrarSesion } = useAuth();
    const bodegaTrabajo = useBodegaTrabajo();
    const location = useLocation();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const iniciales = (usuario?.nombre?.[0] || prefijo[0] || "U").toUpperCase();

    // Al cambiar de página se cierra el menú del celular
    useEffect(() => {
        setMenuAbierto(false);
    }, [location.pathname]);

    useEffect(() => {
        const cerrarEnEscritorio = () => {
            if (window.innerWidth > 1024) {
                setMenuAbierto(false);
            }
        };

        window.addEventListener("resize", cerrarEnEscritorio);
        return () => window.removeEventListener("resize", cerrarEnEscritorio);
    }, []);

    // Con el menú abierto en celular, la página de atrás no se desplaza
    useEffect(() => {
        document.body.classList.toggle("overflow-hidden", menuAbierto);
        return () => document.body.classList.remove("overflow-hidden");
    }, [menuAbierto]);

    return (
        <div className="mx-sistema flex min-h-screen bg-[#f3f6fa] text-slate-800">
            {/* Barra superior: solo en celular y tablet */}
            <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 bg-marino px-4 text-white shadow-md lg:hidden print:hidden">
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold"
                    aria-expanded={menuAbierto}
                    aria-controls={`${prefijo}-menu`}
                    onClick={() => setMenuAbierto((abierto) => !abierto)}
                >
                    <Icono nombre={menuAbierto ? "close" : "menu"} className="text-lg" />
                    {menuAbierto ? "Cerrar" : "Menú"}
                </button>
                <strong className="italic tracking-tight">
                    MAR<span className="text-verde-claro">EXPRESS</span>
                </strong>
                <span className="truncate text-xs text-celeste">{subtitulo}</span>
            </div>

            {menuAbierto ? (
                <button
                    type="button"
                    className="fixed inset-0 z-30 bg-marino-oscuro/50 backdrop-blur-sm lg:hidden"
                    aria-label="Cerrar menú"
                    onClick={() => setMenuAbierto(false)}
                />
            ) : null}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-marino text-white shadow-xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 print:hidden ${
                    menuAbierto ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center gap-2.5 border-b border-white/10 p-5">
                    <FlechasLogo claro className="h-8 w-8" />
                    <div>
                        <div className="text-lg font-extrabold italic leading-none tracking-tight">
                            MAR<span className="text-verde-claro">EXPRESS</span>
                        </div>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-celeste">
                            {subtitulo}
                        </div>
                    </div>
                </div>

                <nav
                    id={`${prefijo}-menu`}
                    className="flex-1 space-y-1 overflow-y-auto p-3"
                    aria-label={`Menú ${subtitulo}`}
                >
                    {items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                                    isActive
                                        ? "bg-azul font-semibold text-white shadow-sm"
                                        : "font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                                }`
                            }
                        >
                            <Icono nombre={iconos[item.label] || "chevron_right"} className="text-[20px]" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-white/10 bg-marino-oscuro p-4">
                    <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-300/50 hover:bg-red-500/15 hover:text-white"
                        onClick={cerrarSesion}
                    >
                        <Icono nombre="logout" className="text-lg" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0">
                <header className="flex flex-col gap-4 border-b border-borde bg-white px-4 py-5 sm:px-8 md:flex-row md:items-center md:justify-between print:hidden">
                    <div className="min-w-0 md:flex-1">
                        {etiqueta ? (
                            <p className="text-xs font-bold uppercase tracking-wider text-verde">{etiqueta}</p>
                        ) : null}
                        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-marino sm:text-3xl">{titulo}</h1>
                        {bodegaTrabajo.habilitado && bodegaTrabajo.nombreBodega ? (
                            <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-azul">
                                <Icono nombre="warehouse" className="text-base" />
                                Trabajando en {bodegaTrabajo.nombreBodega}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:shrink-0 md:flex-nowrap">
                        {bodegaTrabajo.habilitado ? (
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-texto-suave">Bodega</span>
                                <select
                                    className="min-w-52 rounded-lg border border-borde bg-white px-3 py-2 text-sm font-semibold text-marino focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/20"
                                    value={bodegaTrabajo.idSucursal || ""}
                                    onChange={(evento) => bodegaTrabajo.seleccionarBodega(evento.target.value)}
                                    aria-label="Bodega de trabajo"
                                >
                                    {bodegaTrabajo.sucursales.length === 0 ? (
                                        <option value="">Cargando bodegas...</option>
                                    ) : bodegaTrabajo.sucursales.map((item) => (
                                        <option key={item.idSucursal} value={item.idSucursal}>
                                            {item.nombreSucursal}
                                            {item.comuna?.nombreComuna ? ` · ${item.comuna.nombreComuna}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                        <div className="text-right">
                            <strong className="block text-sm text-marino">{nombreCompleto(usuario)}</strong>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-texto-suave">{usuario?.rol}</span>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-azul to-marino text-sm font-bold text-white ring-2 ring-celeste">
                            {iniciales}
                        </div>
                    </div>
                </header>

                {/* Contenido de cada página */}
                <div className="mx-contenido mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
