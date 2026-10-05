import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import Message from "../components/Message.jsx";

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
        <>
            <header className="site-header">
                <nav className="navbar" aria-label="Navegación principal">
                    <Link className="navbar-brand" to="/">
                        MAREXPRESS
                    </Link>
                    <div className="navbar-links">
                        <Link className="nav-register" to="/registro">
                            Crear usuario
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="login-layout">
                <section className="brand-panel" aria-label="MAREXPRESS">
                    <Link className="brand" to="/">
                        MAREXPRESS
                    </Link>
                    <div className="brand-content">
                        <p className="eyebrow">TRANSPORTE Y LOGÍSTICA</p>
                        <h1>Conectamos más que destinos.</h1>
                        <p>
                            Gestión, control y seguimiento de tus
                            operaciones logísticas en un solo lugar.
                        </p>
                    </div>
                    <p className="brand-footer">
                        MAREXPRESS<br />
                        Movimiento que impulsa tu negocio.
                    </p>
                </section>

                <section className="access-panel" aria-label="Acceso al sistema">
                    <div className="access-card">
                        <header>
                            <p className="eyebrow">PORTAL MAREXPRESS</p>
                            <h2>
                                {challengeId ? "Verifica tu acceso" : "Bienvenido"}
                            </h2>
                            <p>
                                {challengeId
                                    ? "Ingresa el código enviado a tu correo."
                                    : "Ingresa con tu usuario o correo electrónico."}
                            </p>
                        </header>

                        <Message texto={mensaje} tipo={tipoMensaje} />

                        {!challengeId ? (
                            <form onSubmit={iniciarSesion}>
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
                                    <div className="password-field">
                                        <input
                                            id="password"
                                            type={mostrarPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                            required
                                        />
                                        <button
                                            className="password-toggle"
                                            type="button"
                                            onClick={() => setMostrarPassword((v) => !v)}
                                        >
                                            {mostrarPassword ? "Ocultar" : "Mostrar"}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="button-primary"
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
                            <form onSubmit={verificarOtp}>
                                <div className="field">
                                    <label htmlFor="codigo">Código de verificación</label>
                                    <input
                                        id="codigo"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value)}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        required
                                    />
                                </div>
                                <button
                                    className="button-primary"
                                    type="submit"
                                    disabled={cargando || !codigo.trim()}
                                >
                                    {cargando ? "Verificando..." : "Verificar e ingresar"}
                                </button>
                                <button
                                    className="button-secondary"
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

                        <footer className="access-footer">
                            Acceso para usuarios autorizados.
                        </footer>
                    </div>
                </section>
            </main>
        </>
    );
}
