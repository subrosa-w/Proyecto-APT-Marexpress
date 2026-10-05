import { useState } from "react";
import { Link } from "react-router";
import { api } from "../api.js";
import Message from "../components/Message.jsx";
import PanelMarca from "../components/PanelMarca.jsx";
import Icono from "../../components/Icono.jsx";

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
        <main className="mx-contenido flex min-h-screen w-full flex-col lg:flex-row">
            <PanelMarca
                eyebrow="PORTAL DE CLIENTES"
                titulo="Tus envíos, más cerca."
                texto="Crea tu cuenta para consultar tus órdenes de transporte, seguir tus envíos y acceder a la información autorizada."
                pie="MAREXPRESS · Movimiento que impulsa tu negocio."
            />

            <section className="flex w-full flex-col bg-white p-6 sm:p-10 lg:min-h-screen lg:w-1/2 lg:p-14">
                <nav className="flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-azul hover:text-marino">
                        <Icono nombre="arrow_back" className="text-base" />
                        Volver al sitio
                    </Link>
                    <Link to="/acceso" className="button-secondary">
                        <Icono nombre="login" className="text-lg" />
                        Iniciar sesión
                    </Link>
                </nav>

                <div className="mx-auto my-auto flex w-full max-w-xl flex-col gap-5 py-10">
                    <header>
                        <p className="eyebrow">BIENVENIDO A MAREXPRESS</p>
                        <h2 className="mt-1 text-[32px] font-extrabold leading-10 tracking-tight text-marino">Crear cuenta</h2>
                    </header>

                    <Message texto={mensaje} tipo={tipoMensaje} />

                    {verificado ? (
                        <p className="text-sm text-gray-600">
                            <Link to="/acceso" className="font-bold text-verde hover:underline">Inicia sesión</Link> con tu usuario y contraseña.
                        </p>
                    ) : !challengeId ? (
                        <form onSubmit={registrar} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                <div className="field sm:col-span-2">
                                    <label htmlFor="correo">Correo electrónico *</label>
                                    <input
                                        id="correo"
                                        type="email"
                                        value={formulario.correo}
                                        onChange={(e) => actualizar("correo", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="field sm:col-span-2">
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
                            <button className="button-primary h-12 w-full text-base" type="submit" disabled={cargando}>
                                {cargando ? "Creando cuenta..." : "Crear cuenta y verificar correo"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verificar} className="flex flex-col gap-4">
                            <div className="field">
                                <label htmlFor="codigo">Código de verificación</label>
                                <input
                                    id="codigo"
                                    className="font-mono text-lg tracking-[0.3em]"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <button className="button-primary h-12 w-full text-base" type="submit" disabled={cargando}>
                                {cargando ? "Verificando..." : "Verificar correo"}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}
