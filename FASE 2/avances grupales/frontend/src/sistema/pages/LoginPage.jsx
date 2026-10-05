import { useState } from "react";
import { Link } from "react-router";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import Message from "../components/Message.jsx";
import PanelMarca from "../components/PanelMarca.jsx";
import Icono from "../../components/Icono.jsx";

export default function LoginPage() {
    const { guardarSesion } = useAuth();
    const [identificador, setIdentificador] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [codigo, setCodigo] = useState("");
    const [challengeId, setChallengeId] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState("info");

    const aviso = (texto, tipo = "info") => {
        setMensaje(texto);
        setTipoMensaje(tipo);
    };

    // Paso 1: usuario o correo + contraseña → el backend envía un código al correo
    const iniciarSesion = async (event) => {
        event.preventDefault();
        setCargando(true);
        aviso("");

        try {
            const datos = await api("/auth/login", {
                method: "POST",
                body: JSON.stringify({ identificador, password })
            });

            if (!datos.requiereOtp || !datos.challengeId) {
                throw new Error("La respuesta de autenticación no es válida");
            }

            setChallengeId(datos.challengeId);
            aviso(datos.mensaje || "Código de verificación enviado.", "success");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    // Paso 2: código del correo → el backend entrega el token y el usuario
    const verificarOtp = async (event) => {
        event.preventDefault();
        setCargando(true);
        aviso("");

        try {
            const datos = await api("/auth/verificar-otp", {
                method: "POST",
                body: JSON.stringify({
                    challengeId,
                    codigo: codigo.trim()
                })
            });

            if (!datos.autenticado || !datos.token || !datos.usuario) {
                throw new Error("La respuesta de autenticación no es válida");
            }

            guardarSesion(datos.token, datos.usuario);
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    return (
        <main className="mx-contenido flex min-h-screen w-full flex-col lg:flex-row">
            <PanelMarca
                eyebrow="TRANSPORTE Y LOGÍSTICA"
                titulo="Conectamos más que destinos."
                texto="Gestión, control y seguimiento de tus operaciones logísticas en un solo lugar."
                pie={<>MAREXPRESS · Movimiento que impulsa tu negocio.</>}
            />

            <section
                className="flex w-full flex-col justify-between bg-white p-6 sm:p-10 lg:min-h-screen lg:w-1/2 lg:p-14"
                aria-label="Acceso al sistema"
            >
                <nav className="flex items-center justify-between" aria-label="Navegación principal">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-azul hover:text-marino">
                        <Icono nombre="arrow_back" className="text-base" />
                        Volver al sitio
                    </Link>
                    <Link to="/registro" className="button-secondary">
                        <Icono nombre="person_add" className="text-lg" />
                        Crear usuario
                    </Link>
                </nav>

                <div className="mx-auto my-auto flex w-full max-w-md flex-col gap-5 py-10">
                    <header>
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-borde bg-celeste-suave text-marino">
                            <Icono nombre={challengeId ? "mark_email_unread" : "lock"} className="text-2xl" relleno />
                        </div>
                        <p className="eyebrow">PORTAL MAREXPRESS</p>
                        <h2 className="mt-1 text-[32px] font-extrabold leading-10 tracking-tight text-marino">
                            {challengeId ? "Verifica tu acceso" : "Bienvenido"}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {challengeId
                                ? "Ingresa el código enviado a tu correo."
                                : "Ingresa con tu usuario o correo electrónico."}
                        </p>
                    </header>

                    <Message texto={mensaje} tipo={tipoMensaje} />

                    {!challengeId ? (
                        <form onSubmit={iniciarSesion} className="flex flex-col gap-4">
                            <div className="field">
                                <label htmlFor="identificador">
                                    Usuario o correo electrónico
                                </label>
                                <input
                                    id="identificador"
                                    value={identificador}
                                    onChange={(e) => setIdentificador(e.target.value)}
                                    autoComplete="username"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="password">Contraseña</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        className="pr-24"
                                        type={mostrarPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        className="absolute inset-y-1 right-1 rounded-md px-3 text-xs font-bold text-azul hover:bg-celeste-suave"
                                        type="button"
                                        aria-pressed={mostrarPassword}
                                        onClick={() => setMostrarPassword((v) => !v)}
                                    >
                                        {mostrarPassword ? "Ocultar" : "Mostrar"}
                                    </button>
                                </div>
                            </div>

                            <button
                                className="button-primary h-12 w-full text-base"
                                type="submit"
                                disabled={cargando || !identificador.trim() || !password}
                            >
                                {cargando ? "Verificando..." : "Iniciar sesión"}
                            </button>
                            <p className="form-note">
                                Te enviaremos un código al correo registrado
                                para verificar tu acceso.
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={verificarOtp} className="flex flex-col gap-4">
                            <div className="field">
                                <label htmlFor="codigo">Código de verificación</label>
                                <input
                                    id="codigo"
                                    className="font-mono text-lg tracking-[0.3em]"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    autoFocus
                                    required
                                />
                            </div>
                            <button
                                className="button-primary h-12 w-full text-base"
                                type="submit"
                                disabled={cargando || !codigo.trim()}
                            >
                                {cargando ? "Verificando..." : "Verificar e ingresar"}
                            </button>
                            <button
                                className="button-secondary w-full"
                                type="button"
                                onClick={() => {
                                    setChallengeId(null);
                                    setCodigo("");
                                    setPassword("");
                                    aviso("");
                                }}
                            >
                                Volver al inicio de sesión
                            </button>
                        </form>
                    )}
                </div>

                <footer className="flex flex-col items-center justify-between gap-2 border-t border-borde pt-6 text-center text-xs text-gray-500 sm:flex-row sm:text-left">
                    <span>Acceso para usuarios autorizados.</span>
                    <span>© 2026 Transportes Marexpress</span>
                </footer>
            </section>
        </main>
    );
}
