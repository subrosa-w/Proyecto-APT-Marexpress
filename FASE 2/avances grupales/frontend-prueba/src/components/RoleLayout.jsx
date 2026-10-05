import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useBodegaTrabajo } from "../bodegaTrabajo.jsx";
import { nombreCompleto } from "../utils.js";

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

    useEffect(() => {
        document.body.classList.toggle("mx-menu-lock", menuAbierto);
        return () => document.body.classList.remove("mx-menu-lock");
    }, [menuAbierto]);

    return (
        <div className={`mx-shell${menuAbierto ? " menu-abierto" : ""}`}>
            <div className="mx-topbar">
                <button
                    type="button"
                    className="mx-menu-toggle"
                    aria-expanded={menuAbierto}
                    aria-controls={`${prefijo}-menu`}
                    onClick={() => setMenuAbierto((abierto) => !abierto)}
                >
                    {menuAbierto ? "Cerrar" : "Menú"}
                </button>
                <strong>MAREXPRESS</strong>
                <span>{subtitulo}</span>
            </div>

            {menuAbierto ? (
                <button
                    type="button"
                    className="mx-menu-overlay"
                    aria-label="Cerrar menú"
                    onClick={() => setMenuAbierto(false)}
                />
            ) : null}

            <div className={`${prefijo}-layout`}>
                <aside className={`${prefijo}-sidebar`}>
                    <div className={`${prefijo}-logo`}>
                        <span>MAREXPRESS</span>
                        <small>{subtitulo}</small>
                    </div>

                    <nav
                        id={`${prefijo}-menu`}
                        className={`${prefijo}-menu`}
                        aria-label={`Menú ${subtitulo}`}
                    >
                        {items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `${prefijo}-menu-item${isActive ? " activo" : ""}`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className={`${prefijo}-sidebar-footer`}>
                        <button
                            type="button"
                            className={`${prefijo}-cerrar-sesion`}
                            onClick={cerrarSesion}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </aside>

                <main className={`${prefijo}-main`}>
                    <header className={`${prefijo}-header`}>
                        <div>
                            {etiqueta ? (
                                <p className={`${prefijo}-header-label`}>{etiqueta}</p>
                            ) : null}
                            <h1>{titulo}</h1>
                            {bodegaTrabajo.habilitado && bodegaTrabajo.nombreBodega ? (
                                <p className="mx-bodega-actual">Trabajando en {bodegaTrabajo.nombreBodega}</p>
                            ) : null}
                        </div>

                        <div className={`${prefijo}-usuario`}>
                            {bodegaTrabajo.habilitado ? (
                                <label className="mx-bodega-select">
                                    <span>Bodega</span>
                                    <select
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
                            <div className={`${prefijo}-usuario-texto`}>
                                <strong>{nombreCompleto(usuario)}</strong>
                                <span>{usuario?.rol}</span>
                            </div>
                            <div className={`${prefijo}-avatar`}>{iniciales}</div>
                        </div>
                    </header>

                    {children}
                </main>
            </div>
        </div>
    );
}
