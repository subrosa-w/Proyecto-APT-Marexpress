import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Message from "../components/Message.jsx";

const estadoInicial = {
    nombre: "",
    apellido: "",
    rut: "",
    telefono: "",
    correo: "",
    nombreUsuario: "",
    password: "",
    confirmarPassword: ""
};

export default function RegistroPage() {
    const [formulario, setFormulario] = useState(estadoInicial);
    const [challengeId, setChallengeId] = useState(null);
    const [codigo, setCodigo] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState("info");
    const [verificado, setVerificado] = useState(false);

    const actualizar = (campo, valor) => {
        setFormulario((prev) => ({ ...prev, [campo]: valor }));
    };

    const aviso = (texto, tipo = "info") => {
        setMensaje(texto);
        setTipoMensaje(tipo);
    };

    const registrar = async (event) => {
        event.preventDefault();
        aviso("");

        if (formulario.password !== formulario.confirmarPassword) {
            aviso("Las contraseñas no coinciden.", "error");
            return;
        }

        setCargando(true);

        try {
            const datos = await api("/auth/registro", {
                method: "POST",
                body: JSON.stringify({
                    nombre: formulario.nombre,
                    apellido: formulario.apellido,
                    rut: formulario.rut,
                    telefono: formulario.telefono,
                    correo: formulario.correo,
                    nombreUsuario: formulario.nombreUsuario,
                    password: formulario.password
                })
            });

            setChallengeId(datos.challengeId);
            aviso(datos.mensaje || "Revisa tu correo para verificar la cuenta", "success");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    const verificar = async (event) => {
        event.preventDefault();
        setCargando(true);
        aviso("");

        try {
            const datos = await api("/auth/registro/verificar-otp", {
                method: "POST",
                body: JSON.stringify({
                    challengeId,
                    codigo: codigo.trim()
                })
            });
            setVerificado(true);
            aviso(datos.mensaje, "success");
        } catch (error) {
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    return (
        <>
            <header className="site-header">
                <nav className="navbar">
                    <Link className="navbar-brand" to="/">MAREXPRESS</Link>
                    <div className="navbar-links">
                        <Link className="nav-access" to="/">Iniciar sesión</Link>
                    </div>
                </nav>
            </header>

            <main className="registro-layout">
                <section className="registro-presentacion">
                    <p className="eyebrow">PORTAL DE CLIENTES</p>
                    <h1>Tus envíos, más cerca.</h1>
                    <p>
                        Crea tu cuenta para consultar tus órdenes de transporte,
                        seguir tus envíos y acceder a la información autorizada.
                    </p>
                </section>

                <section className="registro-card">
                    <header>
                        <p className="eyebrow">BIENVENIDO A MAREXPRESS</p>
                        <h2>Crear cuenta</h2>
                    </header>

                    <Message texto={mensaje} tipo={tipoMensaje} />

                    {verificado ? (
                        <p>
                            <Link to="/">Inicia sesión</Link> con tu usuario y contraseña.
                        </p>
                    ) : !challengeId ? (
                        <form onSubmit={registrar}>
                            <div className="registro-grid">
                                <div className="field">
                                    <label htmlFor="nombre">Nombre *</label>
                                    <input
                                        id="nombre"
                                        value={formulario.nombre}
                                        onChange={(e) => actualizar("nombre", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="apellido">Apellido *</label>
                                    <input
                                        id="apellido"
                                        value={formulario.apellido}
                                        onChange={(e) => actualizar("apellido", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="rut">RUT personal *</label>
                                    <input
                                        id="rut"
                                        value={formulario.rut}
                                        onChange={(e) => actualizar("rut", e.target.value)}
                                        placeholder="12345678-9"
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="telefono">Teléfono</label>
                                    <input
                                        id="telefono"
                                        value={formulario.telefono}
                                        onChange={(e) => actualizar("telefono", e.target.value)}
                                    />
                                </div>
                                <div className="field registro-ancho-completo">
                                    <label htmlFor="correo">Correo electrónico *</label>
                                    <input
                                        id="correo"
                                        type="email"
                                        value={formulario.correo}
                                        onChange={(e) => actualizar("correo", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="field registro-ancho-completo">
                                    <label htmlFor="nombreUsuario">Nombre de usuario *</label>
                                    <input
                                        id="nombreUsuario"
                                        value={formulario.nombreUsuario}
                                        onChange={(e) => actualizar("nombreUsuario", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="password">Contraseña *</label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={formulario.password}
                                        onChange={(e) => actualizar("password", e.target.value)}
                                        minLength={10}
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="confirmarPassword">Confirmar contraseña *</label>
                                    <input
                                        id="confirmarPassword"
                                        type="password"
                                        value={formulario.confirmarPassword}
                                        onChange={(e) => actualizar("confirmarPassword", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <p className="form-note">
                                Usa al menos 10 caracteres, incluyendo mayúscula,
                                minúscula, número y carácter especial.
                            </p>
                            <button className="button-primary" type="submit" disabled={cargando}>
                                {cargando ? "Creando cuenta..." : "Crear cuenta y verificar correo"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verificar}>
                            <div className="field">
                                <label htmlFor="codigo">Código de verificación</label>
                                <input
                                    id="codigo"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="button-primary" type="submit" disabled={cargando}>
                                {cargando ? "Verificando..." : "Verificar correo"}
                            </button>
                        </form>
                    )}
                </section>
            </main>
        </>
    );
}
