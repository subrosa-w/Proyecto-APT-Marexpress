import { Router } from "express";

import {
    login,
    verificarOtpLogin,
    registrar,
    verificarOtpRegistro,
    reenviarOtpRegistro
} from "../controllers/auth.controller.js";

import {
    limitarLogin,
    limitarRegistro,
    limitarVerificacionOtp,
    limitarReenvioOtp
} from "../middlewares/authRateLimit.middleware.js";

const router = Router();

// Inicio de sesión.
router.post(
    "/login",
    limitarLogin,
    login
);

// Verificación del OTP de login.
router.post(
    "/verificar-otp",
    limitarVerificacionOtp,
    verificarOtpLogin
);

// Creación de una cuenta pendiente de verificar.
router.post(
    "/registro",
    limitarRegistro,
    registrar
);

// Verificación del correo y activación de la cuenta personal.
router.post(
    "/registro/verificar-otp",
    limitarVerificacionOtp,
    verificarOtpRegistro
);

// Reenvío para cuentas pendientes, validando credenciales.
router.post(
    "/registro/reenviar-otp",
    limitarReenvioOtp,
    reenviarOtpRegistro
);

export default router;