import { iniciarLogin } from "./login.service.js";
import { verificarLogin } from "./verificarLogin.service.js";
import { registrarCliente } from "./auth.service.js";

import {
    generarCodigoAcceso,
    validarCodigoAcceso
} from "./verificacionAcceso.service.js";

import {
    reenviarOtpRegistro as reenviarCodigoRegistro
} from "./reenviarOtpRegistro.service.js";

const ERRORES_OTP = new Set([
    "Solicitud de verificación inválida",
    "Código de verificación inválido",
    "Código de verificación incorrecto",
    "El código ha expirado",
    "Se excedió el número máximo de intentos"
]);

const ERRORES_REGISTRO = new Set([
    "El campo nombre es obligatorio",
    "El campo apellido es obligatorio",
    "El campo rut es obligatorio",
    "El campo correo es obligatorio",
    "El campo nombreUsuario es obligatorio",
    "El campo password es obligatorio",
    "El teléfono debe ser texto",
    "El RUT no es válido",
    "Nombre y apellido admiten máximo 100 caracteres",
    "El correo electrónico no es válido",
    "El nombre de usuario debe tener entre 4 y 50 caracteres",
    "El teléfono admite máximo 20 caracteres",
    "La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
    "La contraseña supera el máximo de 72 bytes",
    "No fue posible registrar la cuenta con los datos proporcionados"
]);

const obtenerCuerpo = (req) => {
    const cuerpo = req.body;

    if (
        !cuerpo ||
        typeof cuerpo !== "object" ||
        Array.isArray(cuerpo)
    ) {
        return {};
    }

    return cuerpo;
};

// POST /api/auth/login
export const login = async (req, res) => {
    res.set("Cache-Control", "no-store");

    try {
        const { identificador, password } = obtenerCuerpo(req);

        if (
            typeof identificador !== "string" ||
            !identificador.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Debe indicar usuario o correo y contraseña"
            });
        }

        const resultado = await iniciarLogin({
            identificador,
            password
        });

        return res.status(200).json({
            ok: true,
            ...resultado
        });
    } catch (error) {
        if (error.message === "Credenciales inválidas") {
            return res.status(401).json({
                ok: false,
                mensaje: "Credenciales inválidas"
            });
        }

        console.error("Error al iniciar login:", error.message);

        return res.status(500).json({
            ok: false,
            mensaje: "No fue posible iniciar sesión"
        });
    }
};

// POST /api/auth/verificar-otp
export const verificarOtpLogin = async (req, res) => {
    res.set("Cache-Control", "no-store");

    try {
        const { challengeId, codigo } = obtenerCuerpo(req);

        const resultado = await verificarLogin({
            challengeId,
            codigo
        });

        return res.status(200).json({
            ok: true,
            ...resultado
        });
    } catch (error) {
        if (ERRORES_OTP.has(error.message)) {
            return res.status(401).json({
                ok: false,
                mensaje: error.message
            });
        }

        console.error(
            "Error verificando OTP de login:",
            error.message
        );

        return res.status(500).json({
            ok: false,
            mensaje: "No fue posible verificar el acceso"
        });
    }
};

// POST /api/auth/registro
export const registrar = async (req, res) => {
    res.set("Cache-Control", "no-store");

    let cuentaCreada = false;

    try {
        const {
            nombre,
            apellido,
            rut,
            correo,
            telefono,
            nombreUsuario,
            password
        } = obtenerCuerpo(req);

        // No se aceptan rol, estado ni permisos desde el formulario.
        const usuario = await registrarCliente({
            nombre,
            apellido,
            rut,
            correo,
            telefono,
            nombreUsuario,
            password
        });

        cuentaCreada = true;

        const resultado = await generarCodigoAcceso(
            usuario.idUsuario,
            "REGISTRO"
        );

        return res.status(201).json({
            ok: true,
            pendienteVerificacion: true,
            mensaje: "Revisa tu correo para verificar la cuenta",
            challengeId: resultado.challengeId,
            expiraEn: resultado.expiraEn
        });
    } catch (error) {
        if (!cuentaCreada && ERRORES_REGISTRO.has(error.message)) {
            return res.status(400).json({
                ok: false,
                mensaje: error.message
            });
        }

        console.error("Error en registro:", error.message);

        if (cuentaCreada) {
            return res.status(503).json({
                ok: false,
                pendienteVerificacion: true,
                mensaje:
                    "La cuenta quedó pendiente de verificación. Solicita el reenvío del código con tu usuario y contraseña."
            });
        }

        return res.status(500).json({
            ok: false,
            mensaje: "No fue posible completar el registro"
        });
    }
};

// POST /api/auth/registro/verificar-otp
export const verificarOtpRegistro = async (req, res) => {
    res.set("Cache-Control", "no-store");

    try {
        const { challengeId, codigo } = obtenerCuerpo(req);

        // El servidor fija el propósito, no el navegador.
        await validarCodigoAcceso(
            challengeId,
            codigo,
            "REGISTRO"
        );

        return res.status(200).json({
            ok: true,
            correoVerificado: true,
            mensaje:
                "Correo verificado. Ya puedes iniciar sesión. El acceso a empresas requiere autorización independiente."
        });
    } catch (error) {
        if (ERRORES_OTP.has(error.message)) {
            return res.status(400).json({
                ok: false,
                mensaje: error.message
            });
        }

        console.error(
            "Error verificando OTP de registro:",
            error.message
        );

        return res.status(500).json({
            ok: false,
            mensaje: "No fue posible verificar el registro"
        });
    }
};

// POST /api/auth/registro/reenviar-otp
export const reenviarOtpRegistro = async (req, res) => {
    res.set("Cache-Control", "no-store");

    try {
        const { identificador, password } = obtenerCuerpo(req);

        const resultado = await reenviarCodigoRegistro({
            identificador,
            password
        });

        return res.status(200).json({
            ok: true,
            mensaje: "Revisa tu correo para verificar la cuenta",
            ...resultado
        });
    } catch (error) {
        const mensajeCredenciales =
            "No fue posible reenviar el código con los datos proporcionados";

        if (error.message === mensajeCredenciales) {
            return res.status(400).json({
                ok: false,
                mensaje: mensajeCredenciales
            });
        }

        if (
            error.message ===
            "No fue posible enviar el código de verificación"
        ) {
            return res.status(503).json({
                ok: false,
                mensaje:
                    "No fue posible enviar el código. Intenta más tarde."
            });
        }

        console.error(
            "Error al reenviar OTP de registro:",
            error.message
        );

        return res.status(500).json({
            ok: false,
            mensaje: "No fue posible completar la solicitud"
        });
    }
};