/*
  VISTA: registro de cliente
  RUTA: /registro
  CSS: sistema.css
  API: POST /api/auth/registro
  FUNCIONES: crea la cuenta de un cliente nuevo
*/
import { useState } from "react";
import { Link } from "react-router";
import { api } from "../api.js";
import Message from "../components/Message.jsx";
import PanelMarca from "../components/PanelMarca.jsx";
import Icono from "../../components/Icono.jsx";
import { CampoCorreo, CampoRut, CampoTelefono } from "../entrada.jsx";

// Campos del alta. Se limpian solo si se vuelve a entrar a la pantalla.
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
    const [mostrarCodigo, setMostrarCodigo] = useState(false);
    const [codigo, setCodigo] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState("info");
    const [verificado, setVerificado] = useState(false);

    // Cambia un campo sin perder el resto del formulario.
    const actualizar = (campo, valor) => {
        setFormulario((prev) => ({ ...prev, [campo]: valor }));
    };

    // Aviso del registro: contraseñas distintas, correo enviado o error del servidor.
    const aviso = (texto, tipo = "info") => {
        setMensaje(texto);
        setTipoMensaje(tipo);
    };

    // Crea la cuenta solo si las dos contraseñas coinciden y pide el código al correo.
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
            setMostrarCodigo(true);
            aviso(`Enviamos el código a ${formulario.correo}. Revisa también el correo no deseado.`, "success");
        } catch (error) {
            if (error.datos?.pendienteVerificacion) {
                setChallengeId(error.datos.challengeId || null);
                setMostrarCodigo(true);
                aviso(error.datos.mensaje || "La cuenta está pendiente. Reenvía el código.", "info");
                return;
            }
            aviso(error.message, "error");
        } finally {
            setCargando(false);
        }
    };

    // Confirma el código. Recién ahí la cuenta queda lista para iniciar sesión.
    const reenviar = async () => {
        setCargando(true);
        aviso("");
        try {
            const datos = await api("/auth/registro/reenviar-otp", {
                method: "POST",
                body: JSON.stringify({
                    identificador: formulario.correo.trim(),
                    password: formulario.password
                })
            });
            setChallengeId(datos.challengeId);
            setMostrarCodigo(true);
            aviso(`Enviamos otro código a ${formulario.correo}. Revisa también el correo no deseado.`, "success");
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
                    ) : !mostrarCodigo ? (
                        <form onSubmit={registrar} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="field">
                                    <label htmlFor="nombre">Nombre *</label>
                                    <input
                                        id="nombre"
                                        placeholder="Nombre"
                                        title="Solo el nombre, sin números"
                                        maxLength={100}
                                        autoComplete="given-name"
                                        value={formulario.nombre}
                                        onChange={(e) => actualizar("nombre", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="apellido">Apellido *</label>
                                    <input
                                        id="apellido"
                                        placeholder="Apellido"
                                        maxLength={100}
                                        autoComplete="family-name"
                                        value={formulario.apellido}
                                        onChange={(e) => actualizar("apellido", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="rut">RUT personal *</label>
                                    <CampoRut id="rut" value={formulario.rut} onChange={(valor) => actualizar("rut", valor)} required />
                                </div>
                                <div className="field">
                                    <label htmlFor="telefono">Teléfono</label>
                                    <CampoTelefono id="telefono" value={formulario.telefono} onChange={(valor) => actualizar("telefono", valor)} />
                                </div>
                                <div className="field sm:col-span-2">
                                    <label htmlFor="correo">Correo electrónico *</label>
                                    <CampoCorreo id="correo" value={formulario.correo} onChange={(valor) => actualizar("correo", valor)} required />
                                </div>
                                <div className="field sm:col-span-2">
                                    <label htmlFor="nombreUsuario">Nombre de usuario *</label>
                                    <input
                                        id="nombreUsuario"
                                        placeholder="usuario.marexpress"
                                        title="Sin espacios. Letras, números, punto o guion"
                                        maxLength={50}
                                        pattern="[A-Za-z0-9._-]{3,50}"
                                        autoComplete="username"
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
                                        title="Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo"
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="confirmarPassword">Confirmar contraseña *</label>
                                    <input
                                        id="confirmarPassword"
                                        type="password"
                                        title="Debe coincidir con la contraseña"
                                        autoComplete="new-password"
                                        minLength={10}
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
                            {/* El backend crea toda cuenta nueva con rol CLIENTE, sin cuenta corriente */}
                            <p className="form-note">
                                Tu cuenta se crea como cliente. Si tu empresa trabaja con cuenta
                                corriente, Marexpress la habilita después.
                            </p>
                            <button className="button-primary h-12 w-full text-base" type="submit" disabled={cargando}>
                                {cargando ? "Creando cuenta..." : "Crear cuenta y verificar correo"}
                            </button>
                            <button className="button-secondary w-full" type="button" disabled={cargando} onClick={reenviar}>
                                Ya me registré: reenviar código
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verificar} className="flex flex-col gap-4">
                            <div className="field">
                                <label htmlFor="codigo">Código de verificación</label>
                                <input
                                    id="codigo"
                                    className="font-mono text-lg tracking-[0.3em]"
                                    placeholder="000000"
                                    title="Código numérico enviado al correo"
                                    inputMode="numeric"
                                    maxLength={8}
                                    pattern="[0-9]{4,8}"
                                    autoComplete="one-time-code"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <button className="button-primary h-12 w-full text-base" type="submit" disabled={cargando || !challengeId}>
                                {cargando ? "Verificando..." : "Verificar correo"}
                            </button>
                            <button className="button-secondary w-full" type="button" disabled={cargando} onClick={reenviar}>
                                Reenviar código
                            </button>
                            <p className="form-note">El código dura 5 minutos y llega a {formulario.correo}.</p>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}
